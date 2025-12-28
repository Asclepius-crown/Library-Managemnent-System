import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu } from "lucide-react"; // Added Menu icon
import api from "../api/axiosClient";
import Header from "./Common/Catalog/Header"; // Import shared Header

// Sidebar reusable component
const SidebarSection = ({
  title,
  items,
  selectedItem,
  onSelect,
  interactive = true,
}) => (
  <section className="mb-8" aria-label={title}>
    <h3 className="text-gray-300 border-b border-gray-700 pb-2 mb-4 font-semibold">
      {title}
    </h3>
    <ul>
      {items.map((item) => (
        <li key={item}>
          {interactive ? (
            <button
              type="button"
              aria-current={selectedItem === item ? "true" : undefined}
              aria-pressed={selectedItem === item}
              onClick={() => onSelect(item)}
              className={`w-full text-left py-2 rounded
                ${
                  selectedItem === item
                    ? "text-blue-400 font-semibold"
                    : "text-gray-400 hover:text-blue-400"
                }
                focus:outline-none focus:text-blue-400 focus:ring-2 focus:ring-blue-400`}
            >
              {item}
            </button>
          ) : (
            <span
              className="text-gray-500 select-none cursor-default block py-2"
              aria-disabled="true"
            >
              {item}
            </span>
          )}
        </li>
      ))}
    </ul>
  </section>
);

// Data arrays
const categories = [
  "All",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Computer Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Environmental Engineering",
];

const fileTypes = ["All"];

const DigitalLibraryPage = () => {
  const navigate = useNavigate();

  // Component state
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const [menuOpen, setMenuOpen] = useState(false);
  
  // Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close header menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch books data triggered by user actions
  const fetchBooks = useCallback(
    async (q, category, type) => {
      setLoading(true);
      setLoadingError(null);
      try {
        // Combine search query with category filter for better search results
        const queryWithCategory =
          category && category !== "All" ? `${q} ${category}` : q;

        const body = {
          q: queryWithCategory?.trim() || "programming",
          type: type !== "All" ? type : undefined,
        };

        const response = await api.post(`/google-books`, body, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.data?.items) {
          setBooks(response.data.items);
        } else {
          setBooks([]);
        }
      } catch {
        setLoadingError("Failed to load book data.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch default books on mount
  useEffect(() => {
    fetchBooks("programming", "All", "All");
  }, [fetchBooks]);

  // Fetch books reactively when searchQuery, selectedCategory or selectedType changes
  useEffect(() => {
    fetchBooks(searchQuery, selectedCategory, selectedType);
  }, [searchQuery, selectedCategory, selectedType, fetchBooks]);

  // User action handlers
  const onSearchClick = () => {
    fetchBooks(searchQuery, selectedCategory, selectedType);
    setMenuOpen(false); // close sidebar on search
  };

  const toggleMenu = () => setMenuOpen((v) => !v);

  // Filter out invalid books
  const filteredBooks = useMemo(() => books.filter(Boolean), [books]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-indigo-900 to-black text-gray-200 font-sans">
      {/* Shared Header */}
      <div className="px-4 py-2 bg-gray-900 shadow-md z-50">
        <Header 
          navigate={navigate}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          profileMenuRef={profileMenuRef}
        />
      </div>

      {/* Toolbar: Hamburger + Search */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4 flex items-center gap-4 sticky top-0 z-40 backdrop-blur-md">
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close sidebar" : "Open sidebar"}
          className="p-2 rounded hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-lg relative flex items-center">
          <input
            type="search"
            className="w-full rounded-full bg-gray-900 border border-gray-600 py-2 pl-10 pr-4 focus:border-blue-400 outline-none transition text-sm sm:text-base"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchClick();
            }}
          />
          <Search
            className="absolute left-3 top-2.5 text-gray-500 pointer-events-none"
            size={18}
          />
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <nav
          className={`w-64 bg-indigo-900 border-r border-indigo-700 p-5 overflow-y-auto fixed top-[130px] bottom-0 left-0 z-30 flex flex-col transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="sidebar navigation"
          aria-hidden={!menuOpen}
          style={{
            height: "calc(100vh - 130px)", // adjusted for header + toolbar
          }}
        >
          <SidebarSection
            title="Engineering Disciplines"
            items={categories}
            selectedItem={selectedCategory}
            onSelect={(c) => {
              setSelectedCategory(c);
              setMenuOpen(false);
            }}
            interactive
          />
          <SidebarSection
            title="Resource Types"
            items={fileTypes}
            selectedItem={selectedType}
            onSelect={(t) => {
              setSelectedType(t);
              setMenuOpen(false);
            }}
            interactive
          />
        </nav>

        {/* Overlay to close sidebar */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-grow p-6 overflow-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-20">Loading books...</div>
          ) : loadingError ? (
            <div className="text-center text-red-500 py-20">{loadingError}</div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center text-gray-400 py-20">No resources found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const id = book._id || book.id || book.etag || null;
                if (!id) return null;

                const title = book.title || book.volumeInfo?.title || "Untitled";
                const authors = book.author
                  ? [book.author]
                  : book.authors || book.volumeInfo?.authors || ["Unknown"];
                const categories = book.category
                  ? [book.category]
                  : book.categories || book.volumeInfo?.categories || [];
                const imageSrc =
                  book.coverImage ||
                  book.imageLinks?.thumbnail ||
                  book.volumeInfo?.imageLinks?.thumbnail ||
                  "https://via.placeholder.com/128x192?text=No+Image";
                const type = book.type || book.printType || "Unknown";

                return (
                  <article
                    key={String(id)}
                    className="flex flex-col bg-transparent rounded-lg border border-indigo-700 shadow-md hover:shadow-lg transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={imageSrc}
                        alt={`Cover of ${title}`}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                      <span className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-xs text-gray-200 rounded select-none">
                        {type}
                      </span>
                    </div>
                    <div className="flex flex-col flex-grow p-4">
                      <h3
                        className="text-blue-400 font-semibold text-lg mb-1 line-clamp-2"
                        title={title}
                      >
                        {title}
                      </h3>
                      <p
                        className="text-gray-400 text-sm truncate"
                        title={authors.join(", ")}
                      >
                        {authors.join(", ")}
                      </p>
                      <p
                        className="text-blue-400 text-xs mt-1"
                        title={categories[0]}
                      >
                        {categories[0]}
                      </p>
                      <div className="mt-auto flex gap-3">
                        <button
                          type="button"
                          className="flex-grow bg-blue-600 hover:bg-blue-700 rounded text-white py-2 text-sm"
                          onClick={() => {
                            const readUrl = book.previewLink || book.volumeInfo?.previewLink;
                            if (readUrl) {
                              window.open(readUrl, "_blank", "noopener,noreferrer");
                            } else {
                              alert(`Reading not available for '${title}'`);
                            }
                          }}
                        >
                          Read Now
                        </button>
                        {(type === "eBook" || type === "BOOK") && (
                          <button
                            type="button"
                            className="flex-grow bg-green-600 hover:bg-green-700 rounded text-white py-2 text-sm"
                            onClick={() =>
                              alert(`Download '${title}' - placeholder`)
                            }
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DigitalLibraryPage;
