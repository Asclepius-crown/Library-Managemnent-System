import React from "react";
import { BookOpen, Star, CheckCircle } from "lucide-react";

const BookCard = React.memo(function BookCard({ 
  book, isActive, onClick, onHover, 
  isAdmin, selectedBooks, onSelectBook 
}) {
  const isSelected = selectedBooks?.includes(JSON.stringify(book._id));

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${
        isActive 
          ? "ring-2 ring-cyan-500 scale-105 z-10 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-gray-800" 
          : "hover:bg-gray-800 opacity-80 hover:opacity-100 hover:scale-105"
      } rounded-xl overflow-hidden bg-gray-900 border border-white/5 h-full`}
      onMouseEnter={() => onHover(book)}
      onClick={() => onClick(book)}
    >
      {/* Selection Checkbox (Admin) */}
      {isAdmin && (
         <div 
           className="absolute top-2 left-2 z-20"
           onClick={(e) => e.stopPropagation()}
         >
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={(e) => onSelectBook(JSON.stringify(book._id), e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-black/50 text-cyan-500 focus:ring-0 cursor-pointer"
            />
         </div>
      )}

      {/* Featured Marker */}
      {book.isFeatured && (
        <div className="absolute top-0 right-0 p-2 z-10">
           <Star size={12} className="text-yellow-400 fill-current drop-shadow-md" />
        </div>
      )}

      {/* Image Container */}
      <div className="aspect-[2/3] w-full relative overflow-hidden">
        {book.imageUrl ? (
           <img 
             src={book.imageUrl} 
             alt={book.title} 
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
             loading="lazy"
           />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-600 p-4 text-center">
              <BookOpen size={24} className="mb-2 opacity-50" />
              <span className="text-xs font-bold line-clamp-2">{book.title}</span>
           </div>
        )}
        
        {/* Active Overlay Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-t from-cyan-900/40 to-transparent transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Minimal Footer */}
      <div className="p-3">
         <h3 className={`text-sm font-bold leading-tight line-clamp-1 ${isActive ? 'text-cyan-400' : 'text-gray-300'}`}>
           {book.title}
         </h3>
         <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500 truncate max-w-[70%]">{book.author}</span>
            {book.availableCopies > 0 ? (
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" title="Available"></div>
            ) : (
               <div className="w-2 h-2 rounded-full bg-red-500" title="Out of Stock"></div>
            )}
         </div>
      </div>
    </div>
  );
});

export default BookCard;