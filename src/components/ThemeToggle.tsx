import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const LONG_PRESS_MS = 500;

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, brightness, setBrightness } = useTheme();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseDown = () => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      setOpen(v => !v);
    }, LONG_PRESS_MS);
  };

  const handleMouseUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!didLongPress.current) toggleTheme();
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={e => e.preventDefault()}
        className={`relative p-2 rounded-lg transition-all duration-300 select-none ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        data-testid="theme-toggle"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 w-44 rounded-xl border shadow-xl px-4 py-3 z-50 ${
              isDark ? 'bg-dark-200 border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className={`w-3 h-3 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="range"
                min={30}
                max={100}
                step={1}
                value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #DC2626 0%, #DC2626 ${((brightness - 30) / 70) * 100}%, ${isDark ? '#374151' : '#D1D5DB'} ${((brightness - 30) / 70) * 100}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                }}
              />
              <Sun className={`w-3 h-3 shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
