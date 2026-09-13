'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 border flex-shrink-0 bg-white/80 dark:bg-ink-900/60 backdrop-blur-xl border-black/10 dark:border-white/10 text-slate-700 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 hover:border-amber-500/40 hover:bg-slate-100 dark:hover:bg-ink-850/80 shadow-ios-sm"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
      ) : (
        <Moon className="w-4 h-4 text-slate-800 fill-slate-800/20" />
      )}
    </button>
  );
}
