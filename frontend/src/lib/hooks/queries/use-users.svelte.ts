import { createQuery, createMutation } from '@tanstack/svelte-query';
import { usersApi } from '$lib/api/endpoints/users.js';
import { queryClient } from '$lib/config/query-client.js';
import type { User } from '$lib/api/types/auth.types.js';
import type {
  CreateUserInvitationPayload,
  CreateUserPayload,
  UserInvitation,
  UserQueryParams,
  UserStats
} from '$lib/api/types/users.types.js';


export const useUsers = (params?: UserQueryParams) => {
  return createQuery(() => ({
    queryKey: ['users', params],
    queryFn: async (): Promise<User[]> => {
      return usersApi.getAll(params);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));
};


export const useUser = (id: number) => {
  return createQuery(() => ({
    queryKey: ['users', id],
    queryFn: async (): Promise<User> => {
      return usersApi.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};


export const useCreateUser = () => {
  return createMutation(() => ({
    mutationFn: async (data: CreateUserPayload): Promise<User> => {
      return usersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Create user failed:', error);
    },
  }));
};


export const useDeleteUser = () => {
  return createMutation(() => ({
    mutationFn: async (id: number): Promise<void> => {
      return usersApi.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Delete user failed:', error);
    },
  }));
};


export const useToggleUserActive = () => {
  return createMutation(() => ({
    mutationFn: async (id: number): Promise<User> => {
      return usersApi.toggleActive(id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Toggle user active failed:', error);
    },
  }));
};


export function useUserStats() {
  return createQuery(() => ({
    queryKey: ['users', 'stats'],
    queryFn: async (): Promise<UserStats> => {
      return usersApi.getStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
}

export const useUserInvitations = () => {
  return createQuery(() => ({
    queryKey: ['users', 'invitations'],
    queryFn: async (): Promise<UserInvitation[]> => {
      return usersApi.getInvitations();
    },
    staleTime: 60 * 1000,
  }));
};

export const useCreateUserInvitation = () => {
  return createMutation(() => ({
    mutationFn: async (data: CreateUserInvitationPayload): Promise<UserInvitation> => {
      return usersApi.createInvitation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'invitations'] });
    },
    onError: (error) => {
      console.error('Create user invitation failed:', error);
    },
  }));
};
