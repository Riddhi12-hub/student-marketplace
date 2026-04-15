/**
 * Navbar Component
 * Responsive navigation with auth state, search, and chat notifications
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag, Search, Heart, Bell, User, LogOut,
  Plus, LayoutDashboard, Menu, X, MessageSquare, ChevronDown,
  BookOpen, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, clearNotifications, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getAvatar = (u) => u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=6366f1&color=fff&size=80`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900 hidden sm:block">
              Uni<span className="text-primary-600">Market</span>
            </span>
          </Link>

          {/* ── Search Bar ── */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, gadgets, notes..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-xl
                  focus:bg-white focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100
                  transition-all duration-200 placeholder-slate-400"
              />
            </div>
          </form>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/products" className="btn-ghost text-sm py-2">Browse</Link>

            {user ? (
              <>
                {/* Sell button */}
                <Link to="/create-product" className="btn-primary text-sm py-2 ml-1">
                  <Plus size={16} /> Sell
                </Link>

                {/* Wishlist */}
                <Link to="/wishlist" className="btn-ghost relative p-2.5">
                  <Heart size={18} />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) clearNotifications(); }}
                    className="btn-ghost relative p-2.5"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 card shadow-soft animate-slide-up overflow-hidden">
                      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-700">Notifications</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          <span className="text-xs text-slate-400">{isConnected ? 'Live' : 'Offline'}</span>
                        </div>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                          {notifications.map((n, i) => (
                            <div key={i} className="p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                                  <MessageSquare size={14} className="text-primary-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{n.sender?.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{n.preview}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <img src={getAvatar(user)} alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary-100" />
                    <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-soft animate-slide-up overflow-hidden">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        {user.isTrustedSeller && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield size={11} className="text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">Trusted Seller</span>
                          </div>
                        )}
                      </div>
                      <div className="py-1">
                        {[
                          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                          { to: '/wishlist',  icon: Heart,           label: 'Wishlist' },
                          { to: '/profile',   icon: User,            label: 'Edit Profile' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <Icon size={15} className="text-slate-400" />
                            {label}
                          </Link>
                        ))}
                        <button onClick={logout}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link to="/login" className="btn-secondary text-sm py-2">Log in</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Sign up</Link>
              </div>
            )}
          </div>

          {/* ── Mobile menu button ── */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors ml-auto">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
          <div className="page-container py-3 space-y-1">
            <Link to="/products" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Browse Products</Link>
            {user ? (
              <>
                <Link to="/create-product" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50">
                  <Plus size={16} /> Sell an Item
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/wishlist" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Heart size={16} /> Wishlist
                </Link>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <User size={16} /> Profile
                </Link>
                <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" className="btn-secondary text-sm flex-1 justify-center">Log in</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 justify-center">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
