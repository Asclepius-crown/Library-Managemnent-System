import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Sub-components & hooks
import useToast from "./Common/Catalog/useToast";
import Header from "./Common/Catalog/Header";
import FilterBar from "./Common/Catalog/FilterBar";
import BookGrid from "./Common/Catalog/BookGrid";
import Pagination from "./Common/Catalog/Pagination";
import AddEditModal from "./Common/Catalog/AddEditModal";
import BulkImportModal from "./Common/Catalog/BulkImportModal";
import ChangePasswordModal from "./Common/Catalog/ChangePassword";
import ToastArea from "./Common/Catalog/ToastArea";
import ManageCopiesModal from "./Common/Catalog/ManageCopiesModal"; // New import
import { useAuth } from "./AuthContext"; // Import useAuth

import api from "../api/axiosClient";
import { PlusCircle, Trash2, BookDashed } from "lucide-react"; // Import new icons

const genres = [
  "All",
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Environmental Engineering",
  "Humanity",
];
const sortOptions = [
  { label: "Title (A-Z)", value: "title_asc" },
  { label: "Title (Z-A)", value: "title_desc" },
  { label: "Most Published", value: "publishedCount_desc" },
];
const PAGE_SIZE = 12;
const DEBOUNCE_DELAY = 300;

export default function CatalogPage() {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const { user } = useAuth(); // Get user from context

  // --- State ---
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  // const [loadingToggle, setLoadingToggle] = useState(false); // No longer needed for grouped toggle

  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedSortIndex, setSelectedSortIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null); // Now represents the grouped book metadata
  const [newBook, setNewBook] = useState({ // Now represents a new grouped book with 1 copy
    title: "",
    author: "",
    publishedCount: 0,
    location: "",
    genre: genres[1],
    status: "Available", // This is the status of the first copy
    height: "",
    publisher: "",
    description: "",
    imageUrl: ""
  });
  const [errors, setErrors] = useState({});

  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "" });
  const [loadingChangePass, setLoadingChangePass] = useState(false);

  // --- Bulk Selection State ---
  const [selectedBooks, setSelectedBooks] = useState([]); // Stores stringified _id objects
  const isSelectAll = books.length > 0 && selectedBooks.length === books.length;
  const isBulkActionsEnabled = selectedBooks.length > 0;

  // --- Manage Copies Modal State ---
  const [showManageCopiesModal, setShowManageCopiesModal] = useState(false);
  const [bookToManageCopies, setBookToManageCopies] = useState(null);

  // --- Close Profile Menu Logic ---
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setShowProfileMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // --- Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1); // Reset to page 1 on search change
      setSelectedBooks([]); // Clear selection on search/filter change
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- Fetch Books (Server-Side) ---
  const fetchBooks = useCallback(async () => {
    setLoadingFetch(true);
    try {
      const sortValue = sortOptions[selectedSortIndex].value;
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearchTerm,
        genre: selectedGenre,
        status: selectedAvailability,
        sort: sortValue,
      };

      const res = await api.get("/books/bulk", { params });
      
      if (res.data && Array.isArray(res.data.books)) {
        setBooks(res.data.books);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setBooks([]);
        setTotalPages(1);
      }
      setSelectedBooks([]); // Clear selection after fetching new books

    } catch (error) {
      console.error("Error fetching books:", error);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", error.response.data);
      }
      addToast("Failed to load books.", "error");
      setBooks([]);
    } finally {
      setLoadingFetch(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedGenre,
    selectedAvailability,
    selectedSortIndex,
    addToast
  ]); // Dependencies for fetching

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Reset page when filters change (excluding page itself).
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, selectedAvailability, selectedSortIndex]);


  // --- Validation ---
  const validateBook = (book) => {
    let errs = {};
    if (!book.title.trim()) errs.title = "Title is required";
    if (!book.author.trim()) errs.author = "Author is required";
    if (isNaN(book.publishedCount) || book.publishedCount < 0)
      errs.publishedCount = "Must be >= 0";
    return errs;
  };

  // --- CRUD Handlers (Adapted for Grouped Books) ---
  const handleAddBook = useCallback(async () => {
    const errs = validateBook(newBook);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoadingAdd(true);
    try {
      // Create a single copy of the new book (metadata defines the group)
      await api.post("/books", newBook); // backend createBook expects metadata for one copy
      addToast("Book added", "success");
      setShowAddEditModal(false);
      fetchBooks(); // Re-fetch to show new data with counts
    } catch {
      addToast("Failed to add", "error");
    }
    setLoadingAdd(false);
  }, [newBook, fetchBooks, addToast]);

  // Handle Update for Grouped Book Metadata
  const handleUpdateBook = useCallback(async () => {
    const errs = validateBook(editingBook);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoadingUpdate(true);
    try {
      // Use the new API for grouped metadata update
      const groupedIdString = encodeURIComponent(JSON.stringify(editingBook._id));
      await api.put(`/books/grouped/${groupedIdString}`, editingBook);
      addToast("Book metadata updated", "success");
      setShowAddEditModal(false);
      fetchBooks();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update metadata", "error");
    }
    setLoadingUpdate(false);
  }, [editingBook, fetchBooks, addToast]);

  // Handle Delete for Grouped Book (all copies)
  const handleDeleteBook = useCallback(async (groupedBookId) => {
    if (!window.confirm("Delete this book and ALL its copies?")) return;
    setLoadingDelete(true);
    try {
      // Use the new API for grouped deletion
      const groupedIdString = encodeURIComponent(JSON.stringify(groupedBookId));
      const res = await api.delete(`/books/grouped/${groupedIdString}`);
      addToast(res.data.message || "Book and all copies deleted", "success");
      fetchBooks();
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to delete book and copies",
        "error"
      );
    }
    setLoadingDelete(false);
  }, [fetchBooks, addToast]);

  // handleToggleStatus is removed from grouped book cards

  const handleEdit = useCallback((groupedBook) => {
    setEditingBook(groupedBook); // Pass the grouped book object
    setErrors({});
    setShowAddEditModal(true);
  }, []);

  // New: Handle Borrow (Student) - still uses copy ID
  const handleBorrow = useCallback(async (copyId) => {
    if (!window.confirm(`Do you want to borrow this book?`)) return;
    try {
      await api.post(`/books/${copyId}/borrow`);
      addToast("Book borrowed successfully!", "success");
      fetchBooks();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to borrow book", "error");
    }
  }, [fetchBooks, addToast]);

  // New: Handle Reserve (Student)
  const handleReserve = useCallback(async (book) => {
    if (!window.confirm(`Do you want to reserve "${book.title}"?`)) return;
    try {
      await api.post('/reservations', { bookId: book._id });
      addToast("Book reserved successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to reserve book", "error");
    }
  }, [addToast]);

  // --- Bulk Action Handlers ---
  const handleSelectBook = useCallback((groupedBookIdObject, isSelected) => { // bookId is the grouped _id OBJECT
    const stringifiedId = JSON.stringify(groupedBookIdObject);
    setSelectedBooks((prevSelected) =>
      isSelected
        ? [...prevSelected, stringifiedId]
        : prevSelected.filter((id) => id !== stringifiedId)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map((book) => JSON.stringify(book._id))); // Stringify _id objects
    }
  }, [isSelectAll, books]);

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedBooks.length} selected book types and ALL their copies?`)) return;
    setLoadingDelete(true);
    try {
      // Iterate over selected stringified grouped book IDs and call grouped delete for each
      await Promise.all(selectedBooks.map(stringifiedGroupedId => {
        const groupedId = JSON.parse(stringifiedGroupedId); // Parse back to object
        const groupedIdString = encodeURIComponent(JSON.stringify(groupedId));
        return api.delete(`/books/grouped/${groupedIdString}`);
      }));
      addToast(`${selectedBooks.length} book types and their copies deleted`, "success");
      fetchBooks();
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to bulk delete books",
        "error"
      );
    }
    setLoadingDelete(false);
  }, [selectedBooks, fetchBooks, addToast]);

  const handleBulkChangeStatus = useCallback(async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status of ALL copies of ${selectedBooks.length} book types to "${newStatus}"?`)) return;
    setLoadingUpdate(true);
    try {
      // This will update ALL physical copies for the selected grouped books
      await Promise.all(selectedBooks.map(stringifiedGroupedId => {
        const groupedId = JSON.parse(stringifiedGroupedId); // Parse back to object
        const groupedIdString = encodeURIComponent(JSON.stringify(groupedId));
        // We only update status, other metadata stays
        return api.put(`/books/grouped/${groupedIdString}`, { status: newStatus });
      }));
      addToast(`${selectedBooks.length} book types status updated to ${newStatus}`, "success");
      fetchBooks();
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to bulk update status",
        "error"
      );
    }
    setLoadingUpdate(false);
  }, [selectedBooks, fetchBooks, addToast]);


  // --- UI Actions ---
  const openAddModal = useCallback(() => {
    setEditingBook(null); // Clear for "Add" mode
    setNewBook({ // Default values for new book
      title: "",
      author: "",
      publishedCount: 0,
      location: "",
      genre: genres[1],
      status: "Available", // This is the status of the first copy
      height: "",
      publisher: "",
      description: "",
      imageUrl: ""
    });
    setErrors({});
    setShowAddEditModal(true);
  }, []);

  const handleManageCopies = useCallback((groupedBook) => {
    setBookToManageCopies(groupedBook);
    setShowManageCopiesModal(true);
  }, []);

  // New: Toggle Feature
  const handleToggleFeature = useCallback(async (groupedBook) => {
    try {
        const groupedIdString = encodeURIComponent(JSON.stringify(groupedBook._id));
        const res = await api.put(`/books/grouped/${groupedIdString}/feature`);
        addToast(res.data.message, "success");
        fetchBooks(); // Refresh to show changes
    } catch (err) {
        addToast(err.response?.data?.message || "Failed to toggle feature", "error");
    }
  }, [fetchBooks, addToast]);

  const openChangePasswordModal = useCallback(() => {
    setPasswords({ current: "", newPass: "" });
    setShowProfileMenu(false);
    setShowChangePassword(true);
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!passwords.current || !passwords.newPass) {
      addToast("Please fill out both fields", "error");
      return;
    }
    try {
      setLoadingChangePass(true);
      await api.post("/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      addToast("Password changed successfully", "success");
      setShowChangePassword(false);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to change password",
        "error"
      );
    } finally {
      setLoadingChangePass(false);
    }
  }, [passwords, addToast]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-black text-gray-300 p-4 sm:p-8">
      <ToastArea toasts={toasts} />

      <Header
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
        openChangePasswordModal={openChangePasswordModal}
      />

      {/* Admin Actions */}
      {user?.role === 'admin' && (
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4">
                <button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
                >
                    <PlusCircle size={20} /> Add Book
                </button>
                <button
                    onClick={() => setShowCsvImportModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
                >
                    <PlusCircle size={20} /> Bulk Add (CSV/XLSX)
                </button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2 text-gray-400">
                    <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                    />
                    <span>Select All ({selectedBooks.length})</span>
                </label>

                <button
                    onClick={handleBulkDelete}
                    disabled={!isBulkActionsEnabled || loadingDelete}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                        isBulkActionsEnabled ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    <Trash2 size={20} /> Delete Selected
                </button>
                <div className="relative">
                    <select
                        onChange={(e) => handleBulkChangeStatus(e.target.value)}
                        value="" // Reset after selection
                        disabled={!isBulkActionsEnabled || loadingUpdate}
                        className={`bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg appearance-none transition ${
                            isBulkActionsEnabled ? "hover:border-indigo-500" : "text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        <option value="" disabled>Change Status...</option>
                        <option value="Available">Set Available</option>
                        <option value="Borrowed">Set Borrowed</option>
                    </select>
                    <BookDashed className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>
        </div>
      )}

      <FilterBar
        genres={genres}
        sortOptions={sortOptions}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        selectedAvailability={selectedAvailability}
        setSelectedAvailability={setSelectedAvailability}
        selectedSortIndex={selectedSortIndex}
        setSelectedSortIndex={setSelectedSortIndex}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setCurrentPage={setCurrentPage}
      />

      {/* Render Logic without flicker */}
      <BookGrid
        books={books}
        loading={loadingFetch}
        onEdit={user?.role === 'admin' ? handleEdit : null}
        onDelete={user?.role === 'admin' ? handleDeleteBook : null}
        onBorrow={user?.role === 'student' ? handleBorrow : null}
        onReserve={user?.role === 'student' ? handleReserve : null} // Pass handleReserve
        onManageCopies={user?.role === 'admin' ? handleManageCopies : null} // New prop
        onToggleFeature={user?.role === 'admin' ? handleToggleFeature : null} // New prop
        isAdmin={user?.role === 'admin'}
        selectedBooks={selectedBooks} // Pass stringified selectedBooks
        onSelectBook={handleSelectBook} // Pass selection handler
      />
      
      {!loadingFetch && books.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* Modals */}
      <AddEditModal
        show={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        editingBook={editingBook}
        newBook={newBook}
        setEditingBook={setEditingBook}
        setNewBook={setNewBook}
        errors={errors}
        handleAddBook={handleAddBook}
        handleUpdateBook={handleUpdateBook}
        loadingAdd={loadingAdd}
        loadingUpdate={loadingUpdate}
        genres={genres}
      />

      <BulkImportModal
        show={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        fetchBooks={fetchBooks}
      />

      <ChangePasswordModal
        show={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        passwords={passwords}
        setPasswords={setPasswords}
        handleChangePassword={handleChangePassword}
        loadingChangePass={loadingChangePass}
      />

      <ManageCopiesModal // New modal
        show={showManageCopiesModal}
        onClose={() => setShowManageCopiesModal(false)}
        groupedBook={bookToManageCopies}
        fetchBooks={fetchBooks} // Pass fetchBooks to refresh main list after copy changes
      />
    </div>
  );
}