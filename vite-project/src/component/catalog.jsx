import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PlusCircle, Trash2, BookDashed, Search, Filter, 
  ArrowRight, BookOpen, Star, Sparkles 
} from "lucide-react";

// Sub-components & hooks
import useToast from "./Common/Catalog/useToast";
import Header from "./Common/Catalog/Header";
import BookGrid from "./Common/Catalog/BookGrid";
import Pagination from "./Common/Catalog/Pagination";
import AddEditModal from "./Common/Catalog/AddEditModal";
import BulkImportModal from "./Common/Catalog/BulkImportModal";
import ChangePasswordModal from "./Common/Catalog/ChangePassword";
import ToastArea from "./Common/Catalog/ToastArea";
import ManageCopiesModal from "./Common/Catalog/ManageCopiesModal";
import { useAuth } from "./AuthContext";

import api from "../api/axiosClient";

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

// --- Sub-Components for New UI ---

const TagCloud = ({ tags, selected, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide select-none mb-6">
    {tags.map((tag) => (
      <button
        key={tag}
        onClick={() => onSelect(tag)}
        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
          selected === tag
            ? "bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white"
        }`}
      >
        {tag}
      </button>
    ))}
  </div>
);

const HeroSection = ({ featuredBook }) => {
  if (!featuredBook) return null;
  // Fallback if no featured book is passed, or show a generic "Welcome" banner
  const imageSrc = featuredBook.imageUrl || "https://via.placeholder.com/300x450?text=Featured";

  return (
    <div className="relative w-full h-[400px] md:h-[450px] bg-gradient-to-r from-gray-900 to-indigo-950 overflow-hidden mb-12 rounded-3xl w-auto shadow-2xl border border-white/5">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      {/* Abstract Background Shapes */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center h-full p-8 md:p-12 gap-8">
        <div className="w-full md:w-1/3 flex justify-center md:justify-end order-2 md:order-1">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src={imageSrc} 
              alt={featuredBook.title} 
              className="h-48 md:h-72 w-auto object-cover rounded-lg shadow-2xl transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500 border border-white/10"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3 text-center md:text-left space-y-4 order-1 md:order-2">
          <div className="flex items-center justify-center md:justify-start gap-2">
             <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
               <Sparkles size={12} /> Book of the Week
             </span>
             <span className="text-gray-400 text-xs uppercase tracking-widest">{featuredBook.genre}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
            {featuredBook.title}
          </h2>
          <p className="text-gray-300 text-sm md:text-lg max-w-xl line-clamp-3 font-light">
            {featuredBook.description || `Discover the world of ${featuredBook.genre} with this essential read by ${featuredBook.author}. Available now for borrowing.`}
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
             {/* We can't easily link to "Borrow" directly from here without context, but we can scroll or show details */}
             <div className="flex items-center gap-2 text-cyan-400 font-medium animate-pulse">
                <ArrowRight size={20} /> Check availability below
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function CatalogPage() {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const { user, studentProfile, setStudentProfile } = useAuth();

  // --- State ---
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedSortIndex, setSelectedSortIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredBook, setFeaturedBook] = useState(null);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [newBook, setNewBook] = useState({ 
    title: "", author: "", publishedCount: 0, location: "", genre: genres[1],
    status: "Available", height: "", publisher: "", description: "", imageUrl: ""
  });
  const [errors, setErrors] = useState({});

  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "" });
  const [loadingChangePass, setLoadingChangePass] = useState(false);

  // --- Bulk Selection State ---
  const [selectedBooks, setSelectedBooks] = useState([]);
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
      setSelectedBooks([]);
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
        
        // Find a featured book (either explicitly featured or just the first one)
        const featured = res.data.books.find(b => b.isFeatured) || res.data.books[0];
        setFeaturedBook(featured);
      } else {
        setBooks([]);
        setTotalPages(1);
      }
      setSelectedBooks([]);

    } catch {
      addToast("Failed to load books.", "error");
      setBooks([]);
    } finally {
      setLoadingFetch(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedGenre, selectedAvailability, selectedSortIndex, addToast]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // --- Handlers (CRUD, Bulk, etc.) ---
  
  const validateBook = (book) => {
    let errs = {};
    if (!book.title.trim()) errs.title = "Title is required";
    if (!book.author.trim()) errs.author = "Author is required";
    return errs;
  };

  const handleAddBook = useCallback(async () => {
    const errs = validateBook(newBook);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoadingAdd(true);
    try {
      await api.post("/books", newBook);
      addToast("Book added", "success");
      setShowAddEditModal(false);
      fetchBooks();
    } catch {
      addToast("Failed to add", "error");
    }
    setLoadingAdd(false);
  }, [newBook, fetchBooks, addToast]);

  const handleUpdateBook = useCallback(async () => {
    const errs = validateBook(editingBook);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoadingUpdate(true);
    try {
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

  const handleDeleteBook = useCallback(async (groupedBookId) => {
    if (!window.confirm("Delete this book and ALL its copies?")) return;
    setLoadingDelete(true);
    try {
      const groupedIdString = encodeURIComponent(JSON.stringify(groupedBookId));
      await api.delete(`/books/grouped/${groupedIdString}`);
      addToast("Book and all copies deleted", "success");
      fetchBooks();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
    setLoadingDelete(false);
  }, [fetchBooks, addToast]);

  const handleEdit = useCallback((groupedBook) => {
    setEditingBook(groupedBook);
    setErrors({});
    setShowAddEditModal(true);
  }, []);

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

  const handleReserve = useCallback(async (book) => {
    if (!window.confirm(`Do you want to reserve "${book.title}"?`)) return;
    try {
      await api.post('/reservations', { bookId: book._id });
      addToast("Book reserved successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to reserve book", "error");
    }
  }, [addToast]);

  const handleSelectBook = useCallback((groupedBookIdObject, isSelected) => {
    const stringifiedId = JSON.stringify(groupedBookIdObject);
    setSelectedBooks((prev) =>
      isSelected ? [...prev, stringifiedId] : prev.filter((id) => id !== stringifiedId)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isSelectAll) setSelectedBooks([]);
    else setSelectedBooks(books.map((book) => JSON.stringify(book._id)));
  }, [isSelectAll, books]);

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Delete ${selectedBooks.length} book types and copies?`)) return;
    setLoadingDelete(true);
    try {
      await Promise.all(selectedBooks.map(sid => {
        const groupedIdString = encodeURIComponent(sid);
        return api.delete(`/books/grouped/${groupedIdString}`);
      }));
      addToast("Bulk delete successful", "success");
      fetchBooks();
    } catch (err) {
      addToast("Failed to bulk delete", "error");
    }
    setLoadingDelete(false);
  }, [selectedBooks, fetchBooks, addToast]);

  const handleBulkChangeStatus = useCallback(async (newStatus) => {
    if (!window.confirm(`Change status of ${selectedBooks.length} items to "${newStatus}"?`)) return;
    setLoadingUpdate(true);
    try {
      await Promise.all(selectedBooks.map(sid => {
        const groupedIdString = encodeURIComponent(sid);
        return api.put(`/books/grouped/${groupedIdString}`, { status: newStatus });
      }));
      addToast("Status updated", "success");
      fetchBooks();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
    setLoadingUpdate(false);
  }, [selectedBooks, fetchBooks, addToast]);

  const openAddModal = useCallback(() => {
    setEditingBook(null);
    setNewBook({ 
        title: "", author: "", publishedCount: 0, location: "", genre: genres[1], 
        status: "Available", height: "", publisher: "", description: "", imageUrl: "" 
    });
    setErrors({});
    setShowAddEditModal(true);
  }, []);

  const handleManageCopies = useCallback((groupedBook) => {
    setBookToManageCopies(groupedBook);
    setShowManageCopiesModal(true);
  }, []);

  const handleToggleFeature = useCallback(async (groupedBook) => {
    try {
        const groupedIdString = encodeURIComponent(JSON.stringify(groupedBook._id));
        const res = await api.put(`/books/grouped/${groupedIdString}/feature`);
        addToast(res.data.message, "success");
        fetchBooks();
    } catch (err) {
        addToast("Failed to toggle feature", "error");
    }
  }, [fetchBooks, addToast]);

  const handleToggleWishlist = useCallback(async (bookId) => {
    if (!studentProfile) { addToast("Student profile not found.", "error"); return; }
    const isInWishlist = studentProfile.wishlist?.includes(bookId);
    try {
      if (isInWishlist) {
        const res = await api.delete('/students/wishlist', { data: { rollNo: studentProfile.rollNo, bookId } });
        setStudentProfile(res.data);
        addToast("Removed from wishlist", "info");
      } else {
        const res = await api.post('/students/wishlist', { rollNo: studentProfile.rollNo, bookId });
        setStudentProfile(res.data);
        addToast("Added to wishlist", "success");
      }
    } catch (err) {
      addToast("Failed to update wishlist", "error");
    }
  }, [studentProfile, setStudentProfile, addToast]);

  const openChangePasswordModal = useCallback(() => {
    setPasswords({ current: "", newPass: "" });
    setShowProfileMenu(false);
    setShowChangePassword(true);
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!passwords.current || !passwords.newPass) { addToast("Please fill out both fields", "error"); return; }
    try {
      setLoadingChangePass(true);
      await api.post("/change-password", { currentPassword: passwords.current, newPassword: passwords.newPass });
      addToast("Password changed successfully", "success");
      setShowChangePassword(false);
    } catch (err) {
      addToast("Failed to change password", "error");
    } finally {
      setLoadingChangePass(false);
    }
  }, [passwords, addToast]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
      <ToastArea toasts={toasts} />
      
      <Header
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      {/* Main Content Container */}
      <div className="px-4 md:px-12 max-w-[1920px] mx-auto pb-12">
        
        {/* Search Toolbar */}
        <div className="mb-8 sticky top-4 z-30">
            <div className="relative max-w-2xl mx-auto">
                <input
                    type="text"
                    placeholder="Search the Physical Collection..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xl transition-all"
                />
                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <div className="absolute right-2 top-2 p-1.5 bg-gray-800 rounded-full border border-gray-700 group cursor-pointer hover:border-cyan-500 transition-colors">
                    <Filter size={16} className="text-gray-400 group-hover:text-cyan-400" />
                </div>
            </div>
        </div>

        {/* Hero Section */}
        {!searchTerm && currentPage === 1 && !loadingFetch && (
             <HeroSection featuredBook={featuredBook} />
        )}

        {/* Filters (Tag Cloud) */}
        <TagCloud 
            tags={genres} 
            selected={selectedGenre} 
            onSelect={(tag) => { setSelectedGenre(tag); setCurrentPage(1); }} 
        />

        {/* Admin Control Bar */}
        {user?.role === 'admin' && (
             <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
                <div className="flex gap-3">
                    <button
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition font-medium shadow-lg shadow-indigo-600/20"
                    >
                        <PlusCircle size={18} /> Add Book
                    </button>
                    <button
                        onClick={() => setShowCsvImportModal(true)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-5 py-2.5 rounded-xl flex items-center gap-2 transition"
                    >
                        <BookOpen size={18} /> Import CSV
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50">
                    <label className="flex items-center space-x-3 text-sm text-gray-400 px-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                            checked={isSelectAll}
                            onChange={handleSelectAll}
                        />
                        <span>Select All ({selectedBooks.length})</span>
                    </label>

                    <div className="h-6 w-px bg-gray-700 mx-2"></div>

                    <button
                        onClick={handleBulkDelete}
                        disabled={!isBulkActionsEnabled || loadingDelete}
                        className={`p-2 rounded-lg transition ${
                            isBulkActionsEnabled ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-gray-600 cursor-not-allowed"
                        }`}
                        title="Delete Selected"
                    >
                        <Trash2 size={18} />
                    </button>
                    
                    <div className="relative">
                        <select
                            onChange={(e) => handleBulkChangeStatus(e.target.value)}
                            value=""
                            disabled={!isBulkActionsEnabled || loadingUpdate}
                            className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer ${
                                isBulkActionsEnabled ? "text-indigo-400 hover:text-indigo-300" : "text-gray-600"
                            }`}
                        >
                            <option value="" disabled>Set Status</option>
                            <option value="Available">Available</option>
                            <option value="Borrowed">Borrowed</option>
                        </select>
                    </div>
                </div>
             </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 px-2">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <ArrowRight className="text-cyan-500" /> 
                 {selectedGenre === 'All' ? 'Full Collection' : `${selectedGenre} Books`}
             </h2>
             <div className="flex items-center gap-3">
                 <select 
                   value={selectedSortIndex}
                   onChange={(e) => setSelectedSortIndex(Number(e.target.value))}
                   className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                 >
                    {sortOptions.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
                 </select>
             </div>
        </div>

        {/* Grid */}
        <BookGrid
            books={books}
            loading={loadingFetch}
            onEdit={user?.role === 'admin' ? handleEdit : null}
            onDelete={user?.role === 'admin' ? handleDeleteBook : null}
            onBorrow={user?.role === 'student' ? handleBorrow : null}
            onReserve={user?.role === 'student' ? handleReserve : null}
            onManageCopies={user?.role === 'admin' ? handleManageCopies : null}
            onToggleFeature={user?.role === 'admin' ? handleToggleFeature : null}
            onToggleWishlist={user?.role === 'student' ? handleToggleWishlist : null}
            wishlist={studentProfile?.wishlist}
            isAdmin={user?.role === 'admin'}
            selectedBooks={selectedBooks}
            onSelectBook={handleSelectBook}
        />

        {!loadingFetch && books.length > 0 && (
            <div className="mt-12">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            </div>
        )}
      </div>

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
      <BulkImportModal show={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} fetchBooks={fetchBooks} />
      <ChangePasswordModal show={showChangePassword} onClose={() => setShowChangePassword(false)} passwords={passwords} setPasswords={setPasswords} handleChangePassword={handleChangePassword} loadingChangePass={loadingChangePass} />
      <ManageCopiesModal show={showManageCopiesModal} onClose={() => setShowManageCopiesModal(false)} groupedBook={bookToManageCopies} fetchBooks={fetchBooks} />

    </div>
  );
}
