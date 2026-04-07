import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Truck, LogOut, UserCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Product', path: '/product' },
    { name: 'Use Cases', path: '/use-cases' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? isDark 
            ? 'bg-dark-300/95 backdrop-blur-lg border-b border-white/10'
            : 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            data-testid="logo-link"
          >
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Integrated Supply Chain
              </span>
              <span className={`text-xs block -mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                Technologies
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? isDark ? 'text-white' : 'text-gray-900'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid={`nav-${link.name.toLowerCase().replace(' ', '-')}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Button + Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isDark
                      ? 'bg-dark-300 text-white hover:bg-dark-200'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  data-testid="user-menu-btn"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user?.full_name || user?.name || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:block">My Profile</span>
                </button>
                {isUserMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-lg shadow-lg border z-50 ${
                      isDark
                        ? 'bg-dark-300 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        user?.tier === 'paid'
                          ? 'bg-primary-600/20 text-primary-400'
                          : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user?.tier === 'paid' ? 'Pro' : 'Free'}
                      </span>
                    </div>
                    <button
                      onClick={() => { navigate('/account'); setIsUserMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-dark-400' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      data-testid="account-settings-btn"
                    >
                      <UserCircle className="w-4 h-4" />
                      Account Settings
                    </button>
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                          isDark ? 'text-red-400 hover:bg-dark-400' : 'text-red-600 hover:bg-red-50'
                        }`}
                        data-testid="logout-btn"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isDark
                      ? 'text-white hover:text-gray-300'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                  data-testid="nav-login-btn"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm"
                  data-testid="nav-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className={`p-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-lg border-b transition-all duration-300 ${
          isDark 
            ? 'bg-dark-300/98 border-white/10' 
            : 'bg-white/98 border-gray-200'
        } ${
          isMobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible'
        }`}
      >
        <div className="px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block text-base font-medium py-2 transition-colors ${
                location.pathname === link.path
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className={`mt-4 border-t pt-4 space-y-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2 text-base font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Account Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-500 transition-colors"
                data-testid="mobile-logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-center px-4 py-2 text-base font-medium rounded-lg transition-colors border"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="block btn-primary text-center mt-4"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
