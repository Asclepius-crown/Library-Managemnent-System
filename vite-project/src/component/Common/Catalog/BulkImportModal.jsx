// BulkImportModal.jsx
import BulkBookUpload from "../../Admin/BulkBookUpload";
export default function BulkImportModal({ show, onClose, fetchBooks }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded max-w-xl w-full relative">
        <button className="absolute top-4 right-4 text-white" onClick={onClose}>&times;</button>
        <h2 className="text-white text-xl mb-4">Bulk Add Books</h2>
        <BulkBookUpload
          onDone={() => {
            fetchBooks();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
