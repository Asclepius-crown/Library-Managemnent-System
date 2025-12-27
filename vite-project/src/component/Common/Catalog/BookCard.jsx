import React from "react";
import { Pencil, Trash2, BookOpen, Settings, Star, Clock } from "lucide-react"; // Removed CheckCircle, XCircle

const statusColors = {
  Available: "bg-green-500/10 text-green-400 border-green-500/20",
  Borrowed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const BookCard = React.memo(function BookCard({ 
  book, 
  onEdit, 
  onDelete, 
  onBorrow, 
  onReserve, // New prop
  onViewDetails,
  isAdmin, 
  selectedBooks, // This now contains stringified _id objects
  onSelectBook,
  onManageCopies,
  onToggleFeature 
}) {
  const hasImage = Boolean(book.imageUrl);
  const stringifiedBookId = JSON.stringify(book._id); // Stringify book._id for comparison
  const isSelected = selectedBooks?.includes(stringifiedBookId); // Check against stringified IDs
  
  // Use derivedStatus from backend for display
  const displayStatus = book.derivedStatus || 'Unknown'; 
  const isAvailableForBorrow = book.availableCopies > 0;
  
  const handleCheckboxChange = (e) => {
    e.stopPropagation(); 
    onSelectBook(stringifiedBookId, e.target.checked); // Pass stringified ID
  };

  return (
    <div 
      className={`group relative bg-gray-900/50 backdrop-blur-sm border ${book.isFeatured ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-white/5'} rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col h-full cursor-pointer`}
      onClick={() => onViewDetails(book)} 
    >
      
      {/* Selection Checkbox (Admin Only) */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <input 
            type="checkbox" 
            className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
            checked={isSelected}
            onChange={handleCheckboxChange}
            aria-label={`Select book ${book.title}`}
          />
          {onToggleFeature && (
            <button
                onClick={(e) => { e.stopPropagation(); onToggleFeature(book); }}
                className={`p-1 rounded-full ${book.isFeatured ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-yellow-400'}`}
                title="Toggle Feature (Book of the Week)"
            >
                <Star size={14} fill={book.isFeatured ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      )}

      {/* Image Area with Overlay */}
      <div className="relative w-full h-56 bg-gray-800 overflow-hidden">
        {hasImage ? (
          <img 
            src={book.imageUrl} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-700 bg-gradient-to-br from-gray-800 to-gray-900">
            {book.title ? book.title.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        
        {/* Fallback */}
        <div className="hidden absolute inset-0 bg-gray-800 items-center justify-center text-5xl font-bold text-gray-700">
           {book.title ? book.title.charAt(0).toUpperCase() : "?"}
        </div>

        {/* Hover Overlay with Quick Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
           {onBorrow && isAvailableForBorrow && (
             <button 
               onClick={(e) => { e.stopPropagation(); onBorrow(book.copyIds[0]); }} 
               className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/30 transition transform hover:scale-110"
               title="Borrow Now"
             >
               <BookOpen size={24} />
             </button>
           )}
           {onReserve && !isAvailableForBorrow && (
             <button 
               onClick={(e) => { e.stopPropagation(); onReserve(book); }} 
               className="p-3 bg-amber-600 hover:bg-amber-500 rounded-full text-white shadow-lg shadow-amber-500/30 transition transform hover:scale-110"
               title="Reserve Book"
             >
               <Clock size={24} />
             </button>
           )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          {/* Status Badge */}
          <div className="flex justify-between items-start mb-3">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[displayStatus] || 'text-gray-400 border-gray-700'}`}>
               {displayStatus} ({book.availableCopies}/{book.totalCopies})
             </span>
             {book.publishedCount && <span className="text-[10px] text-gray-500 font-mono">{book.publishedCount}</span>}
          </div>

          <h3 className="font-bold text-lg leading-snug text-white mb-1 line-clamp-2 group-hover:text-indigo-400 transition-colors" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm text-gray-400 font-medium mb-3 line-clamp-1">{book.author}</p>
        </div>
        
        {/* Admin/User Actions (Edit, Delete, Manage Copies) */}
        {(onEdit || onDelete || onManageCopies) && isAdmin && ( // Only show admin actions for admin
          <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(book); }} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition" title="Edit Book Metadata">
                <Pencil size={16} />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(book._id); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition" title="Delete All Copies">
                <Trash2 size={16} />
              </button>
            )}
            {onManageCopies && (
              <button onClick={(e) => { e.stopPropagation(); onManageCopies(book); }} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition" title="Manage Individual Copies">
                <Settings size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default BookCard;