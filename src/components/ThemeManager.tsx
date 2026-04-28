import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ThemeManager() {
  useEffect(() => {
    let mode: 'dark' | 'light' | 'system' = 'dark';

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        mode = data.themeMode || 'dark';
        applyTheme(mode);
      } else {
        applyTheme('dark');
      }
    });

    // Handle system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (mode === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      unsubscribe();
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const applyTheme = (mode: 'dark' | 'light' | 'system') => {
    const root = window.document.documentElement;
    
    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(mode);
    }
    
    // Also set color-scheme CSS property
    root.style.colorScheme = (mode === 'system') ? 'light dark' : mode;
  };

  return null;
}
