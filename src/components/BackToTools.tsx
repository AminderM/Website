import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const BackToTools: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => navigate('/tools')}
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 mb-6 ${
        isDark
          ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/10 hover:border-white/20'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
      }`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Tools
    </button>
  );
};

export default BackToTools;
