import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Download, Search } from "lucide-react";
import { useAuth } from "../component/AuthContext.jsx";
import api from "../api/axiosClient";
import Papa from "papaparse";
import Header from "./Common/Catalog/Header"; // Import shared Header

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 bg-cyan-700 text-white px-6 py-3 rounded shadow z-50 animate-fade-in">
      {message}
    </div>
  );
};

const statusClasses = {
  Overdue: "bg-red-900/50 text-red-200 border border-red-700",
  Returned: "bg-green-900/50 text-green-200 border border-green-700",
  "Not Returned": "bg-yellow-900/50 text-yellow-200 border border-yellow-700",
};

export default function BorrowedStudentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user for role check

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy] = useState("dueDate:asc");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // Shared Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // NEW: Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/borrowed", {
        params: { page, limit, search, status: statusFilter, sort: sortBy },
      });
      setRecords(data.records);
      setTotal(data.total);
      setSelected([]);
    } catch {
      setToastMsg("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close Profile Menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/borrowed/${id}`);
    setToastMsg("Record deleted");
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return alert("No records selected");
    if (!window.confirm(`Delete ${selected.length} selected records?`)) return;
    await api.post("/borrowed/bulk-delete", { ids: selected });
    setToastMsg(`${selected.length} records deleted`);
    fetchData();
  };

  const handlePayFine = async () => {
    if(!window.confirm("Mark fine as paid?")) return;
    try {
        const { data } = await api.patch(`/borrowed/${editingRecord._id}/pay-fine`);
        setEditingRecord(data); // Update local state
        setToastMsg("Fine marked as paid");
        fetchData(); // Refresh list
    } catch {
        setToastMsg("Failed to update fine status");
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      records.map((r) => ({
        "Student Name": r.studentName,
        "Student ID": r.studentId,
        "Book Title": r.bookTitle,
        "Borrow Date": new Date(r.borrowDate).toLocaleDateString(),
        "Due Date": new Date(r.dueDate).toLocaleDateString(),
        "Return Status": r.returnStatus,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `borrowed_books_${Date.now()}.csv`;
    link.click();
  };

  const toggleSelected = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelected(
      selected.length === records.length ? [] : records.map((r) => r._id)
    );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 to-black text-white font-sans">
      {/* Shared Header */}
      <div className="bg-[#0a162f] px-6 py-4 shadow-md">
        <Header 
          navigate={navigate}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          profileMenuRef={profileMenuRef}
        />
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-wide mb-1">
              {user?.role === 'admin' ? "Borrowed Books Management" : "My Borrowed Books"}
            </h2>
            <p className="text-gray-400 text-sm">
              {user?.role === 'admin' ? "Manage library circulation and returns." : "Track your reading history and due dates."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
            <div className="relative">
              <input
                placeholder="Search records..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9 pr-4 py-2 rounded-lg border border-cyan-700 bg-[#0a162f] text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full sm:w-64"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-cyan-700 bg-[#0a162f] text-sm focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.keys(statusClasses).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {/* Admin Controls */}
            {user?.role === 'admin' && (
              <button
                disabled={selected.length === 0}
                onClick={handleBulkDelete}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition ${
                  selected.length ? "" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Trash2 size={16} /> Delete Selected
              </button>
            )}

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-sm font-semibold transition"
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl shadow-xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 bg-[#0f1e36]">
              <thead className="bg-[#1a2c4e] text-gray-300 uppercase text-xs font-bold tracking-wider">
                <tr>
                  {user?.role === 'admin' && (
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={records.length > 0 && selected.length === records.length}
                        onChange={toggleSelectAll}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                    </th>
                  )}
                  <th className="p-4 text-left">Book Title</th>
                  {user?.role === 'admin' && <th className="p-4 text-left">Student</th>}
                  <th className="p-4 text-left">Borrow Date</th>
                  <th className="p-4 text-left">Due Date</th>
                  <th className="p-4 text-center">Status</th>
                  {user?.role === 'admin' && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      Loading records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500 italic">
                      No records found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  records.map((book) => (
                    <tr key={String(book._id)} className="hover:bg-[#1a2942] transition-colors">
                      {user?.role === 'admin' && (
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selected.includes(book._id)}
                            onChange={() => toggleSelected(book._id)}
                            className="rounded bg-gray-700 border-gray-600"
                          />
                        </td>
                      )}
                      <td className="p-4 font-medium text-white">
                        {book.bookTitle}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="p-4 text-gray-300">
                          <div>{book.studentName}</div>
                          <div className="text-xs text-gray-500">{book.studentId}</div>
                        </td>
                      )}
                      <td className="p-4 text-gray-400">
                        {formatDate(book.borrowDate)}
                      </td>
                      <td className="p-4 text-gray-400">
                        {formatDate(book.dueDate)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                statusClasses[book.returnStatus] || "bg-gray-700 text-gray-300"
                            }`}
                            >
                            {book.returnStatus}
                            </span>
                            {book.fineAmount > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${book.isFinePaid ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}>
                                    Fine: ₹{book.fineAmount} {book.isFinePaid ? '(Paid)' : ''}
                                </span>
                            )}
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="p-4 flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              setEditingRecord(book);
                              setShowEditModal(true);
                              setEditErrors({});
                            }}
                            className="p-2 rounded-full hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition"
                            title="Edit Record"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(book._id)}
                            className="p-2 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div>Showing {records.length} of {total} records</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-lg bg-[#1a2c4e] hover:bg-[#233b66] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="bg-[#0a162f] px-3 py-2 rounded-lg border border-gray-800">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg bg-[#1a2c4e] hover:bg-[#233b66] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>

        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

        {/* Edit Modal (Admin Only) */}
        {showEditModal && editingRecord && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f1e36] border border-gray-700 p-6 rounded-xl max-w-md w-full relative shadow-2xl">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
              <h2 className="text-white text-xl font-bold mb-6">Edit Borrowed Record</h2>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  let errs = {};
                  if (!editingRecord.dueDate) errs.dueDate = "Required";
                  if (Object.keys(errs).length) {
                    setEditErrors(errs);
                    return;
                  }
                  setLoadingEdit(true);
                  try {
                    await api.put(
                      `/borrowed/${editingRecord._id}`,
                      editingRecord
                    );
                    setToastMsg("Record updated successfully");
                    setShowEditModal(false);
                    fetchData();
                  } catch {
                    setToastMsg("Failed to update record");
                  }
                  setLoadingEdit(false);
                }}
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Student</label>
                  <input
                    type="text"
                    value={editingRecord.studentName}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-gray-400 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Book Title</label>
                  <input
                    type="text"
                    value={editingRecord.bookTitle}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Borrow Date</label>
                  <input
                    type="date"
                    value={editingRecord.borrowDate?.slice(0, 10)}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingRecord.dueDate?.slice(0, 10)}
                    onChange={(e) =>
                      setEditingRecord((rec) => ({ ...rec, dueDate: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-cyan-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {editErrors.dueDate && (
                    <div className="text-red-500 text-xs mt-1">{editErrors.dueDate}</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Return Status</label>
                  <select
                    value={editingRecord.returnStatus}
                    onChange={(e) =>
                      setEditingRecord((rec) => ({
                        ...rec,
                        returnStatus: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-cyan-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option>Not Returned</option>
                    <option>Returned</option>
                    <option>Overdue</option>
                  </select>
                </div>

                {editingRecord.fineAmount > 0 && (
                  <div className={`p-4 rounded border ${editingRecord.isFinePaid ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                      <div className="flex justify-between items-center">
                          <span className={`font-bold ${editingRecord.isFinePaid ? 'text-green-300' : 'text-red-300'}`}>
                              Fine: ₹{editingRecord.fineAmount}
                          </span>
                          {editingRecord.isFinePaid ? (
                              <span className="text-green-400 font-bold uppercase text-xs border border-green-500/50 px-2 py-1 rounded">Paid</span>
                          ) : (
                             <button 
                                 type="button" 
                                 onClick={handlePayFine} 
                                 className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition shadow-lg shadow-green-500/20"
                             >
                                 Mark Paid
                             </button>
                          )}
                      </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg"
                    disabled={loadingEdit}
                  >
                    {loadingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
