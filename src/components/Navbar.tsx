import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, UserCircle, History } from 'lucide-react';
import IALogo from './IALogo';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isPaidUser, isEnterpriseUser } from '../types/auth';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled]       = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location   = useLocation();
  const { theme }  = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate   = useNavigate();
  const isDark     = theme === 'dark';

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min(y / docH, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { name: 'Product',   path: '/product'   },
    { name: 'Use Cases', path: '/use-cases' },
    { name: 'About',     path: '/about'     },
    { name: 'Contact',   path: '/contact'   },
  ];

  const tierLabel    = isEnterpriseUser(user) ? 'Enterprise' : isPaidUser(user) ? 'Pro' : 'Free';
  const tierColors   = isEnterpriseUser(user)
    ? 'bg-yellow-500/20 text-yellow-400'
    : isPaidUser(user)
    ? 'bg-primary-600/20 text-primary-400'
    : isDark ? 'bg-white/10 text-zinc-400' : 'bg-gray-100 text-gray-500';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[1200] transition-all duration-300 ${
        isScrolled
          ? isDark
            ? 'bg-dark-300/90 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20'
            : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm'
          : isDark
            ? 'bg-transparent'
            : 'bg-white/80 backdrop-blur-sm'
      }`}>

        {/* Scroll progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[1.5px] bg-gradient-to-r from-primary-700 via-primary-500 to-primary-400 transition-all duration-100 z-10"
          style={{ width: `${scrollProgress * 100}%` }}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <IALogo size={38} />
              </motion.div>
              <div className="hidden sm:block">
                <span className={`text-[10px] font-medium tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  SUPPLY CHAIN
                </span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 animated-underline ${
                      active
                        ? isDark ? 'text-white bg-white/[0.07]' : 'text-gray-900 bg-gray-100'
                        : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.name}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(v => !v)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ring-2 ${
                      isDark
                        ? 'bg-primary-600 text-white ring-primary-600/30 hover:ring-primary-500/60'
                        : 'bg-primary-600 text-white ring-primary-200 hover:ring-primary-300'
                    }`}
                    title={user?.full_name || user?.name || 'Account'}
                  >
                    {(() => {
                      const name = user?.full_name || user?.name || user?.email || '?';
                      const parts = name.split(/[\s@]/);
                      return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
                    })()}
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={{    opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden z-[1300] ${
                          isDark ? 'bg-dark-200 border-white/10' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className={`px-4 py-3.5 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                          <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Signed in as</p>
                          <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                          <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors}`}>
                            {tierLabel}
                          </span>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { navigate('/tools'); setIsUserMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                              isDark ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            My Tools
                          </button>
                          <button
                            onClick={() => { navigate('/account?tab=history'); setIsUserMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                              isDark ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <History className="w-4 h-4" />
                            History
                          </button>
                          <button
                            onClick={() => { navigate('/account'); setIsUserMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                              isDark ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <UserCircle className="w-4 h-4" />
                            Settings
                          </button>
                        </div>
                        <div className={`border-t py-1 ${isDark ? 'border-white/[0.08]' : 'border-gray-100'}`}>
                          <button
                            onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isDark ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary btn-glow text-sm px-5 py-2.5 rounded-xl"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
                onClick={() => setIsMobileMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isMobileMenuOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0,   opacity: 1 }}
                    exit={{    rotate:  90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed top-20 left-0 right-0 z-[1190] border-b backdrop-blur-xl ${
              isDark ? 'bg-dark-200/98 border-white/10' : 'bg-white/98 border-gray-200'
            }`}
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? isDark ? 'bg-white/10 text-white' : 'bg-primary-50 text-primary-700'
                        : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <div className={`pt-4 mt-4 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UserCircle className="w-5 h-5" /> Account Settings
                    </button>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={`block text-center px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${isDark ? 'border-white/10 text-zinc-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      Sign In
                    </Link>
                    <Link to="/signup" className="block btn-primary text-center rounded-xl">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;