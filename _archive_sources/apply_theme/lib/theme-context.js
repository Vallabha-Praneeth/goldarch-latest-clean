'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');

      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return newValue;
    });
  };

  const colors = isDark ? {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    surface: 'rgba(30, 41, 59, 0.8)',
    surfaceSolid: '#1E293B',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    backgroundSolid: '#0F172A',
    card: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)',
    cardHover: 'linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(71, 85, 105, 0.95) 100%)',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    placeholder: '#64748B',
    border: 'rgba(148, 163, 184, 0.1)',
    borderHover: 'rgba(148, 163, 184, 0.3)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    skeleton: 'rgba(51, 65, 85, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    glow: 'rgba(59, 130, 246, 0.3)',
  } : {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    surface: 'rgba(255, 255, 255, 0.9)',
    surfaceSolid: '#FFFFFF',
    background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #F0FDFA 100%)',
    backgroundSolid: '#F0F9FF',
    card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
    cardHover: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(224, 242, 254, 1) 100%)',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    placeholder: '#94A3B8',
    border: 'rgba(148, 163, 184, 0.2)',
    borderHover: 'rgba(59, 130, 246, 0.3)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    skeleton: 'rgba(226, 232, 240, 0.5)',
    shadow: 'rgba(15, 23, 42, 0.1)',
    glow: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
