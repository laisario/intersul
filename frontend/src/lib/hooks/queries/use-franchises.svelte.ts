import { createQuery, createMutation } from '@tanstack/svelte-query';
import { copyMachinesApi } from '$lib/api/endpoints/copy-machines.js';
import { queryClient } from '$lib/config/query-client.js';
import type { 
  Franchise, 
  CreateFranchiseDto, 
  UpdateFranchiseDto
} from '$lib/api/types/copy-machine.types.js';

export const useFranchises = () => {
  return createQuery(() => ({
    queryKey: ['franchises'],
    queryFn: () => copyMachinesApi.franchise.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }));
};

export const useFranchise = (id: number) => {
  return createQuery(() => ({
    queryKey: ['franchise', id],
    queryFn: () => copyMachinesApi.franchise.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  }));
};

export const useCreateFranchise = () => {
  return createMutation(() => ({
    mutationFn: (data: CreateFranchiseDto) => copyMachinesApi.franchise.create(data),
    onMutate: async (newFranchise) => {
      await queryClient.cancelQueries({ queryKey: ['franchises'] });

      const previousFranchises = queryClient.getQueryData(['franchises']);

      queryClient.setQueryData(['franchises'], (old: any) => {
        if (!old) return [{ ...newFranchise, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
        return [{ ...newFranchise, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...old];
      });

      return { previousFranchises };
    },
    onError: (err, newFranchise, context) => {
      if (context?.previousFranchises) {
        queryClient.setQueryData(['franchises'], context.previousFranchises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
    },
  }));
};

export const useUpdateFranchise = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateFranchiseDto }) => copyMachinesApi.franchise.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['franchises'] });

      const previousFranchises = queryClient.getQueryData(['franchises']);

      queryClient.setQueryData(['franchises'], (old: any) => {
        if (!old) return old;
        return old.map((franchise: any) => 
          franchise.id === id ? { ...franchise, ...data, updated_at: new Date().toISOString() } : franchise
        );
      });

      return { previousFranchises };
    },
    onError: (err, variables, context) => {
      if (context?.previousFranchises) {
        queryClient.setQueryData(['franchises'], context.previousFranchises);
      }
    },
    onSuccess: (updatedFranchise, variables) => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      queryClient.setQueryData(['franchise', variables.id], updatedFranchise);
    },
  }));
};

export const useDeleteFranchise = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => copyMachinesApi.franchise.delete(id),
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: ['franchises'] });

      const previousFranchises = queryClient.getQueryData(['franchises']);

      queryClient.setQueryData(['franchises'], (old: any) => {
        if (!old) return old;
        return old.filter((franchise: any) => franchise.id !== deletedId);
      });

      return { previousFranchises };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousFranchises) {
        queryClient.setQueryData(['franchises'], context.previousFranchises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
    },
  }));
};

