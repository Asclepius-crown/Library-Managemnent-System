import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Eye, EyeOff, BookOpen, Globe, ShieldCheck, Zap, Star } from "lucide-react";
import { useAuth } from "../component/AuthContext.jsx";
import logo from "../assets/logo.jpg";
import Header from "./Common/Catalog/Header";
import api from "../api/axiosClient";

// Toast notification
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className="fixed top-5 right-5 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-medium animate-fade-in border border-indigo-400/30 backdrop-blur-md"
      role="alert"
    >
      {message}
    </div>
  );
};

// Focus trap
const useFocusTrap = (ref, active) => {
  useEffect(() => {
    if (!active || !ref.current) return;
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(ref.current.querySelectorAll(selectors));
    if (focusable.length) focusable[0].focus();
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ref, active]);
};

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register } = useAuth();

  // === State ===
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({ password: false, confirmPassword: false });
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  
  const [featuredBook, setFeaturedBook] = useState(null);

  // Shared Header State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const modalRef = useRef(null);
  
  useFocusTrap(modalRef, !!activeForm);

  const closeModal = useCallback(() => {
    setActiveForm(null);
    navigate("/");
  }, [navigate]);

  // === Effects ===
  useEffect(() => {
    if (location.pathname === "/login") setActiveForm("login");
    else if (location.pathname === "/register") setActiveForm("register");
    else setActiveForm(null);
    setErrors({});
    setTouched({});
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeForm) closeModal();
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };
    if (activeForm || showProfileMenu) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeForm, showProfileMenu, closeModal]);

  // Fetch Featured Book
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/books/featured');
        setFeaturedBook(res.data);
      } catch (err) {
        console.error("Failed to fetch featured book", err);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === Handlers ===
  const overlayClickClose = (e, closeFn) => {
    if (e.target === e.currentTarget) closeFn();
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "email":
        if (!value) error = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Invalid email format.";
        break;
      case "password":
        if (!value) error = "Password is required.";
        else if (value.length < 6) error = "Min 6 characters required.";
        break;
      case "name":
        if (activeForm === "register" && !value) error = "Name is required.";
        break;
      case "confirmPassword":
        if (activeForm === "register") {
          if (!value) error = "Confirm password.";
          else if (value !== formData.password) error = "Passwords do not match.";
        }
        break;
    }
    setErrors((errs) => ({ ...errs, [name]: error }));
    return error === "";
  };

  const validateForm = () => {
    let valid = true;
    const toValidate = ["email", "password"];
    if (activeForm === "register") toValidate.push("name", "confirmPassword");
    toValidate.forEach((field) => {
      if (!validateField(field, formData[field])) valid = false;
    });
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setTouched({ email: true, password: true, name: true, confirmPassword: true });
      return;
    }
    setLoading(true);
    let result;
    if (activeForm === "login") {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.name, formData.email, formData.password);
    }
    setLoading(false);
    if (result.success) {
      setToastMsg(activeForm === "login" ? `Welcome back!` : `Account created!`);
      setActiveForm(null);
      navigate("/");
    } else {
      setErrors((errs) => ({ ...errs, general: result.message }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Header */}
      {isAuthenticated ? (
        <div className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/5">
          <Header 
            navigate={navigate}
            showProfileMenu={showProfileMenu}
            setShowProfileMenu={setShowProfileMenu}
            profileMenuRef={profileMenuRef}
          />
        </div>
      ) : (
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 rounded-full ring-2 ring-indigo-500/50" />
            <span className="text-xl font-bold tracking-tight">Athenaeum</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-300 hover:text-white transition">Login</button>
            <button onClick={() => navigate("/register")} className="px-5 py-2 text-sm font-bold bg-indigo-600 rounded-full hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">Register</button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              Discover a world of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400">
                Knowledge
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Access thousands of books, digital resources, and manage your reading journey with our modern library management system.
            </p>
            
            {isAuthenticated ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                <button onClick={() => navigate("/catalog")} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center lg:items-start gap-2 group">
                  <BookOpen className="text-indigo-400 group-hover:scale-110 transition" />
                  <span className="font-semibold">Browse Catalog</span>
                </button>
                <button onClick={() => navigate("/digital-library")} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center lg:items-start gap-2 group">
                  <Globe className="text-cyan-400 group-hover:scale-110 transition" />
                  <span className="font-semibold">Digital Library</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button onClick={() => navigate("/register")} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-lg transition shadow-xl shadow-indigo-500/20">
                  Get Started Free
                </button>
                <button onClick={() => navigate("/catalog")} className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full font-bold text-lg transition">
                  Explore as Guest
                </button>
              </div>
            )}

            <div className="pt-8 flex gap-8 justify-center lg:justify-start opacity-70 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-400" /> Secure Access</div>
              <div className="flex items-center gap-2"><Zap size={18} className="text-yellow-400" /> Fast Search</div>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-3xl transform -rotate-6"></div>
            <img 
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1000" 
              alt="Library Interior" 
              className="relative rounded-3xl shadow-2xl border border-white/10 transform transition hover:scale-[1.02] duration-500 object-cover h-[500px] w-full"
            />
          </div>
        </div>

        {/* Book of the Week Section */}
        {featuredBook && (
          <div className="max-w-7xl mx-auto px-6 pb-20 w-full animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent flex-grow"></div>
               <h2 className="text-3xl font-bold text-center flex items-center gap-2">
                 <Star className="text-yellow-400 fill-yellow-400" /> Book of the Week
               </h2>
               <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent flex-grow"></div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
               
               {/* Image */}
               <div className="w-48 h-72 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden border border-white/5 transform group-hover:scale-105 transition duration-500">
                  {featuredBook.imageUrl ? (
                    <img src={featuredBook.imageUrl} alt={featuredBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl font-bold">{featuredBook.title.charAt(0)}</div>
                  )}
               </div>

               {/* Content */}
               <div className="flex-grow text-center md:text-left">
                  <h3 className="text-4xl font-bold mb-2 text-white">{featuredBook.title}</h3>
                  <p className="text-xl text-indigo-400 mb-4 font-medium">{featuredBook.author}</p>
                  <p className="text-gray-400 mb-6 leading-relaxed max-w-2xl">
                    {featuredBook.description || "Dive into this week's featured selection. A masterpiece waiting to be explored."}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono border border-white/10 text-gray-400">
                      {featuredBook.genre || "General"}
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono border border-white/10 text-gray-400">
                      {featuredBook.publishedCount || "N/A"}
                    </span>
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={() => navigate('/catalog')}
                      className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Check Availability
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-lg mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2025 Athenaeum Library. All rights reserved.</p>
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>

      {/* Login/Register Modal */}
      {["login", "register"].includes(activeForm) && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => overlayClickClose(e, closeModal)}>
          <div ref={modalRef} className="bg-[#111] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-scale-in">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xl">&times;</button>
            
            <h2 className="text-2xl font-bold text-center mb-2">
              {activeForm === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400 text-center text-sm mb-8">
              {activeForm === "login" ? "Enter your details to access your account" : "Join our community of readers today"}
            </p>

            {errors.general && <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4 text-center">{errors.general}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeForm === "register" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Full Name</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition" />
                  {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="name@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition" />
                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                  <input name="password" type={showPassword.password ? "text" : "password"} value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition" />
                  <button type="button" onClick={() => setShowPassword(p => ({...p, password: !p.password}))} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                    {showPassword.password ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
              </div>

              {activeForm === "register" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Confirm Password</label>
                  <div className="relative">
                    <input name="confirmPassword" type={showPassword.confirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition" />
                    <button type="button" onClick={() => setShowPassword(p => ({...p, confirmPassword: !p.confirmPassword}))} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                      {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-bold text-white transition shadow-lg shadow-indigo-500/25 mt-2 flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin" /> : (activeForm === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {activeForm === "login" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setActiveForm(activeForm === "login" ? "register" : "login"); setErrors({}); }} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                {activeForm === "login" ? "Sign up" : "Log in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}