"use client";
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = { 
  isLight: boolean; toggle: () => void;
  isTomatoMode: boolean; toggleMode: () => void;
};
const ThemeContext = createContext<Theme>({ isLight: false, toggle: () => {}, isTomatoMode: true, toggleMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLight, setIsLight] = useState(false);
  const [isTomatoMode, setIsTomatoMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('betman-theme');
    if (saved === 'light') {
      setIsLight(true);
      document.documentElement.classList.add('light');
    }
    const savedMode = localStorage.getItem('betman-mode');
    if (savedMode === 'zen') {
      setIsTomatoMode(false);
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

  const toggleMode = () => {
    setIsTomatoMode(prev => {
      const next = !prev;
      localStorage.setItem('betman-mode', next ? 'tomato' : 'zen');
      return next;
    });
  };

  return <ThemeContext.Provider value={{ isLight, toggle, isTomatoMode, toggleMode }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
