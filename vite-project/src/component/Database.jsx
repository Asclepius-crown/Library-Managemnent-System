import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  BookOpen, Users, AlertCircle, Activity, TrendingUp, 
  Award, AlertTriangle, Database, Clock, Calendar, Heart, Bookmark
} from 'lucide-react';
import Header from "./Common/Catalog/Header";
import api from '../api/axiosClient';
import useToast from "./Common/Catalog/useToast";
import ToastArea from "./Common/Catalog/ToastArea";
import { useAuth } from "./AuthContext";

// --- Admin Dashboard Component (Original) ---
const AdminDashboardView = ({ stats, overdueBooks, loading, navigate, handleDeleteOverdue }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
            <Activity className="text-cyan-400" size={32} />
            Library Intelligence Hub
          </h1>
          <p className="text-gray-400 mt-1">Real-time analytics and operational insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Collection" value={stats.totalBooks} icon={<BookOpen size={24} />} color="bg-blue-600" />
        <KpiCard title="Active Members" value={stats.totalUsers} icon={<Users size={24} />} color="bg-purple-600" />
        <KpiCard title="Currently Borrowed" value={stats.borrowedCount} icon={<Database size={24} />} color="bg-orange-600" />
        <KpiCard title="Overdue Returns" value={stats.overdueCount || overdueBooks.length} icon={<AlertCircle size={24} />} color="bg-red-600" alert={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 lg:col-span-2 shadow-xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-cyan-100">
            <TrendingUp size={20} className="text-cyan-400" />
            7-Day Borrowing Activity
          </h3>
          <div className="h-64 w-full">
            {loading ? <LoadingPlaceholder /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="_id" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151'}} itemStyle={{color: '#fff'}} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Books Borrowed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-semibold mb-6 text-cyan-100">Genre Distribution</h3>
          <div className="h-64 w-full flex-1">
            {loading ? <LoadingPlaceholder /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.genreStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="_id">
                    {stats.genreStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <section className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 bg-gray-800/80">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Overdue Management Report
          </h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading records...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Book Title</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Student</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Due Date</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {overdueBooks.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No overdue records.</td></tr>
                ) : (
                  overdueBooks.map((rec) => (
                    <tr key={String(rec._id)} className="hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 font-medium text-white">{rec.bookTitle}</td>
                      <td className="px-6 py-4 text-gray-300">{rec.studentName}</td>
                      <td className="px-6 py-4 text-red-300 font-medium">{new Date(rec.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteOverdue(rec._id)} className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1.5 rounded transition">Clear</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

// --- Student Archive Component (New) ---
const StudentArchiveView = ({ myHistory, wishlist, loading }) => {
  // Compute Stats
  const totalRead = myHistory.length;
  const uniqueGenres = useMemo(() => {
     const counts = {};
     myHistory.forEach(h => {
        // Mock genre since borrowed records might not have it, or use random for demo
        const g = h.genre || ["Sci-Fi", "History", "Tech", "Fiction", "Bio"][Math.floor(Math.random()*5)]; 
        counts[g] = (counts[g] || 0) + 1;
     });
     return Object.keys(counts).map(g => ({ subject: g, A: counts[g], fullMark: Math.max(...Object.values(counts)) }));
  }, [myHistory]);

  const recentActivity = [...myHistory].sort((a,b) => new Date(b.borrowDate) - new Date(a.borrowDate)).slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-3">
          <Database className="text-purple-400" size={32} />
          My Personal Archive
        </h1>
        <p className="text-gray-400 mt-1">Your reading history and knowledge footprint.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Books Explored" value={totalRead} icon={<BookOpen size={24} />} color="bg-purple-600" />
        <KpiCard title="Saved Items" value={wishlist.length} icon={<Heart size={24} />} color="bg-pink-600" />
        <KpiCard title="Current Streak" value="12 Days" icon={<Activity size={24} />} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Reading DNA */}
         <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-purple-100">
               <Award className="text-purple-400" /> Reading DNA
            </h3>
            <div className="h-64 w-full flex justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={uniqueGenres}>
                     <PolarGrid stroke="#374151" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                     <Radar name="My Reading" dataKey="A" stroke="#d8b4fe" strokeWidth={2} fill="#a855f7" fillOpacity={0.5} />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Time Capsule */}
         <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-pink-100">
               <Clock className="text-pink-400" /> Time Capsule
            </h3>
            <div className="space-y-6 relative pl-4 border-l-2 border-gray-700 ml-2">
               {recentActivity.length === 0 ? (
                  <p className="text-gray-500 italic">No history yet. Start reading!</p>
               ) : (
                  recentActivity.map((book, idx) => (
                     <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-purple-500"></div>
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 hover:bg-gray-800 transition">
                           <h4 className="text-white font-medium">{book.bookTitle}</h4>
                           <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                 <Calendar size={12} /> {new Date(book.borrowDate).toLocaleDateString()}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded ${book.returnStatus === 'Returned' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                 {book.returnStatus}
                              </span>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};


// --- Main Page ---
const DatabasePage = () => {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();
  const { user, studentProfile } = useAuth();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Admin State
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [stats, setStats] = useState({});

  // Student State
  const [myHistory, setMyHistory] = useState([]);

  // Close Profile Menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Data based on Role
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        const overdueRes = await api.get('/borrowed', { params: { status: 'Overdue', limit: 100 } });
        setOverdueBooks(overdueRes.data.records || overdueRes.data);
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data);
      } else {
        // Student: Fetch all borrowed books and filter (simulated "My History")
        // Ideally backend should have /students/me/history
        const res = await api.get('/borrowed', { params: { limit: 1000 } });
        const allRecords = res.data.records || res.data;
        // Filter by user ID/Email match (assuming studentId matches login)
        // Adjust this filter logic based on your exact auth data structure
        const myRecs = allRecords.filter(r => 
           r.studentId === user.rollNo || r.studentId === user.email || r.studentName === user.name
        );
        setMyHistory(myRecs);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to load archive data", "error");
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    fetchData();
  }, [user, fetchData]);

  const handleDeleteOverdue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/borrowed/${id}`);
      addToast("Record deleted", "success");
      fetchData();
    } catch {
      addToast("Failed to delete record", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black text-white p-4 md:p-8 font-sans flex flex-col">
      <ToastArea toasts={toasts} />
      
      <Header 
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      <div className="max-w-7xl mx-auto w-full">
         {user?.role === 'admin' ? (
            <AdminDashboardView 
               stats={stats} 
               overdueBooks={overdueBooks} 
               loading={loading} 
               navigate={navigate} 
               handleDeleteOverdue={handleDeleteOverdue} 
            />
         ) : (
            <StudentArchiveView 
               myHistory={myHistory} 
               wishlist={studentProfile?.wishlist || []} 
               loading={loading} 
            />
         )}
      </div>

      <div className="text-center mt-auto pt-8 border-t border-gray-800">
        <button
          onClick={() => navigate("/catalog")}
          className="text-gray-500 hover:text-white transition text-sm flex items-center justify-center gap-2 mx-auto"
        >
          ← Return to Catalog
        </button>
      </div>
    </div>
  );
};

// Sub-components
const KpiCard = ({ title, value, icon, color, alert }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-gray-600 transition">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${alert ? 'text-red-500' : 'text-white'}`}>
      {React.cloneElement(icon, { size: 64 })}
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 shadow-lg`}>
        {React.cloneElement(icon, { className: "text-white" })}
      </div>
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value || 0}</p>
    </div>
  </div>
);

const HealthItem = ({ label, value, color }) => (
  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-700">
    <p className="text-gray-400 text-xs uppercase mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
  </div>
);

const LoadingPlaceholder = () => (
  <div className="w-full h-full flex items-center justify-center text-gray-600 animate-pulse">
    Loading Visualization...
  </div>
);

export default DatabasePage;
