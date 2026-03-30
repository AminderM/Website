import React, { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const RESEND_COOLDOWN = 60;

const VerifyOTPPage: React.FC = () => {
  const { verifyOtp, resendOtp, pendingEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Email comes from navigation state (from SignupPage) or pendingEmail in context
  const emailFromState = (location.state as { email?: string } | null)?.email;
  const email = emailFromState || pendingEmail || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if no email context
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // take last character
    setDigits(newDigits);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setError('');
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      await verifyOtp(email, otp);
      navigate('/bol-generator', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      // "Email already verified" → send to login
      if (msg.toLowerCase().includes('already verified')) {
        navigate('/login', { replace: true });
        return;
      }
      setError(msg);
      // Show resend if expired or too many attempts
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('too many')
      ) {
      }
      // Clear boxes on failure
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError('');
    try {
      await resendOtp(email);
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const inputBase = `w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
    isDark
      ? 'bg-gray-800 border-gray-600 text-white focus:border-primary-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-primary-600'
  }`;

  if (!email) return null;

  return (
    <div className={`min-h-screen pt-32 pb-16 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex p-4 rounded-full mb-4 ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
            <Mail className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verify Your Email
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We sent a 6-digit code to
          </p>
          <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {email}
          </p>
        </div>

        {/* Card */}
        <div className={`rounded-xl border shadow-lg ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
          <form onSubmit={handleSubmit}>
            {/* Error */}
            {error && (
              <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 border ${
                isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Resend success */}
            {resendSuccess && (
              <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 border ${
                isDark ? 'bg-green-950/30 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">New code sent — check your email.</p>
              </div>
            )}

            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-8">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={inputBase}
                  data-testid={`otp-digit-${i}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isVerifying || digits.join('').length < 6}
              className="w-full btn-primary py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              data-testid="verify-otp-btn"
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Resend */}
            <div className="text-center">
              {cooldown > 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Resend code in <span className="font-medium">{cooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                    isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
                  }`}
                  data-testid="resend-otp-btn"
                >
                  {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Back link */}
        <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Wrong email?{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-500 font-medium transition-colors">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
