import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CheckoutCancelPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  return (
    <div className={`min-h-[60vh] flex items-center justify-center px-4 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className={`w-9 h-9 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Payment Cancelled
        </h1>
        <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No charge was made. You can upgrade whenever you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/product#pricing')}
            className="btn-primary inline-flex items-center gap-2"
          >
            View Plans
          </button>
          <button
            onClick={() => navigate(-1)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors inline-flex items-center gap-2 ${
              isDark
                ? 'border-gray-700 text-gray-300 hover:border-gray-500'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;