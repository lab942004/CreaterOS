import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'creatoros_theme';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return 'dark';
}

/**
 * ThemeProvider — dark-first theme controller.
 * Writes `data-theme` on <html> so every design token resolves correctly,
 * and persists the explicit user choice (no OS auto-switching surprises).
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0A0F' : '#F7F7FA');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
