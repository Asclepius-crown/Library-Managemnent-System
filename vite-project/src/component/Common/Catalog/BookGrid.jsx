import React, { useState } from 'react';
import BookCard from "./BookCard";
import SkeletonCard from "./SkeletonCard";
import BookDetailsModal from "./BookDetailsModal";

export default function BookGrid({ books, onEdit, onDelete, onBorrow, onReserve, loading, isAdmin, selectedBooks, onSelectBook, onManageCopies, onToggleFeature }) {
  const [selectedBook, setSelectedBook] = useState(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-60">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-xl font-medium">No books found.</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        {books.map((book, index) => (
          <div 
            key={book._id} 
            className="h-full" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <BookCard
              book={book}
              onEdit={onEdit}
              onDelete={onDelete}
              onBorrow={onBorrow}
              onReserve={onReserve}
              onViewDetails={setSelectedBook}
              isAdmin={isAdmin} // Pass isAdmin prop
              selectedBooks={selectedBooks} // Pass selectedBooks state
              onSelectBook={onSelectBook} // Pass the selection handler
              onManageCopies={onManageCopies}
              onToggleFeature={onToggleFeature}
            />
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedBook && (
        <BookDetailsModal 
          book={selectedBook} 
          onClose={() => setSelectedBook(null)} 
          onBorrow={onBorrow}
          onReserve={onReserve}
        />
      )}
    </>
  );
}