import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, googleLogin } = useAuth();
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
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/tools');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/tools');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const inputBase = `w-full pl-10 pr-4 py-2.5 rounded-lg border bg-transparent transition-all duration-200 focus:outline-none ${
    isDark
      ? 'border-white/10 text-white placeholder-zinc-600 focus:border-primary-500/60 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)] hover:border-white/20'
      : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)] hover:border-gray-300'
  }`;
  const iconClass = `absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`;
  const labelClass = `block text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`;

  return (
    <div className={`relative min-h-screen flex items-center justify-center px-4 py-24 overflow-hidden ${isDark ? 'bg-dark' : 'bg-gray-50'}`}>

      {/* Background grid */}
      <div className={`absolute inset-0 bg-grid-pattern ${isDark ? 'opacity-30' : 'opacity-[0.04]'}`} />

      {/* Red glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber corner accents */}
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary-600/30 pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-gradient-primary">
            Welcome Back
          </h1>
          <p className={isDark ? 'text-zinc-500 text-sm' : 'text-gray-500 text-sm'}>
            Sign in to access your logistics tools
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl border overflow-hidden ${
            isDark
              ? 'bg-dark-100/80 border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40'
              : 'bg-white border-gray-200 shadow-xl'
          }`}
        >
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-600 to-transparent" />

          <form onSubmit={handleSubmit} className="p-8">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-3.5 rounded-lg mb-6 border text-sm ${
                  isDark ? 'bg-red-950/30 border-red-800/40 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className={`${iconClass} w-4 h-4`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={inputBase}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-2">
              <label htmlFor="password" className={labelClass}>Password</label>
              <div className="relative">
                <Lock className={`${iconClass} w-4 h-4`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`${inputBase} pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${
                    isDark ? 'text-zinc-600 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mb-6">
              <Link
                to="/forgot-password"
                className={`text-xs font-medium transition-colors ${
                  isDark ? 'text-zinc-500 hover:text-primary-400' : 'text-gray-500 hover:text-primary-600'
                }`}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary btn-glow py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5 relative overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div className={`flex items-center gap-3 mb-5 ${isDark ? 'text-white/10' : 'text-gray-200'}`}>
              <div className="flex-1 h-px bg-current" />
              <span className={`text-xs uppercase tracking-widest font-medium ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>or</span>
              <div className="flex-1 h-px bg-current" />
            </div>

            {/* Google */}
            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                theme={isDark ? 'filled_black' : 'outline'}
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            {/* Signup link */}
            <p className={`text-center text-sm ${isDark ? 'text-zinc-600' : 'text-gray-500'}`}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-500 hover:text-primary-400 font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
