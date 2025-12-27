// Pagination.jsx
export default function Pagination({
  currentPage,
  totalPages,
  setCurrentPage,
}) {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
      >
        Prev
      </button>
      <span>
        Page {currentPage} / {totalPages || 1}
      </span>
      <button
        onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
        disabled={currentPage >= totalPages}
        className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
