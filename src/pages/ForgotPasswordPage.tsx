import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    // Backend endpoint for password reset will be wired here once available
    setSubmitted(true);
  };

  const inputBase = `w-full pl-10 pr-4 py-2.5 rounded-lg border bg-transparent transition-all duration-200 focus:outline-none ${
    isDark
      ? 'border-white/10 text-white placeholder-zinc-600 focus:border-primary-500/60 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)] hover:border-white/20'
      : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)] hover:border-gray-300'
  }`;

  return (
    <div className={`relative min-h-screen flex items-center justify-center px-4 py-24 overflow-hidden ${isDark ? 'bg-dark' : 'bg-gray-50'}`}>

      <div className={`absolute inset-0 bg-grid-pattern ${isDark ? 'opacity-30' : 'opacity-[0.04]'}`} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary-600/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary-600/30 pointer-events-none" />

      <div className="relative w-full max-w-md">

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-gradient-primary">Reset Password</h1>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            Enter your email and we'll send you a reset link
          </p>
        </motion.div>

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
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-600 to-transparent" />

          <div className="p-8">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Check your inbox</p>
                <p className={`text-sm mb-6 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                  If <strong>{email}</strong> has an account, you'll receive a reset link shortly.
                </p>
                <Link to="/login" className="text-primary-500 hover:text-primary-400 text-sm font-semibold transition-colors">
                  ← Back to Sign In
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3.5 rounded-lg mb-5 border text-sm ${
                      isDark ? 'bg-red-950/30 border-red-800/40 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <div className="mb-6">
                  <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className={inputBase}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary btn-glow py-2.5 rounded-lg font-semibold transition-all mb-5"
                >
                  Send Reset Link
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
