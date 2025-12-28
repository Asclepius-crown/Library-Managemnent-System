import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  BookOpen, Star, Heart, Share2, Info, X, 
  Pencil, Trash2, Settings, RotateCcw
} from "lucide-react";

const statusColors = {
  Available: "text-green-400 bg-green-400/10 border-green-400/20",
  Borrowed: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export default function BookInspector({ 
  book, onClose, onBorrow, onReserve, onEdit, onDelete, 
  onManageCopies, onToggleFeature, onToggleWishlist, 
  isAdmin, isInWishlist 
}) {
  if (!book) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <BookOpen size={32} opacity={0.5} />
        </div>
        <h3 className="text-lg font-medium text-gray-400">System Ready</h3>
        <p className="text-sm">Hover over a book data unit to initialize analysis.</p>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;
  const displayStatus = book.derivedStatus || 'Unknown';

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6 z-10">
        <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest border border-cyan-500/30 px-2 py-1 rounded">
          ID: {book.isbn || "UNREGISTERED"}
        </span>
        <button onClick={onClose} className="md:hidden p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
        
        {/* Cover Art (No 3D here, just clean large view) */}
        <div className="relative aspect-[2/3] w-full max-w-[240px] mx-auto rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
          <img 
            src={book.imageUrl || "https://via.placeholder.com/300x450?text=No+Cover"} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          {book.isFeatured && (
             <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
               <Star size={10} fill="black" /> Featured
             </div>
          )}
        </div>

        {/* Title & Author */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white leading-tight">{book.title}</h2>
          <p className="text-lg text-cyan-400 font-medium">{book.author}</p>
          <div className="flex justify-center gap-2 mt-2">
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusColors[displayStatus] || "text-gray-400 border-gray-700"}`}>
               {displayStatus}
             </span>
             <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border border-gray-700 text-gray-400">
               {book.genre}
             </span>
          </div>
        </div>

        {/* Action Grid (The Command Center) */}
        <div className="grid grid-cols-2 gap-3">
           {!isAdmin ? (
             <>
               {isAvailable ? (
                 <button 
                   onClick={() => onBorrow(book.copyIds?.[0] || book._id)} // Fallback if copyIds missing
                   className="col-span-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all flex items-center justify-center gap-2 group"
                 >
                   <BookOpen className="group-hover:scale-110 transition-transform" /> 
                   Initiate Borrow
                 </button>
               ) : (
                 <button 
                   onClick={() => onReserve(book)}
                   className="col-span-2 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all flex items-center justify-center gap-2"
                 >
                   <Star className="fill-black" /> Reserve Now
                 </button>
               )}
               
               <button 
                 onClick={() => onToggleWishlist(book._id)}
                 className={`py-2 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all ${
                   isInWishlist 
                     ? "bg-red-500/20 border-red-500 text-red-400" 
                     : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                 }`}
               >
                 <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} /> 
                 {isInWishlist ? "Saved" : "Save"}
               </button>
               
               <button className="py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700 transition-all">
                 <Share2 size={18} /> Share
               </button>
             </>
           ) : (
             <>
               <button onClick={() => onEdit(book)} className="py-2 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:text-yellow-500 text-gray-300 rounded-lg flex items-center justify-center gap-2 transition-all">
                 <Pencil size={16} /> Edit
               </button>
               <button onClick={() => onManageCopies(book)} className="py-2 bg-gray-800 border border-gray-700 hover:border-cyan-500 hover:text-cyan-500 text-gray-300 rounded-lg flex items-center justify-center gap-2 transition-all">
                 <Settings size={16} /> Copies
               </button>
               <button onClick={() => onToggleFeature(book)} className={`col-span-2 py-2 border rounded-lg flex items-center justify-center gap-2 transition-all ${book.isFeatured ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                 <Star size={16} fill={book.isFeatured ? "currentColor" : "none"} /> {book.isFeatured ? "Featured" : "Feature Book"}
               </button>
               <button onClick={() => onDelete(book._id)} className="col-span-2 py-2 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 rounded-lg flex items-center justify-center gap-2 transition-all">
                 <Trash2 size={16} /> Delete Asset
               </button>
             </>
           )}
        </div>

        {/* Data Stats Block */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 space-y-3">
          <h4 className="text-gray-500 text-xs font-mono uppercase tracking-widest border-b border-gray-800 pb-2">Technical Specifications</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Publisher</span>
            <span className="text-white font-medium text-right">{book.publisher || "Unknown"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Location</span>
            <span className="text-cyan-400 font-mono text-right">{book.location || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Copies</span>
            <span className="text-white font-medium text-right">{book.totalCopies}</span>
          </div>
        </div>

        {/* Description */}
        <div className="text-gray-400 text-sm leading-relaxed">
          <h4 className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Synopsis</h4>
          <p>{book.description || "No description available in the archives."}</p>
        </div>

      </div>
    </div>
  );
}
