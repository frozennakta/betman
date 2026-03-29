"use client";
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = { isLight: boolean; toggle: () => void };
const ThemeContext = createContext<Theme>({ isLight: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('betman-theme');
    if (saved === 'light') {
      setIsLight(true);
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggle = () => {
    setIsLight(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('light', next);
      localStorage.setItem('betman-theme', next ? 'light' : 'dark');
      return next;
    });
  };

  return <ThemeContext.Provider value={{ isLight, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
