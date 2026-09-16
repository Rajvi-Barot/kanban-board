import { useEffect, useState } from 'react';
import { ThemeContext } from './theme';

// 'light' | 'dark' | 'system'. "system" means: don't set data-theme at all,
// so the CSS media query decides based on the OS preference.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('kanban_theme') || 'system'
  );

  useEffect(() => {
    localStorage.setItem('kanban_theme', theme);
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
