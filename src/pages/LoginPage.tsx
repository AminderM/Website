import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/bol-generator');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen pt-32 pb-16 px-4 ${
        isDark ? 'bg-dark-400' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Sign in to access your BOL Generator
          </p>
        </div>

        {/* Form Container */}
        <div
          className={`rounded-xl border ${
            isDark
              ? 'bg-dark-300 border-gray-700'
              : 'bg-white border-gray-200'
          } shadow-lg overflow-hidden`}
        >
          <form onSubmit={handleSubmit} className="p-8">
            {/* Error Alert */}
            {error && (
              <div className={`flex items-gap-3 p-4 rounded-lg mb-6 border ${
                isDark
                  ? 'bg-red-950/30 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-5 h-5 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-dark-400 border-gray-600 text-white placeholder-gray-500 focus:border-primary-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-600'
                  } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-5 h-5 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-dark-400 border-gray-600 text-white placeholder-gray-500 focus:border-primary-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-600'
                  } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  placeholder="••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className={`flex items-center gap-3 mb-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className="flex-1 h-px bg-current"></div>
              <span className="text-xs uppercase">Or</span>
              <div className="flex-1 h-px bg-current"></div>
            </div>

            {/* Signup Link */}
            <p className={`text-center text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>

        {/* Info Box */}
        <div className={`mt-8 p-4 rounded-lg border ${
          isDark
            ? 'bg-dark-300 border-gray-700 text-gray-300'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <p className="text-sm">
            <strong>Demo credentials:</strong> Use any email and password (6+ chars) to test.
            Our backend will handle signup/login integration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
