import React, { useState, useEffect } from "react";
import { X, BookOpen, Calendar, Box, Type, Clock, Star, MessageSquare } from "lucide-react";
import api from "../../../api/axiosClient";
import { useAuth } from "../../AuthContext";

export default function BookDetailsModal({ book, onClose, onBorrow, onReserve }) {
  const { user, studentProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (book?._id) {
      api.get(`/reviews/${book._id}`).then(res => setReviews(res.data));
    }
  }, [book?._id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!studentProfile) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', {
        bookId: book._id,
        studentId: studentProfile._id,
        studentName: user.name,
        ...newReview
      });
      setReviews([...reviews, data]);
      setNewReview({ rating: 5, comment: "" });
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!book) return null;

  const displayStatus = book.derivedStatus || 'Unknown';
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-scale-in max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={20} />
        </button>

        {/* Left: Image & Info */}
        <div className="w-full md:w-1/3 bg-gray-800 relative">
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.title} 
              className="w-full h-full object-cover min-h-[300px]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-700 min-h-[300px]">
              {book.title?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          {/* Status Badge Overlay */}
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md z-10 ${
            displayStatus === 'Available' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'
          }`}>
            {displayStatus} ({book.availableCopies}/{book.totalCopies})
          </div>
        </div>

        {/* Right: Content & Reviews */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{book.title}</h2>
          <p className="text-cyan-400 text-lg font-medium mb-6">{book.author}</p>

          <div className="space-y-6 text-gray-300">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                <span className="font-semibold text-gray-400">Rating:</span> {book.averageRating?.toFixed(1) || '0.0'} ({book.totalReviews || 0})
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-semibold mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {book.description || "No description available for this book."}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={18} /> Reviews
              </h3>
              
              <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
                {reviews.map((rev) => (
                  <div key={rev._id} className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{rev.studentName}</span>
                      <div className="flex gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{rev.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-gray-500 text-sm italic">No reviews yet. Be the first!</p>}
              </div>

              {/* Add Review Form */}
              {user && studentProfile && !reviews.some(r => r.studentId === studentProfile._id) && (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r} type="button"
                          onClick={() => setNewReview({ ...newReview, rating: r })}
                          className={`p-1 transition ${newReview.rating >= r ? 'text-yellow-500' : 'text-gray-600'}`}
                        >
                          <Star size={20} fill={newReview.rating >= r ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your review here..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none h-20 resize-none"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    required
                  />
                  <button
                    type="submit" disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
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
                onClick={() => { onBorrow(book.copyIds[0]); onClose(); }}
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