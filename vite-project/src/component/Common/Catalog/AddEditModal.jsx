// AddEditModal.jsx
import useFocusTrap from "./useFocusTrap";
import React from "react";

export default function AddEditModal({
  show,
  onClose,
  editingBook, // This is now the grouped book metadata
  newBook,     // This is the data for the first copy when adding
  setEditingBook,
  setNewBook,
  errors,
  handleAddBook,
  handleUpdateBook, // This calls updateGroupedBookMetadata
  loadingAdd,
  loadingUpdate,
  genres,
}) {
  const modalRef = useFocusTrap(show);

  // Determine which book object to use for current form values
  const currentBook = editingBook || newBook;
  const setCurrentBook = editingBook ? setEditingBook : setNewBook;

  // Define fields for metadata editing (applies to grouped book)
  const metadataFields = [
    { label: "Title", name: "title", type: "text" },
    { label: "Author", name: "author", type: "text" },
    { label: "Genre", name: "genre", type: "select", options: genres.slice(1) },
    { label: "Publisher", name: "publisher", type: "text" },
    { label: "Published Count", name: "publishedCount", type: "number" },
    { label: "Height", name: "height", type: "text" },
    { label: "Image URL", name: "imageUrl", type: "text" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "ISBN", name: "isbn", type: "text" }, // Added ISBN
    { label: "Category", name: "category", type: "text" }, // Added Category
    { label: "Type", name: "type", type: "select", options: ['eBook', 'Audiobook'] }, // Added Type
  ];

  // Fields specific to adding a new individual copy
  const newCopySpecificFields = [
    { label: "Location", name: "location", type: "text" },
    { label: "Status", name: "status", type: "select", options: ['Available', 'Borrowed'] },
  ];

  const allFields = editingBook ? metadataFields : [...metadataFields, ...newCopySpecificFields];

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div ref={modalRef} className="bg-gray-900 p-6 rounded-2xl max-w-lg w-full relative my-8 animate-scale-in border border-gray-700 shadow-xl">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white transition" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="text-white text-2xl font-bold mb-6">
          {editingBook ? "Edit Book Metadata" : "Add New Book"}
        </h2>
        
        <div className="space-y-4">
          {allFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={currentBook[field.name] || (field.name === 'type' ? 'eBook' : field.options[0])}
                  onChange={(e) => setCurrentBook((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="bg-gray-800 p-2 rounded-lg w-full border border-gray-700 focus:border-indigo-500 outline-none text-white"
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={currentBook[field.name] || ""}
                  onChange={(e) => setCurrentBook((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="bg-gray-800 p-2 rounded-lg w-full h-24 border border-gray-700 focus:border-indigo-500 outline-none resize-none text-white"
                />
              ) : (
                <input
                  type={field.type}
                  value={currentBook[field.name] || ""}
                  onChange={(e) => {
                    const val =
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value;
                    setCurrentBook((prev) => ({ ...prev, [field.name]: val }));
                  }}
                  className="bg-gray-800 p-2 rounded-lg w-full border border-gray-700 focus:border-indigo-500 outline-none text-white"
                />
              )}
              {errors[field.name] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => editingBook ? handleUpdateBook() : handleAddBook()}
            className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg transition text-white font-bold shadow-lg shadow-indigo-500/20"
            disabled={loadingAdd || loadingUpdate}
          >
            {editingBook
              ? loadingUpdate
                ? "Updating..."
                : "Update Metadata"
              : loadingAdd
              ? "Adding..."
              : "Add Book"}
          </button>
        </div>
      </div>
    </div>
  );
}