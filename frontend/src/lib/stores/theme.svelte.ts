/**
 * Theme store for dark/light mode management
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme => {
  if (!browser) return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// Initial state
const initialState: ThemeState = {
  theme: 'system',
  resolvedTheme: 'light',
};

function createThemeStore() {
  const { subscribe, set, update } = writable<ThemeState>(initialState);

  return {
    subscribe,
    
    /**
     * Initialize theme from localStorage and system preferences
     */
    init: () => {
      if (!browser) return;
      
      const storedTheme = getStoredTheme();
      const resolvedTheme = resolveTheme(storedTheme);
      
      set({
        theme: storedTheme,
        resolvedTheme,
      });
      
      applyTheme(resolvedTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (storedTheme === 'system') {
          const newResolvedTheme = getSystemTheme();
          update(state => ({ ...state, resolvedTheme: newResolvedTheme }));
          applyTheme(newResolvedTheme);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      // Cleanup function
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    },

    /**
     * Set theme
     */
    setTheme: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
      }
      
      const resolvedTheme = resolveTheme(theme);
      
      set({
        theme,
        resolvedTheme,
      });
      
      applyTheme(resolvedTheme);
    },

    /**
     * Toggle between light and dark
     */
    toggle: () => {
      update(state => {
        const newTheme = state.resolvedTheme === 'light' ? 'dark' : 'light';
        const newState = {
          theme: newTheme,
          resolvedTheme: newTheme,
        };
        
        if (browser) {
          localStorage.setItem('theme', newTheme);
        }
        
        applyTheme(newTheme);
        return newState;
      });
    },
  };
}

function applyTheme(theme: 'light' | 'dark') {
  if (!browser) return;
  
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }
}

export const themeStore = createThemeStore();

// Derived stores
export const theme = derived(themeStore, $theme => $theme.theme);
export const resolvedTheme = derived(themeStore, $theme => $theme.resolvedTheme);
export const isDark = derived(themeStore, $theme => $theme.resolvedTheme === 'dark');
export const isLight = derived(themeStore, $theme => $theme.resolvedTheme === 'light');

// Initialize theme store when the module is imported
if (browser) {
  themeStore.init();
}
