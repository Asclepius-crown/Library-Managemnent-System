import React from "react";
import { X, BookOpen, Calendar, Box, Type, Clock } from "lucide-react";

export default function BookDetailsModal({ book, onClose, onBorrow, onReserve }) {
  if (!book) return null;

  const displayStatus = book.derivedStatus || 'Unknown';
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-scale-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={20} />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/3 h-64 md:h-auto bg-gray-800 relative">
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-700">
              {book.title.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Status Badge Overlay */}
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md ${
            displayStatus === 'Available' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'
          }`}>
            {displayStatus} ({book.availableCopies}/{book.totalCopies})
          </div>
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{book.title}</h2>
          <p className="text-cyan-400 text-lg font-medium mb-6">{book.author}</p>

          <div className="flex-grow space-y-4 text-gray-300">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-400">Genre:</span> {book.genre || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-400">Year:</span> {book.publishedCount || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Type size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-400">Publisher:</span> {book.publisher || 'N/A'}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-semibold mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-6">
                {book.description || "No description available for this book."}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition font-medium"
            >
              Close
            </button>
            {onBorrow && isAvailable && (
              <button 
                onClick={() => { onBorrow(book.copyIds[0]); onClose(); }} // Borrow first available copy
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
              >
                <BookOpen size={18} /> Borrow Now
              </button>
            )}
            {onReserve && !isAvailable && (
              <button 
                onClick={() => { onReserve(book); onClose(); }} 
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                <Clock size={18} /> Reserve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}