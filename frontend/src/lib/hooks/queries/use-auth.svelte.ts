/**
 * Authentication query hooks
 */

import { createQuery, createMutation } from '@tanstack/svelte-query';
import { authApi } from '$lib/api/endpoints/auth.js';
import { authStore } from '$lib/stores/auth.svelte.js';
import { queryClient } from '$lib/config/query-client.js';
import type {
  AcceptInvitationPayload,
  InvitationDetails,
  LoginCredentials,
  RegisterPayload,
  User
} from '$lib/api/types/auth.types.js';

/**
 * Login mutation
 */
export const useLogin = () => {
  return createMutation(() => ({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      return response;
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        authStore.setUser(data.user, data.access_token);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  }));
};

/**
 * Register mutation
 */
export const useRegister = () => {
  return createMutation(() => ({
    mutationFn: async (userData: RegisterPayload) => {
      const response = await authApi.register(userData);
      return response;
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        authStore.setUser(data.user, data.access_token);
      }
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  }));
};

/**
 * Get current user profile
 */
export const useProfile = () => {
  return createQuery(() => ({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<User> => {
      return authApi.getProfile();
    },
    enabled: true, // Will be controlled by the component
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  return createMutation(() => ({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      authStore.logout();
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      authStore.logout();
    },
  }));
};

/**
 * Change password mutation
 */
export const useChangePassword = () => {
  return createMutation(() => ({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return authApi.changePassword(data);
    },
    onSuccess: () => {
      // Password changed successfully
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  }));
};

export const useInvitationDetails = (token: string) => {
  return createQuery(() => ({
    queryKey: ['auth', 'invitation', token],
    queryFn: async (): Promise<InvitationDetails> => {
      return authApi.getInvitation(token);
    },
    enabled: !!token,
    retry: false,
  }));
};

export const useAcceptInvitation = () => {
  return createMutation(() => ({
    mutationFn: async (payload: AcceptInvitationPayload) => {
      return authApi.acceptInvitation(payload);
    },
    onSuccess: (data) => {
      if (data.access_token && data.user) {
        authStore.setUser(data.user, data.access_token);
        queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      }
    },
    onError: (error) => {
      console.error('Accept invitation failed:', error);
    },
  }));
};
