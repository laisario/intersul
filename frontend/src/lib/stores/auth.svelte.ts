import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, AuthState } from '$lib/api/types/auth.types.js';
import { UserRole } from '$lib/api/types/auth.types.js';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create the auth store
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    
    /**
     * Initialize auth state from localStorage
     */
    init: () => {
      if (!browser) return;
      
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          update(state => ({
            ...state,
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          update(state => ({ ...state, isLoading: false }));
        }
      } else {
        update(state => ({ ...state, isLoading: false }));
      }
    },

    /**
     * Set authenticated user
     */
    setUser: (user: User, token: string) => {
      if (browser) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      update(state => ({
        ...state,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }));
    },

    /**
     * Clear authentication state
     */
    logout: () => {
      if (browser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    /**
     * Update user data
     */
    updateUser: (userData: Partial<User>) => {
      update(state => {
        if (!state.user) return state;
        
        const updatedUser = { ...state.user, ...userData };
        
        if (browser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return {
          ...state,
          user: updatedUser,
        };
      });
    },

    /**
     * Set loading state
     */
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const token = derived(authStore, $auth => $auth.token);

// Role-based helpers
export const userRole = derived(authStore, $auth => $auth.user?.role);
export const isAdmin = derived(authStore, $auth => $auth.user?.role === UserRole.ADMIN);
export const isManager = derived(authStore, $auth => 
  $auth.user?.role === UserRole.MANAGER || $auth.user?.role === UserRole.ADMIN
);
export const isTechnician = derived(authStore, $auth => 
  $auth.user?.role === UserRole.TECHNICIAN || 
  $auth.user?.role === UserRole.MANAGER || 
  $auth.user?.role === UserRole.ADMIN
);
export const isCommercial = derived(authStore, $auth => 
  $auth.user?.role === UserRole.COMMERCIAL || 
  $auth.user?.role === UserRole.MANAGER || 
  $auth.user?.role === UserRole.ADMIN
);

// Permission helpers
export const canManageUsers = derived(authStore, $auth => 
  $auth.user?.role === UserRole.ADMIN
);

export const canManageServices = derived(authStore, $auth => 
  $auth.user?.role === UserRole.MANAGER || $auth.user?.role === UserRole.ADMIN
);

export const canViewReports = derived(authStore, $auth => 
  $auth.user?.role === UserRole.MANAGER || $auth.user?.role === UserRole.ADMIN
);

// Initialize auth store when the module is imported
if (browser) {
  authStore.init();
}
