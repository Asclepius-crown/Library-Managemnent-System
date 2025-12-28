import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Common/Catalog/Header";
import api from '../api/axiosClient';
import useToast from "./Common/Catalog/useToast";
import ToastArea from "./Common/Catalog/ToastArea";
import { useAuth } from "./AuthContext";

const DatabasePage = () => {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const { user } = useAuth();
  
  // Header state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Data state
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [stats, setStats] = useState({ 
    totalBooks: 0, 
    totalUsers: 0, 
    borrowedCount: 0, 
    overdueCount: 0 
  });
  const [loading, setLoading] = useState(true);

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

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Overdue Books
      const overdueRes = await api.get('/borrowed', { 
        params: { status: 'Overdue', limit: 100 } 
      });
      setOverdueBooks(overdueRes.data.records);

      // Fetch Stats (Available to all users now)
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data);
      } catch {
        // Stats fetch failed silently
      }

    } catch {
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [user, fetchData]);

  // Delete an overdue entry (Admin Only)
  const handleDeleteOverdue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/borrowed/${id}`);
      addToast("Record deleted", "success");
      fetchData(); // Refresh
    } catch {
      addToast("Failed to delete record", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 to-black text-white p-8 font-sans flex flex-col">
      <ToastArea toasts={toasts} />
      
      {/* Shared Header */}
      <Header 
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      {/* Inspirational Quote */}
      <section className="text-center italic text-cyan-400/70 mb-10 max-w-3xl mx-auto px-4 select-none">
        <blockquote>
          “A book is a dream that you hold in your hand.”
          <footer className="mt-2 text-cyan-700">– Neil Gaiman</footer>
        </blockquote>
      </section>

      {/* Stats grid (Only relevant if we have data) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
        {/* Library Statistics */}
        <div className="bg-cyan-700 rounded-xl p-8 shadow-lg transition hover:shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-white tracking-wide">Library Statistics</h3>
          <div className="space-y-4">
             <div>
                <span className="block text-cyan-200 text-sm">Total Books</span>
                <span className="text-3xl font-bold">{stats.totalBooks || '-'}</span>
             </div>
             <div>
                <span className="block text-cyan-200 text-sm">Registered Users</span>
                <span className="text-3xl font-bold">{stats.totalUsers || '-'}</span>
             </div>
          </div>
        </div>

        {/* Borrowing Overview */}
        <div className="bg-cyan-700 rounded-xl p-8 shadow-lg transition hover:shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-white tracking-wide">Borrowing Overview</h3>
          <div className="space-y-4">
             <div>
                <span className="block text-cyan-200 text-sm">Currently Borrowed</span>
                <span className="text-3xl font-bold">{stats.borrowedCount || '-'}</span>
             </div>
             <div className="flex items-center gap-3 text-white font-semibold">
                <span className="bg-red-700 rounded-full px-3 py-1 animate-pulse">{stats.overdueCount || overdueBooks.length}</span>
                <span>Overdue Books</span>
             </div>
          </div>
        </div>
      </section>

      {/* Overdue Book Management */}
      <section className="bg-cyan-800 rounded-xl p-8 max-w-6xl mx-auto shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-white tracking-wide">Overdue Book Report</h2>
        <p className="mb-6 text-cyan-300 max-w-3xl">
          {user?.role === 'admin' 
            ? "Manage overdue records below." 
            : "View overdue books."}
        </p>

        {/* Overdue books table */}
        <div className="overflow-x-auto rounded">
          {loading ? (
            <div className="text-center py-8 text-cyan-200">Loading data...</div>
          ) : (
            <table className="w-full border-collapse border border-cyan-600 text-white">
              <thead>
                <tr className="bg-cyan-900 sticky top-0">
                  <th className="border border-cyan-600 px-6 py-3 uppercase text-left text-sm">Book</th>
                  <th className="border border-cyan-600 px-6 py-3 uppercase text-left text-sm">Student</th>
                  <th className="border border-cyan-600 px-6 py-3 uppercase text-left text-sm">Due Date</th>
                  {user?.role === 'admin' && (
                    <th className="border border-cyan-600 px-6 py-3 uppercase text-left text-sm">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {overdueBooks.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 4 : 3} className="text-center py-12 text-cyan-400 italic">
                      No overdue records found.
                    </td>
                  </tr>
                ) : (
                  overdueBooks.map((rec) => (
                    <tr
                      key={String(rec._id)}
                      className="hover:bg-cyan-700 transition-colors"
                    >
                      <td className="border border-cyan-600 px-6 py-3 font-medium">{rec.bookTitle}</td>
                      <td className="border border-cyan-600 px-6 py-3">
                        {user?.role === 'student' ? (
                          <span className="font-mono text-cyan-300">{rec.studentId}</span>
                        ) : (
                          <div>
                            <div className="font-semibold text-white">{rec.studentName}</div>
                            <div className="text-xs text-cyan-400 font-mono">{rec.studentId}</div>
                          </div>
                        )}
                      </td>
                      <td className="border border-cyan-600 px-6 py-3 font-semibold text-red-300">
                        {new Date(rec.dueDate).toLocaleDateString()}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="border border-cyan-600 px-6 py-3">
                          <button
                            onClick={() => handleDeleteOverdue(rec._id)}
                            className="bg-red-700 hover:bg-red-600 text-xs px-3 py-1 rounded font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Back button */}
      <div className="text-center mt-auto pt-8">
        <button
          onClick={() => navigate("/catalog")}
          className="inline-block px-8 py-3 rounded-lg border border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white transition cursor-pointer font-semibold"
        >
          ← Back to Catalog
        </button>
      </div>
    </div>
  );
};

export default DatabasePage;
