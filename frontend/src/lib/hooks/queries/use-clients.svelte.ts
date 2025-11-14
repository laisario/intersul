import { createQuery, createMutation } from '@tanstack/svelte-query';
import { clientsApi } from '$lib/api/endpoints/clients.js';
import { queryClient } from '$lib/config/query-client.js';
import type { 
  Client, 
  CreateClientDto, 
  UpdateClientDto
} from '$lib/api/types/client.types.js';

export const useClients = () => {
  return createQuery(() => ({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }));
};

export const useClient = (id: number) => {
  return createQuery(() => ({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  }));
};

export const useCreateClient = () => {
  return createMutation(() => ({
    mutationFn: (data: CreateClientDto) => clientsApi.create(data),
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      const previousClients = queryClient.getQueryData(['clients']);

      queryClient.setQueryData(['clients'], (old: any) => {
        if (!old) return [{ ...newClient, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
        return [{ ...newClient, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...old];
      });

      return { previousClients };
    },
    onError: (err, newClient, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  }));
};

export const useUpdateClient = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientDto }) => clientsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      const previousClients = queryClient.getQueryData(['clients']);

      queryClient.setQueryData(['clients'], (old: any) => {
        if (!old) return old;
        return old.map((client: any) => 
          client.id === id ? { ...client, ...data, updated_at: new Date().toISOString() } : client
        );
      });

      return { previousClients };
    },
    onError: (err, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
    },
    onSuccess: (updatedClient, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.setQueryData(['client', variables.id], updatedClient);
    },
  }));
};

export const useToggleClientActive = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => clientsApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['client', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error('Toggle client active failed:', error);
    },
  }));
};

export const useDeleteClient = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => clientsApi.delete(id),
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      const previousClients = queryClient.getQueryData(['clients']);

      queryClient.setQueryData(['clients'], (old: any) => {
        if (!old) return old;
        return old.filter((client: any) => client.id !== deletedId);
      });

      return { previousClients };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  }));
};

export const useClientStats = () => {
  return createQuery(() => ({
    queryKey: ['clients', 'stats'],
    queryFn: () => clientsApi.getStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }));
};
