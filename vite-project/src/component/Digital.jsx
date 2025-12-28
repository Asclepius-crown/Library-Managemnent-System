import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Download, Star, Filter, ArrowRight, ExternalLink } from "lucide-react";
import api from "../api/axiosClient";
import Header from "./Common/Catalog/Header";

// --- Components ---

const TagCloud = ({ tags, selected, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-12 select-none">
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

const HeroSection = ({ book }) => {
  if (!book) return null;
  const imageSrc = book.volumeInfo?.imageLinks?.extraLarge || book.volumeInfo?.imageLinks?.thumbnail || "https://via.placeholder.com/300x450";

  return (
    <div className="relative w-full h-[500px] md:h-[400px] bg-gradient-to-r from-gray-900 to-indigo-950 overflow-hidden mb-12 rounded-3xl mx-4 md:mx-12 w-auto shadow-2xl border border-white/5">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center h-full p-8 md:p-12 gap-8">
        <div className="w-full md:w-1/3 flex justify-center md:justify-end">
          <img 
            src={imageSrc} 
            alt={book.volumeInfo.title} 
            className="h-48 md:h-72 w-auto object-cover rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500"
          />
        </div>
        <div className="w-full md:w-2/3 text-center md:text-left space-y-4">
          <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Featured Resource
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight line-clamp-2">
            {book.volumeInfo.title}
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-xl line-clamp-3">
            {book.volumeInfo.description || "No description available for this title. Click below to explore more details about this resource."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
            <a 
              href={book.volumeInfo.previewLink} 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <BookOpen size={20} /> Read Now
            </a>
            <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-full border border-gray-600 transition-all flex items-center gap-2">
              <Star size={20} className="text-yellow-500" /> Save to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookCard = ({ book }) => {
  const info = book.volumeInfo;
  const imageSrc = info.imageLinks?.thumbnail || "https://via.placeholder.com/128x192?text=No+Cover";
  
  return (
    <div className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
      {/* Image Container */}
      <div className="aspect-[2/3] w-full overflow-hidden relative">
        <img 
          src={imageSrc} 
          alt={info.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
        
        {/* Hover Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm gap-2">
          <a 
            href={info.previewLink}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-cyan-500 text-black rounded-full hover:scale-110 transition-transform shadow-lg"
            title="Read Now"
          >
            <BookOpen size={20} />
          </a>
          <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg" title="More Info">
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1" title={info.title}>
          {info.title}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-1">
          {info.authors?.join(", ") || "Unknown Author"}
        </p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-yellow-500 text-xs">
             <Star size={12} fill="currentColor" />
             <span>{info.averageRating || "4.5"}</span>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
             {book.accessInfo?.epub?.isAvailable ? "EPUB" : "PDF"}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const DigitalLibraryPage = () => {
  const navigate = useNavigate();

  // State
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Constants
  const categories = [
    "All", "Computer Science", "Artificial Intelligence", "Space", 
    "Robotics", "Physics", "Mathematics", "History", "Fiction", "Design"
  ];

  // Fetch Logic
  const fetchBooks = useCallback(async (q, category) => {
    setLoading(true);
    try {
      const query = category !== "All" ? `${q} subject:${category}` : q;
      const res = await api.post(`/google-books`, { q: query || "technology" });
      setBooks(res.data.items || []);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Fetch & Category Change
  useEffect(() => {
    fetchBooks(searchQuery, selectedCategory);
  }, [selectedCategory, fetchBooks]); // removed searchQuery from dep to avoid debounce issues, handles via Enter

  // Header Click Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
      <Header 
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      {/* Toolbar */}
      <div className="px-4 md:px-12 mb-8 sticky top-4 z-30">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search the Digital Knowledge Vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBooks(searchQuery, selectedCategory)}
            className="w-full bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xl transition-all"
          />
          <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
          <div className="absolute right-2 top-2 p-1.5 bg-gray-800 rounded-full border border-gray-700">
            <Filter size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <TagCloud 
        tags={categories} 
        selected={selectedCategory} 
        onSelect={setSelectedCategory} 
      />

      <main className="pb-12 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse">Accessing Global Archives...</p>
          </div>
        ) : (
          <>
            {/* Hero Section (First Book) */}
            {books.length > 0 && <HeroSection book={books[0]} />}

            {/* Grid */}
            <div className="px-4 md:px-12">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <ArrowRight className="text-cyan-500" /> 
                   {selectedCategory === 'All' ? 'Trending Resources' : `${selectedCategory} Collection`}
                 </h2>
                 <span className="text-sm text-gray-500">{books.length} results found</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                 {books.slice(1).map((book) => (
                   <BookCard key={book.id || book.etag} book={book} />
                 ))}
               </div>
               
               {books.length === 0 && (
                  <div className="text-center py-20 text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No results found for this query.</p>
                  </div>
               )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DigitalLibraryPage;