import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Search, Filter, Download, Trash2, Pencil, CheckCircle, 
  AlertCircle, Clock, DollarSign, BookOpen, RefreshCw
} from 'lucide-react';
import { useAuth } from "../component/AuthContext.jsx";
import api from "../api/axiosClient";
import Papa from "papaparse";
import Header from "./Common/Catalog/Header";

// --- Components ---

const StatCard = ({ title, value, icon, color, subtext }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-gray-600 transition">
    <div className={`absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-transform group-hover:scale-110 ${color}`}>
      {React.cloneElement(icon, { size: 100 })}
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg ${color.replace('text-', 'bg-').replace('500', '600')} bg-opacity-20 flex items-center justify-center mb-4 text-white shadow-inner`}>
        {icon}
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
      {subtext && <p className="text-xs text-gray-500 mt-2 font-mono">{subtext}</p>}
    </div>
  </div>
);

const Badge = ({ children, type }) => {
  const styles = {
    Overdue: "bg-red-900/40 text-red-300 border-red-700/50",
    Returned: "bg-green-900/40 text-green-300 border-green-700/50",
    "Not Returned": "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
    Paid: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    Unpaid: "bg-orange-900/40 text-orange-300 border-orange-700/50"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type] || 'bg-gray-800 text-gray-300'}`}>
      {children}
    </span>
  );
};

// --- Main Page Component ---

export default function CirculationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filter/Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all records for client-side analytics (limit: 1000 for safety)
      const { data } = await api.get("/borrowed", { 
        params: { limit: 1000 } 
      });
      // Handle different API response structures if necessary
      const recs = data.records || data; 
      setRecords(recs);
    } catch (err) {
      showToast("Failed to fetch circulation data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Click Outside for Header ---
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Analytics Calculations (Memoized) ---
  const stats = useMemo(() => {
    const total = records.length;
    const returned = records.filter(r => r.returnStatus === 'Returned').length;
    const overdue = records.filter(r => r.returnStatus === 'Overdue').length;
    const active = total - returned;
    
    const totalFines = records.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);
    const unpaidFines = records.filter(r => !r.isFinePaid).reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);

    // Timeline Data (Last 7 Days)
    const timelineMap = {};
    const today = new Date();
    for(let i=6; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      timelineMap[d.toISOString().slice(0,10)] = 0;
    }
    records.forEach(r => {
      const date = r.borrowDate?.slice(0, 10);
      if (timelineMap[date] !== undefined) timelineMap[date]++;
    });
    const timelineData = Object.entries(timelineMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, {weekday: 'short'}),
      borrowed: count
    }));

    // Status Distribution
    const statusData = [
      { name: 'Active', value: active - overdue, color: '#FBBF24' }, // Yellow
      { name: 'Overdue', value: overdue, color: '#EF4444' }, // Red
      { name: 'Returned', value: returned, color: '#10B981' }, // Green
    ].filter(d => d.value > 0);

    return { total, returned, overdue, active, totalFines, unpaidFines, timelineData, statusData };
  }, [records]);

  // --- Filtered Records ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || r.returnStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // --- Actions ---
  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this record?")) return;
    try {
      await api.delete(`/borrowed/${id}`);
      showToast("Record deleted successfully");
      fetchData();
    } catch {
      showToast("Failed to delete record", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsEditSaving(true);
    try {
      await api.put(`/borrowed/${editingRecord._id}`, editingRecord);
      showToast("Record updated successfully");
      setEditingRecord(null);
      fetchData();
    } catch {
      showToast("Failed to update record", "error");
    } finally {
      setIsEditSaving(false);
    }
  };

  const markFinePaid = async () => {
    if(!window.confirm("Confirm fine payment?")) return;
    try {
        // Optimistic update for smoother UI
        const updated = { ...editingRecord, isFinePaid: true };
        setEditingRecord(updated);
        await api.patch(`/borrowed/${editingRecord._id}/pay-fine`); // Ensure backend has this specific route or use PUT
        showToast("Fine marked as paid");
    } catch (err) {
        // Fallback if specific route doesn't exist, try generic PUT
         try {
            await api.put(`/borrowed/${editingRecord._id}`, { ...editingRecord, isFinePaid: true });
            showToast("Fine marked as paid");
         } catch {
            showToast("Failed to update payment status", "error");
         }
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filteredRecords.map(r => ({
      "Book": r.bookTitle,
      "Student": r.studentName,
      "ID": r.studentId,
      "Borrowed": new Date(r.borrowDate).toLocaleDateString(),
      "Due": new Date(r.dueDate).toLocaleDateString(),
      "Status": r.returnStatus,
      "Fine": r.fineAmount || 0,
      "Paid": r.isFinePaid ? 'Yes' : 'No'
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `circulation_report_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-cyan-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce-in border ${
          toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-100' : 'bg-cyan-900/90 border-cyan-700 text-cyan-100'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <Header 
        navigate={navigate}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        profileMenuRef={profileMenuRef}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
              <RefreshCw className="text-cyan-400" />
              Circulation Command Center
            </h1>
            <p className="text-gray-400 mt-1">Manage loans, returns, and overdue fines efficiently.</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-sm transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>

        {/* Analytics Dashboard (Admin Only) */}
        {user?.role === 'admin' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Active Loans" 
                value={stats.active} 
                icon={<BookOpen />} 
                color="text-yellow-500" 
              />
              <StatCard 
                title="Overdue Books" 
                value={stats.overdue} 
                icon={<AlertCircle />} 
                color="text-red-500"
                subtext={`${((stats.overdue/stats.total)*100).toFixed(1)}% of total`}
              />
              <StatCard 
                title="Returned On-Time" 
                value={stats.returned} 
                icon={<CheckCircle />} 
                color="text-green-500"
              />
              <StatCard 
                title="Outstanding Fines" 
                value={`$${stats.unpaidFines}`} 
                icon={<DollarSign />} 
                color="text-orange-500"
                subtext={`Total Collected: $${stats.totalFines - stats.unpaidFines}`}
              />
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Activity Chart */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 lg:col-span-2 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-cyan-100 flex items-center gap-2">
                  <Clock size={18} /> Daily Borrowing Trend (Last 7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 12}} />
                      <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#111827', borderColor: '#374151', color: '#fff'}}
                        cursor={{fill: '#374151', opacity: 0.4}}
                      />
                      <Bar dataKey="borrowed" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-cyan-100">Loan Status Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Data Table Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          
          {/* Table Controls */}
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-96 group">
                <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-cyan-400 transition" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by book, student, or ID..." 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="flex gap-3 w-full md:w-auto">
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <select 
                    className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-gray-800 transition"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Returned">Returned</option>
                    <option value="Not Returned">Active Loans</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                
                <button 
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-medium transition"
                >
                  <Download size={16} /> Export
                </button>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Book Title</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Fines</th>
                  {user?.role === 'admin' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={String(r._id)} className="hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white">{r.bookTitle}</td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{r.studentName || 'N/A'}</div>
                        <div className="text-xs text-cyan-500/80 font-mono">{r.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${r.returnStatus === 'Overdue' ? 'text-red-400' : 'text-gray-300'}`}>
                          {new Date(r.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Borrowed: {new Date(r.borrowDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge type={r.returnStatus}>{r.returnStatus}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.fineAmount > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono font-bold text-orange-400">${r.fineAmount}</span>
                            <Badge type={r.isFinePaid ? "Paid" : "Unpaid"}>{r.isFinePaid ? "Paid" : "Unpaid"}</Badge>
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingRecord(r); }}
                              className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(r._id)}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Edit Modal Overlay */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Edit Loan Details</h3>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Book Title</label>
                    <input type="text" disabled value={editingRecord.bookTitle} className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed" />
                 </div>
                 
                 <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Status</label>
                    <select 
                      value={editingRecord.returnStatus}
                      onChange={e => setEditingRecord({...editingRecord, returnStatus: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                    >
                      <option>Not Returned</option>
                      <option>Returned</option>
                      <option>Overdue</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Due Date</label>
                    <input 
                      type="date" 
                      value={editingRecord.dueDate?.slice(0, 10)}
                      onChange={e => setEditingRecord({...editingRecord, dueDate: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                 </div>
              </div>

              {/* Fine Management Section */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-300">Fine Assessment</span>
                    <span className="text-xs text-gray-500">Auto-calculated if overdue</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                       <span className="absolute left-3 top-2 text-gray-500">$</span>
                       <input 
                         type="number" 
                         value={editingRecord.fineAmount || 0}
                         onChange={e => setEditingRecord({...editingRecord, fineAmount: Number(e.target.value)})}
                         className="w-full bg-gray-900 border border-gray-600 rounded pl-6 pr-3 py-1.5 text-white text-sm"
                       />
                    </div>
                    {editingRecord.fineAmount > 0 && !editingRecord.isFinePaid && (
                       <button 
                         type="button"
                         onClick={markFinePaid}
                         className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-lg transition"
                       >
                         Mark Paid
                       </button>
                    )}
                    {editingRecord.isFinePaid && (
                       <span className="px-3 py-1.5 bg-green-900/30 text-green-400 text-xs font-bold rounded border border-green-800">
                         PAID
                       </span>
                    )}
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isEditSaving}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg transition flex items-center gap-2"
                >
                  {isEditSaving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}