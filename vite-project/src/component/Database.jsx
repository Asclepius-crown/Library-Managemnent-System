import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BookOpen, Users, AlertCircle, Activity, TrendingUp, 
  Award, AlertTriangle, Database
} from 'lucide-react';
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
    overdueCount: 0,
    genreStats: [],
    health: { missingImages: 0, missingDescriptions: 0 },
    timeline: [],
    topReaders: [],
    deadStockCount: 0
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

      // Fetch Stats
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
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

  // Chart Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black text-white p-4 md:p-8 font-sans flex flex-col">
      <ToastArea toasts={toasts} />
      
      <Header 
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full space-y-8 pb-12">
        
        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
              <Activity className="text-cyan-400" size={32} />
              Library Intelligence Hub
            </h1>
            <p className="text-gray-400 mt-1">Real-time analytics and operational insights</p>
          </div>
          <button
             onClick={fetchData}
             className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition border border-gray-700 text-gray-300"
          >
            Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total Collection" 
            value={stats.totalBooks} 
            icon={<BookOpen size={24} />} 
            color="bg-blue-600"
          />
          <KpiCard 
            title="Active Members" 
            value={stats.totalUsers} 
            icon={<Users size={24} />} 
            color="bg-purple-600"
          />
          <KpiCard 
            title="Currently Borrowed" 
            value={stats.borrowedCount} 
            icon={<Database size={24} />} 
            color="bg-orange-600"
          />
          <KpiCard 
            title="Overdue Returns" 
            value={stats.overdueCount || overdueBooks.length} 
            icon={<AlertCircle size={24} />} 
            color="bg-red-600"
            alert={true}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Trend */}
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
                    <XAxis dataKey="_id" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                    <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff'}}
                      itemStyle={{color: '#fff'}}
                    />
                    <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Books Borrowed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Genre Distribution */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold mb-6 text-cyan-100">Genre Distribution</h3>
            <div className="h-64 w-full flex-1">
              {loading ? <LoadingPlaceholder /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genreStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="_id"
                    >
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

        {/* Lower Grid: Top Readers & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Reader Leaderboard */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
              <Award size={20} />
              Top Readers Leaderboard
            </h3>
            <div className="space-y-3">
              {stats.topReaders?.length > 0 ? (
                stats.topReaders.map((reader, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-200">{reader._id}</span>
                    </div>
                    <span className="text-sm font-mono text-cyan-400">{reader.count} books</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic text-center py-4">No data available</div>
              )}
            </div>
          </div>

          {/* Collection Health */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              Collection Health Monitor
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <HealthItem 
                 label="Dead Stock (Never Borrowed)" 
                 value={stats.deadStockCount} 
                 color="text-orange-400" 
               />
               <HealthItem 
                 label="Missing Cover Images" 
                 value={stats.health?.missingImages} 
                 color="text-red-400" 
               />
               <HealthItem 
                 label="Missing Descriptions" 
                 value={stats.health?.missingDescriptions} 
                 color="text-yellow-400" 
               />
            </div>
          </div>
        </div>

        {/* Existing Overdue Table - Operational */}
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
                    {user?.role === 'admin' && (
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {overdueBooks.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 4 : 3} className="px-6 py-12 text-center text-gray-500 italic">
                        Good news! No books are currently overdue.
                      </td>
                    </tr>
                  ) : (
                    overdueBooks.map((rec) => (
                      <tr key={String(rec._id)} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 font-medium text-white">{rec.bookTitle}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {user?.role === 'student' ? rec.studentId : (
                            <div>
                              <div className="text-white">{rec.studentName}</div>
                              <div className="text-xs text-gray-500 font-mono">{rec.studentId}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-red-300 font-medium">
                           {new Date(rec.dueDate).toLocaleDateString()}
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteOverdue(rec._id)}
                              className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1.5 rounded transition"
                            >
                              Clear Record
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

        {/* Navigation Footer */}
        <div className="flex justify-center pt-8">
           <button
            onClick={() => navigate("/catalog")}
            className="text-gray-400 hover:text-white transition flex items-center gap-2 group"
           >
             <span className="group-hover:-translate-x-1 transition-transform">←</span>
             Back to Main Catalog
           </button>
        </div>

      </div>
    </div>
  );
};

// Sub-components for cleaner code
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