import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from "../Common/Catalog/Header";
import useToast from "../Common/Catalog/useToast";
import ToastArea from "../Common/Catalog/ToastArea";
import api from "../../api/axiosClient";
import { User, Shield, Key, BookOpen, GraduationCap, Building, Calendar, AlertCircle, Clock, Banknote, Megaphone } from 'lucide-react';

const StudentProfile = () => {
  const { user: contextUser } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  
  // Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Profile Data State
  const [profileData, setProfileData] = useState(null); // { user, studentProfile }
  const [borrowStats, setBorrowStats] = useState({ total: 0, overdue: 0 });
  const [borrowedBooks, setBorrowedBooks] = useState([]); // List of current borrowings
  const [reservations, setReservations] = useState([]);
  const [announcements, setAnnouncements] = useState([]); // New state
  const [totalFines, setTotalFines] = useState(0);
  const [loading, setLoading] = useState(true);

  // Password State
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Close header menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Full Profile Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Extended User Profile
        const meRes = await api.get('/auth/me');
        setProfileData(meRes.data); // { user, studentProfile }

        // 2. Fetch Announcements
        const annRes = await api.get('/announcements');
        setAnnouncements(annRes.data);

        // 3. Fetch Borrow Stats & List & Reservations (If Student)
        if (meRes.data.user.role === 'student') {
            try {
                const [totalRes, overdueRes, listRes, reservationsRes, allRecordsRes] = await Promise.all([
                    api.get('/borrowed?limit=1'), // Just to get 'total' count
                    api.get('/borrowed?limit=1&status=Overdue'),
                    api.get('/borrowed?status=Not Returned&limit=50'), // Fetch active borrowings
                    api.get('/reservations?status=Active'), // Fetch active reservations
                    api.get('/borrowed?limit=100') // Fetch all records to calc fines
                ]);
                setBorrowStats({
                    total: totalRes.data.total || 0,
                    overdue: overdueRes.data.total || 0
                });
                setBorrowedBooks(listRes.data.records || []);
                setReservations(reservationsRes.data || []);

                // Calculate Fines
                const allRecords = allRecordsRes.data.records || [];
                const unpaid = allRecords.filter(r => r.fineAmount > 0 && !r.isFinePaid);
                const total = unpaid.reduce((acc, curr) => acc + curr.fineAmount, 0);
                setTotalFines(total);

            } catch {
                // Silent catch - borrow stats are optional
            }
        }
      } catch {
        addToast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }
    if (passwords.newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      addToast("Password changed successfully", "success");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleCancelReservation = async (id) => {
      if(!window.confirm("Cancel this reservation?")) return;
      try {
          await api.patch(`/reservations/${id}/cancel`);
          setReservations(prev => prev.filter(r => r._id !== id));
          addToast("Reservation cancelled", "success");
      } catch {
          addToast("Failed to cancel reservation", "error");
      }
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="animate-pulse">Loading Profile...</div>
        </div>
      );
  }

  const { user, studentProfile } = profileData || { user: contextUser, studentProfile: null };

  const getDueStatus = (dueDateStr) => {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} days`, color: "text-red-400 border-red-500/30 bg-red-500/10" };
    if (diffDays === 0) return { label: "Due Today", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" };
    if (diffDays <= 2) return { label: `Due in ${diffDays} days`, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" };
    return { label: `Due in ${diffDays} days`, color: "text-green-400 border-green-500/30 bg-green-500/10" };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500 selection:text-white pb-12">
      <ToastArea toasts={toasts} />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-8">
        <Header 
            navigate={navigate}
            showProfileMenu={showProfileMenu}
            setShowProfileMenu={setShowProfileMenu}
            profileMenuRef={profileMenuRef}
        />

        <main className="max-w-6xl mx-auto mt-8 animate-fade-in-up">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                {/* Avatar */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-3xl sm:text-5xl font-bold shadow-2xl border-4 border-black/50">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                
                {/* Basic Info */}
                <div className="flex-grow pt-2">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{user?.name}</h1>
                    <p className="text-gray-400 text-lg mb-4">{user?.email}</p>
                    <div className="flex gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                            {user?.role}
                        </span>
                        {studentProfile && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30">
                                Verified Student
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick Stats (Student Only) */}
                {user?.role === 'student' && (
                    <div className="flex gap-4">
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 text-center min-w-[100px] backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white mb-1">{borrowStats.total}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Borrowed</p>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 text-center min-w-[100px] backdrop-blur-sm">
                            <p className={`text-2xl font-bold mb-1 ${borrowStats.overdue > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{borrowStats.overdue}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Overdue</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Academic/Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Announcements Section */}
                    <div className="bg-gradient-to-r from-indigo-900/40 to-cyan-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
                            <Megaphone size={24} className="text-yellow-400" /> Library Announcements
                        </h2>
                        <div className="space-y-4">
                            {announcements.length > 0 ? announcements.map((ann) => (
                                <div key={ann._id} className="bg-black/40 p-5 rounded-xl border border-white/5 hover:border-white/10 transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-indigo-300 text-lg">{ann.title}</h3>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">
                                            {new Date(ann.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{ann.content}</p>
                                    <p className="text-[10px] text-gray-600 mt-4 text-right italic">— {ann.author}</p>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-4 italic">No new announcements today.</p>
                            )}
                        </div>
                    </div>

                    {/* Student Academic Card */}
                    {user?.role === 'student' && (
                        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-cyan-400">
                                <GraduationCap size={24} /> Academic Information
                            </h2>
                            
                            {studentProfile ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Shield size={14} /> Roll Number</p>
                                        <p className="text-lg font-mono text-white tracking-wide">{studentProfile.rollNo}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Building size={14} /> Department/Branch</p>
                                        <p className="text-lg font-medium text-white">{studentProfile.department}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Calendar size={14} /> Year of Study</p>
                                        <p className="text-lg font-medium text-white">Year {studentProfile.yearOfStudy}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Calendar size={14} /> Admission Year</p>
                                        <p className="text-lg font-medium text-white">{studentProfile.admissionYear}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-gray-700">
                                    <AlertCircle size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-400">No academic record linked.</p>
                                    <p className="text-xs text-gray-500 mt-1">Contact the administrator to update your student details.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fines Section */}
                    {user?.role === 'student' && totalFines > 0 && (
                        <div className="bg-red-900/20 backdrop-blur-md rounded-2xl p-6 border border-red-500/20 shadow-xl">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-red-400">
                                <Banknote size={24} /> Outstanding Fines
                            </h2>
                            <div className="flex items-center justify-between bg-black/40 p-5 rounded-xl border border-red-500/10">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Unpaid Fines</p>
                                    <p className="text-3xl font-bold text-white mt-1">₹{totalFines}</p>
                                    <p className="text-xs text-red-400 mt-2">Please pay at the library desk to avoid restrictions.</p>
                                </div>
                                <div className="p-3 bg-red-500/20 rounded-full">
                                    <AlertCircle size={32} className="text-red-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reservations Section */}
                    {user?.role === 'student' && reservations.length > 0 && (
                        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
                             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-amber-400">
                                <Clock size={24} /> Active Reservations
                            </h2>
                            <div className="space-y-4">
                                {reservations.map((res) => (
                                    <div key={String(res._id)} className="bg-black/20 p-4 rounded-xl flex justify-between items-center border border-white/5">
                                        <div>
                                            <h3 className="font-bold text-white">{res.bookId?.title || "Unknown Book"}</h3>
                                            <p className="text-xs text-gray-500">Reserved on: {new Date(res.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCancelReservation(res._id)}
                                            className="px-3 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/30 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current Borrowings Section */}
                    {user?.role === 'student' && (
                        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-green-400">
                                <BookOpen size={24} /> Current Borrowings
                            </h2>

                                                            {borrowedBooks.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {borrowedBooks.map((book) => {
                                                                    const status = getDueStatus(book.dueDate);
                                                                    return (
                                                                        <div key={String(book._id)} className="bg-black/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/5 hover:border-white/10 transition">
                                                                            <div>                                                    <h3 className="font-bold text-white text-lg">{book.bookTitle}</h3>
                                                    <p className="text-gray-500 text-sm">Borrowed: {new Date(book.borrowDate).toLocaleDateString()}</p>
                                                    {book.fineAmount > 0 && !book.isFinePaid && (
                                                       <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30">
                                                           Fine: ₹{book.fineAmount}
                                                       </span>
                                                    )}
                                                </div>
                                                <div className={`px-4 py-2 rounded-lg border ${status.color} font-mono text-sm font-bold flex items-center gap-2`}>
                                                    {status.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-gray-700">
                                    <BookOpen size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-400">You haven't borrowed any books yet.</p>
                                    <button onClick={() => navigate('/catalog')} className="mt-4 text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                                        Browse Catalog
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Info Card */}
                    {user?.role === 'admin' && (
                        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
                             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
                                <Shield size={24} /> Administrator Privileges
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                You have full access to manage the library catalog, user database, and borrowing records. 
                                Use the dashboard to oversee library operations.
                            </p>
                            <div className="mt-6 flex gap-4">
                                <button onClick={() => navigate('/admin-dashboard')} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg shadow-purple-500/20 font-medium">
                                    Go to Dashboard
                                </button>
                                <button onClick={() => navigate('/catalog')} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium">
                                    Manage Books
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Security */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl sticky top-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-400">
                            <Key size={20} /> Security Settings
                        </h2>
                        
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                <input 
                                    type="password"
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition text-sm"
                                    placeholder="••••••••"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                <input 
                                    type="password"
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition text-sm"
                                    placeholder="••••••••"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
                                <input 
                                    type="password"
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition text-sm"
                                    placeholder="••••••••"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={passwordLoading}
                                className="w-full py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/20 mt-2"
                            >
                                {passwordLoading ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>

            </div>

        </main>
      </div>
    </div>
  );
};

export default StudentProfile;


