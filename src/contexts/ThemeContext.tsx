import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check localStorage first
    const stored = localStorage.getItem('skillsplit-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;

    // 2. Fall back to system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';

    return 'light';
  });

  useEffect(() => {
    // Apply theme attribute to root <html> element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('skillsplit-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
