import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, List } from "lucide-react"; 
import BookCard from "./BookCard";
import BookInspector from "./BookInspector";
import SkeletonCard from "./SkeletonCard";

export default function BookGrid({ 
  books, onEdit, onDelete, onBorrow, onReserve, loading, isAdmin, 
  selectedBooks, onSelectBook, onManageCopies, onToggleFeature,
  onToggleWishlist, wishlist
}) {
  const [activeBook, setActiveBook] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isLocked, setIsLocked] = useState(false);

  // Set initial active book and reset lock on data change
  useEffect(() => {
    if (books.length > 0) {
      setActiveBook(books[0]);
      setIsLocked(false);
    } else {
      setActiveBook(null);
    }
  }, [books]);

  const handleBookHover = (book) => {
    if (window.innerWidth >= 768 && !isLocked) {
       setActiveBook(book);
    }
  };

  const handleBookClick = (book) => {
    if (activeBook?._id === book._id && isLocked) {
      setIsLocked(false); // Unlock if clicking the same locked book
    } else {
      setActiveBook(book);
      setIsLocked(true); // Lock selection on click
    }
    
    if (window.innerWidth < 768) {
       setIsMobileDrawerOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => <SkeletonCard key={index} />)}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-60">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-xl font-medium">No books found.</p>
        <p className="text-sm">Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      
      {/* View Toggle (Floating Top Right relative to grid area) */}
      <div className="flex justify-end border-b border-gray-800 pb-2 mb-2">
         <div className="bg-gray-900/50 p-1 rounded-lg border border-gray-800 flex gap-1 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              title="List View"
            >
              <List size={16} />
            </button>
         </div>
      </div>

      <div className="flex gap-6 lg:gap-8 items-start">
        
        {/* --- LEFT PANE (Grid or List) --- */}
        <div className="flex-1 min-w-0">
           
           {/* GRID MODE */}
           {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up pb-24 md:pb-0">
                  {books.map((book) => (
                    <div key={JSON.stringify(book._id)} className="h-full">
                      <BookCard 
                        book={book}
                        isActive={activeBook?._id === book._id}
                        onHover={handleBookHover}
                        onClick={handleBookClick}
                        isAdmin={isAdmin}
                        selectedBooks={selectedBooks}
                        onSelectBook={onSelectBook}
                      />
                    </div>
                  ))}
              </div>
           )}

           {/* LIST MODE */}
           {viewMode === 'list' && (
              <div className="flex flex-col gap-2 animate-fade-in-up pb-24 md:pb-0">
                  {books.map((book) => {
                    const isActive = activeBook?._id === book._id;
                    const isSelected = selectedBooks?.includes(JSON.stringify(book._id));
                    
                    return (
                      <div 
                        key={JSON.stringify(book._id)}
                        onMouseEnter={() => handleBookHover(book)}
                        onClick={() => handleBookClick(book)}
                        className={`
                          group flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition-all duration-200
                          ${isActive 
                             ? 'bg-gray-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                             : 'bg-gray-900/50 border-transparent hover:bg-gray-800 hover:border-gray-700'}
                        `}
                      >
                         {/* Checkbox (Admin) */}
                         {isAdmin && (
                            <div onClick={(e) => e.stopPropagation()}>
                               <input 
                                 type="checkbox" 
                                 checked={isSelected}
                                 onChange={(e) => onSelectBook(JSON.stringify(book._id), e.target.checked)}
                                 className="w-4 h-4 rounded border-gray-600 bg-black/50 text-cyan-500 focus:ring-0 cursor-pointer"
                               />
                            </div>
                         )}

                         {/* Tiny Thumb */}
                         <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                            {book.imageUrl && <img src={book.imageUrl} alt="" className="w-full h-full object-cover" />}
                         </div>

                         {/* Text Info */}
                         <div className="flex-grow min-w-0">
                            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-cyan-400' : 'text-gray-200'}`}>
                              {book.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                               <span className="truncate max-w-[150px]">{book.author}</span>
                               <span className="hidden sm:inline border-l border-gray-700 pl-3">{book.genre}</span>
                               <span className="hidden sm:inline border-l border-gray-700 pl-3 font-mono">{book.isbn}</span>
                            </div>
                         </div>

                         {/* Status Pill */}
                         <div className="flex-shrink-0">
                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${book.availableCopies > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {book.availableCopies > 0 ? 'In Stock' : 'Out'}
                            </span>
                         </div>
                      </div>
                    );
                  })}
              </div>
           )}

        </div>

        {/* --- INSPECTOR AREA (Sticky Right) --- */}
        <div className="hidden md:block w-80 lg:w-96 shrink-0 sticky top-24 h-[calc(100vh-120px)] bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-2xl overflow-hidden">
           <BookInspector 
             book={activeBook}
             onBorrow={onBorrow}
             onReserve={onReserve}
             onEdit={onEdit}
             onDelete={onDelete}
             onManageCopies={onManageCopies}
             onToggleFeature={onToggleFeature}
             onToggleWishlist={onToggleWishlist}
             isAdmin={isAdmin}
             isInWishlist={wishlist?.includes(activeBook?._id)}
           />
        </div>

        {/* --- MOBILE DRAWER --- */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="absolute inset-0" onClick={() => setIsMobileDrawerOpen(false)} />
             <div className="relative w-full h-[85vh] bg-gray-900 border-t border-gray-800 rounded-t-3xl shadow-2xl p-6 animate-slide-up overflow-hidden flex flex-col">
                <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-4 shrink-0" />
                <BookInspector 
                  book={activeBook}
                  onClose={() => setIsMobileDrawerOpen(false)}
                  onBorrow={onBorrow}
                  onReserve={onReserve}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageCopies={onManageCopies}
                  onToggleFeature={onToggleFeature}
                  onToggleWishlist={onToggleWishlist}
                  isAdmin={isAdmin}
                  isInWishlist={wishlist?.includes(activeBook?._id)}
                />
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
