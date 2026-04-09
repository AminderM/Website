import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const CheckoutSuccessPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Re-fetch the user so the tier updates in context after payment
  useEffect(() => {
    if (!token) return;
    const refresh = async () => {
      try {
        await fetch(`${BACKEND_URL}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    };
    // Give the webhook a moment to process before re-fetching
    const timer = setTimeout(refresh, 2000);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className={`min-h-[60vh] flex items-center justify-center px-4 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-green-500" />
        </div>
        <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Subscription Activated!
        </h1>
        <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome to{' '}
          <span className="font-semibold text-primary-500">
            Integra AI {user?.tier === 'enterprise' ? 'Enterprise' : 'Pro'}
          </span>
          . Your account has been upgraded and all features are now unlocked.
        </p>
        <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          A receipt has been sent to your email address.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/fuel-surcharge')}
            className="btn-primary inline-flex items-center gap-2"
          >
            Go to Tools <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/account')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
              isDark
                ? 'border-gray-700 text-gray-300 hover:border-gray-500'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            View Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;