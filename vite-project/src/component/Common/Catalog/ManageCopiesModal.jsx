import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../api/axiosClient';
import useToast from './useToast';

export default function ManageCopiesModal({ show, onClose, groupedBook, fetchBooks }) {
  const { addToast } = useToast();
  const [copies, setCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [editingCopyId, setEditingCopyId] = useState(null);
  const [editedCopy, setEditedCopy] = useState({});
  const [newCopyData, setNewCopyData] = useState({});

  const groupedIdString = groupedBook ? encodeURIComponent(JSON.stringify(groupedBook._id)) : "";

  const fetchCopies = useCallback(async () => {
    if (!groupedIdString) return;
    setLoadingCopies(true);
    try {
      const response = await api.get(`/books/copies/${groupedIdString}`);
      setCopies(response.data);
    } catch (err) {
      console.error("Failed to fetch individual copies:", err);
      addToast("Failed to load copies", "error");
    } finally {
      setLoadingCopies(false);
    }
  }, [groupedIdString, addToast]);

  useEffect(() => {
    if (show && groupedBook) {
      fetchCopies();
    } else {
      setCopies([]);
      setEditingCopyId(null);
      setEditedCopy({});
      setNewCopyData({});
    }
  }, [show, groupedBook, fetchCopies]);

  const handleEditCopyClick = (copy) => {
    setEditingCopyId(copy._id);
    setEditedCopy({ ...copy });
  };

  const handleSaveCopy = async () => {
    try {
      await api.put(`/books/${editedCopy._id}`, editedCopy);
      addToast("Copy updated successfully", "success");
      setEditingCopyId(null);
      setEditedCopy({});
      fetchCopies(); // Refresh list
      fetchBooks(); // Refresh main catalog
    } catch (err) {
      console.error("Failed to update copy:", err);
      addToast("Failed to update copy", "error");
    }
  };

  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm("Are you sure you want to delete this individual copy?")) return;
    try {
      await api.delete(`/books/${copyId}`);
      addToast("Copy deleted successfully", "success");
      fetchCopies();
      fetchBooks();
    } catch (err) {
      console.error("Failed to delete copy:", err);
      addToast("Failed to delete copy", "error");
    }
  };

  const handleAddCopy = async () => {
    try {
      // Inherit metadata from the grouped book for the new copy
      const newBookCopy = {
        ...groupedBook, // Take all metadata from groupedBook
        ...newCopyData, // Override with specific new copy data (e.g., status, location)
        // Ensure _id, totalCopies, availableCopies, derivedStatus, copyIds are NOT sent
        _id: undefined,
        totalCopies: undefined,
        availableCopies: undefined,
        derivedStatus: undefined,
        copyIds: undefined,
        // Set default status if not provided, or ensure it's 'Available' for new copies
        status: newCopyData.status || 'Available',
        // Clear borrower/dueDate for a new copy
        borrower: '',
        dueDate: null
      };
      
      await api.post('/books', newBookCopy);
      addToast("New copy added successfully", "success");
      setNewCopyData({});
      fetchCopies();
      fetchBooks();
    } catch (err) {
      console.error("Failed to add new copy:", err);
      addToast("Failed to add new copy", "error");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Manage Copies: {groupedBook?.title}</h2>
          <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body - Copies List */}
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          {loadingCopies ? (
            <div className="text-center py-8 text-gray-400">Loading copies...</div>
          ) : (
            <>
              {copies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No individual copies found for this book.</div>
              ) : (
                <div className="space-y-4">
                  {copies.map((copy) => (
                    <div key={copy._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      {editingCopyId === copy._id ? (
                        // Edit form for copy
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                          <div>
                            <label className="block text-xs text-gray-400">Status</label>
                            <select
                              value={editedCopy.status}
                              onChange={(e) => setEditedCopy(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                            >
                              <option value="Available">Available</option>
                              <option value="Borrowed">Borrowed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400">Location</label>
                            <input
                              type="text"
                              value={editedCopy.location || ''}
                              onChange={(e) => setEditedCopy(prev => ({ ...prev, location: e.target.value }))}
                              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                            />
                          </div>
                          {/* Add other fields for individual copy editing if needed (e.g., borrower, dueDate) */}
                        </div>
                      ) : (
                        // Display copy info
                        <div className="flex-grow w-full">
                          <p className="font-semibold text-white">{copy.title}</p>
                          <p className="text-sm text-gray-400">ID: {copy._id}</p>
                          <p className="text-sm text-gray-400">Location: {copy.location || 'N/A'}</p>
                          <p className={`text-sm font-medium ${copy.status === 'Available' ? 'text-green-400' : 'text-yellow-400'}`}>Status: {copy.status}</p>
                          {copy.borrower && <p className="text-xs text-gray-500">Borrowed by: {copy.borrower}</p>}
                          {copy.dueDate && <p className="text-xs text-gray-500">Due: {new Date(copy.dueDate).toLocaleDateString()}</p>}
                        </div>
                      )}

                      {/* Actions for each copy */}
                      <div className="flex gap-2">
                        {editingCopyId === copy._id ? (
                          <>
                            <button onClick={handleSaveCopy} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => setEditingCopyId(null)} className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition">
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditCopyClick(copy)} className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDeleteCopy(copy._id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Add New Copy Section */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Add New Copy</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Location (e.g., Shelf A2)"
                value={newCopyData.location || ''}
                onChange={(e) => setNewCopyData(prev => ({ ...prev, location: e.target.value }))}
                className="flex-grow bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
              />
              <select
                value={newCopyData.status || 'Available'}
                onChange={(e) => setNewCopyData(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
              >
                <option value="Available">Available</option>
                <option value="Borrowed">Borrowed</option>
              </select>
              <button onClick={handleAddCopy} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition flex items-center gap-1">
                <Plus size={18} /> Add Copy
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
