// Header.jsx
import logo from "../../../assets/logo.jpg";
import { User, Users, Library, Database, BookOpen, LogOut, Pencil, MonitorPlay } from "lucide-react";
import { useAuth } from "../../AuthContext";

export default function Header({
  navigate,
  showProfileMenu,
  setShowProfileMenu,
  profileMenuRef,
}) {
  const { user } = useAuth();

  return (
    <header className="w-full pt-6 px-4 md:px-12 relative z-40">
      <div className="flex justify-between items-center">
        {/* Logo + title */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src={logo} alt="Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full relative z-10 border-2 border-transparent group-hover:border-cyan-500/50 transition-all" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white select-none tracking-tight group-hover:text-cyan-400 transition-colors">
            Athenaeum
          </h1>
        </div>
        {/* Profile/Actions */}
        <div className="flex items-center gap-6">
          {/* Profile button */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="Profile menu"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            className="
              w-12 h-12
              rounded-full
              bg-black
              shadow-neumorphism
              flex items-center justify-center
              transition-transform
              hover:scale-105
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-cyan-500
            "
          >
            <User size={24} className="text-cyan-500" />
          </button>
          {showProfileMenu && (
            <div
              tabIndex={-1}
              role="menu"
              aria-label="Profile options"
              className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded shadow-xl z-50 overflow-hidden animate-dropdown-fade-slide"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/50">
                <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <Library size={16} className="mr-3" /> Main Menu
                </button>

                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/catalog"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <BookOpen size={16} className="mr-3" /> Catalog
                </button>

                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/digital-library"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <MonitorPlay size={16} className="mr-3" /> Digital Library
                </button>

                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/database"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <Database size={16} className="mr-3" /> Database
                </button>

                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/borrowed-students"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <BookOpen size={16} className="mr-3" /> Borrowed Books
                </button>

                {/* Admin Only Link */}
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate("/admin-dashboard"); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-cyan-400 hover:bg-gray-800 hover:text-cyan-300 transition-colors"
                    role="menuitem"
                  >
                    <Users size={16} className="mr-3" /> User Management
                  </button>
                )}
              </div>

              <div className="border-t border-gray-800 py-1">
                <button 
                  onClick={() => { setShowProfileMenu(false); navigate("/profile"); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <Pencil size={16} className="mr-3" /> Profile / Password
                </button>

                <button 
                  onClick={() => {
                    localStorage.removeItem("token");
                    setShowProfileMenu(false);
                    window.location.href = "/"; // Force full reload to clear context state cleanly
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                  role="menuitem"
                >
                  <LogOut size={16} className="mr-3" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}