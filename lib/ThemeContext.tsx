'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'black';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isBlack: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isBlack: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('controle_lar_theme') as Theme | null;
        if (saved === 'black' || saved === 'light') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (theme === 'black') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'black' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('controle_lar_theme', next);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isBlack: theme === 'black' }}>
      <div className={theme === 'black' ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
