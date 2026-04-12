import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  brightness: number;
  setBrightness: (v: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketing-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [brightness, setBrightnessState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketing-brightness');
      if (saved) return Math.min(100, Math.max(30, Number(saved)));
    }
    return 100;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('marketing-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--page-brightness', `${brightness}%`);
    localStorage.setItem('marketing-brightness', String(brightness));
  }, [brightness]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const setBrightness = (v: number) => setBrightnessState(Math.min(100, Math.max(30, v)));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, brightness, setBrightness }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
