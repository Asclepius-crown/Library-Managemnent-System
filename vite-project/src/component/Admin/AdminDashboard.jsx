import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axiosClient";
import useToast from "../Common/Catalog/useToast";
import Header from "../Common/Catalog/Header";
import ToastArea from "../Common/Catalog/ToastArea";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Book, Users, BookOpen, AlertCircle, PlusCircle } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    borrowedCount: 0,
    overdueCount: 0,
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    rollNo: "",
    branch: "",
    year: "",
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes, analyticsRes] = await Promise.all([
        api.get("/users"),
        api.get("/dashboard/stats"),
        api.get("/analytics"),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      addToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to make this user a ${newRole}?`)) return;
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      addToast(`User promoted to ${newRole}`, "success");
      const updatedUsers = users.map((u) =>
        u._id === userId ? { ...u, role: newRole } : u
      );
      setUsers(updatedUsers);
    } catch {
      addToast("Failed to update role", "error");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      addToast("Please fill in all required fields", "error");
      return;
    }
    setAdding(true);
    try {
      await api.post("/users", newUser);
      addToast("User created successfully", "success");
      setShowAddUserModal(false);
      setNewUser({ name: "", email: "", password: "", role: "student", rollNo: "", branch: "", year: "" });
      fetchData(); // Refresh list
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create user", "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4 sm:p-8">
      <ToastArea toasts={toasts} />

      <div className="max-w-6xl mx-auto">
        <Header
          navigate={navigate}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          profileMenuRef={profileMenuRef}
        />

        <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="p-3 bg-blue-900/50 rounded-full text-blue-400">
              <Book size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Books</p>
              <p className="text-2xl font-bold text-white">{stats.totalBooks}</p>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="p-3 bg-purple-900/50 rounded-full text-purple-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="p-3 bg-yellow-900/50 rounded-full text-yellow-400">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Borrows</p>
              <p className="text-2xl font-bold text-white">{stats.borrowedCount}</p>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="p-3 bg-red-900/50 rounded-full text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Overdue Books</p>
              <p className="text-2xl font-bold text-white">{stats.overdueCount}</p>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Books by Genre</h3>
              <div className="space-y-4">
                {analytics.genreStats.map((genre) => (
                  <div key={genre._id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{genre._id || 'Uncategorized'}</span>
                      <span className="text-white font-medium">{genre.count}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${(genre.count / analytics.summary.totalBooks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Borrowing Activity</h3>
              <div className="h-64 flex items-end justify-between gap-1">
                {analytics.borrowHistory.slice(-14).map((day) => (
                  <div key={day._id} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-4 bg-cyan-500 rounded-t-sm transition-all duration-500 hover:bg-cyan-400 cursor-pointer"
                        style={{ height: `${(day.count / Math.max(...analytics.borrowHistory.map(d => d.count), 1)) * 200}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.count}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 rotate-45 mt-2 origin-left whitespace-nowrap">
                      {day._id.split('-').slice(1).join('/')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <PlusCircle size={18} /> Add User
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === "admin" ? "bg-purple-900 text-purple-200" : "bg-blue-900 text-blue-200"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {u._id !== user?._id && (
                        <>
                          {u.role === "student" && (
                            <button onClick={() => handleRoleChange(u._id, "admin")} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition">
                              Promote
                            </button>
                          )}
                          {u.role === "admin" && (
                            <button onClick={() => handleRoleChange(u._id, "student")} className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                              Demote
                            </button>
                          )}
                        </>
                      )}
                      {u._id === user?._id && <span className="text-gray-500 text-xs italic">Current User</span>}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={() => navigate("/catalog")} className="mt-6 text-cyan-500 hover:underline">
          &larr; Back to Catalog
        </button>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full relative shadow-2xl border border-gray-700">
            <button 
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input 
                type="text" placeholder="Full Name" required
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
              />
              <input 
                type="email" placeholder="Email Address" required
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
              />
              <input 
                type="password" placeholder="Password" required
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
              />
              <select 
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>

              {newUser.role === 'student' && (
                <div className="space-y-4 border-t border-gray-700 pt-4">
                  <p className="text-sm text-cyan-400 font-semibold">Student Details (Optional)</p>
                  <input 
                    type="text" placeholder="Roll Number"
                    value={newUser.rollNo} onChange={e => setNewUser({...newUser, rollNo: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
                  />
                  <input 
                    type="text" placeholder="Branch"
                    value={newUser.branch} onChange={e => setNewUser({...newUser, branch: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
                  />
                  <input 
                    type="text" placeholder="Year"
                    value={newUser.year} onChange={e => setNewUser({...newUser, year: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={adding}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {adding ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
