import { createQuery, createMutation } from '@tanstack/svelte-query';
import { copyMachinesApi } from '$lib/api/endpoints/copy-machines.js';
import { queryClient } from '$lib/config/query-client.js';
import type { 
  CopyMachineCatalog, 
  ClientCopyMachine, 
  Franchise,
  CreateCopyMachineCatalogDto, 
  UpdateCopyMachineCatalogDto,
  CreateClientCopyMachineDto,
  UpdateClientCopyMachineDto,
  CreateFranchiseDto,
  UpdateFranchiseDto
} from '$lib/api/types/copy-machine.types.js';
import type { PaginatedResponse } from '$lib/api/types/common.types.js';

export const useCopyMachines = (search?: string, page: number = 1, limit: number = 10) => {
  return createQuery(() => ({
    queryKey: ['copy-machines', search, page, limit],
    queryFn: () => copyMachinesApi.catalog.getAll(search, page, limit),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
  }));
};

export const useCopyMachine = (id: number) => {
  return createQuery(() => ({
    queryKey: ['copy-machine', id],
    queryFn: () => copyMachinesApi.catalog.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000, 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }));
};

export const useCreateCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: (data: CreateCopyMachineCatalogDto) => copyMachinesApi.catalog.create(data),
    onMutate: async (newMachine) => {
      await queryClient.cancelQueries({ queryKey: ['copy-machines'] });

      const previousMachines = queryClient.getQueriesData({ queryKey: ['copy-machines'] });

      queryClient.setQueriesData({ queryKey: ['copy-machines'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [{ ...newMachine, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...(old.data || [])],
          total: (old.total || 0) + 1
        };
      });

      return { previousMachines };
    },
    onError: (err, newMachine, context) => {
      if (context?.previousMachines) {
        context.previousMachines.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copy-machines'] });
    },
  }));
};

export const useUpdateCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateCopyMachineCatalogDto }) => copyMachinesApi.catalog.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['copy-machines'] });

      const previousMachines = queryClient.getQueriesData({ queryKey: ['copy-machines'] });

      queryClient.setQueriesData({ queryKey: ['copy-machines'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((machine: any) => 
            machine.id === id ? { ...machine, ...data, updated_at: new Date().toISOString() } : machine
          ) || []
        };
      });

      return { previousMachines };
    },
    onError: (err, variables, context) => {
      if (context?.previousMachines) {
        context.previousMachines.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedMachine, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copy-machines'] });
      queryClient.setQueryData(['copy-machine', variables.id], updatedMachine);
    },
  }));
};

export const useDeleteCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => copyMachinesApi.catalog.delete(id),
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: ['copy-machines'] });

      const previousMachines = queryClient.getQueriesData({ queryKey: ['copy-machines'] });

      queryClient.setQueriesData({ queryKey: ['copy-machines'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.filter((machine: any) => machine.id !== deletedId) || [],
          total: Math.max(0, (old.total || 0) - 1)
        };
      });

      return { previousMachines };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousMachines) {
        context.previousMachines.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copy-machines'] });
    },
  }));
};

export const useClientCopyMachines = (clientId: number) => {
  return createQuery(() => ({
    queryKey: ['client-copy-machines', clientId],
    queryFn: () => copyMachinesApi.client.getByClient(clientId),
    enabled: !!clientId,
  }));
};

export const useClientCopyMachine = (id: number) => {
  return createQuery(() => ({
    queryKey: ['client-copy-machine', id],
    queryFn: () => copyMachinesApi.client.getById(id),
    enabled: !!id,
  }));
};

export const useCreateClientCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: (data: CreateClientCopyMachineDto) => copyMachinesApi.client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-copy-machines'] });
    },
  }));
};

export const useUpdateClientCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientCopyMachineDto }) => copyMachinesApi.client.update(id, data),
    onSuccess: (_: any, variables: { id: number; data: UpdateClientCopyMachineDto }) => {
      queryClient.invalidateQueries({ queryKey: ['client-copy-machines'] });
      queryClient.invalidateQueries({ queryKey: ['client-copy-machine', variables.id] });
    },
  }));
};

export const useDeleteClientCopyMachine = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => copyMachinesApi.client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-copy-machines'] });
    },
  }));
};

// Franchise hooks
export const useFranchises = () => {
  return createQuery(() => ({
    queryKey: ['franchises'],
    queryFn: () => copyMachinesApi.franchise.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes - franchises don't change often
    gcTime: 30 * 60 * 1000,
  }));
};

export const useFranchise = (id: number) => {
  return createQuery(() => ({
    queryKey: ['franchise', id],
    queryFn: () => copyMachinesApi.franchise.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  }));
};

export const useCreateFranchise = () => {
  return createMutation(() => ({
    mutationFn: (data: CreateFranchiseDto) => copyMachinesApi.franchise.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
    },
  }));
};

export const useUpdateFranchise = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateFranchiseDto }) => copyMachinesApi.franchise.update(id, data),
    onSuccess: (_: any, variables: { id: number; data: UpdateFranchiseDto }) => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      queryClient.invalidateQueries({ queryKey: ['franchise', variables.id] });
    },
  }));
};

export const useDeleteFranchise = () => {
  return createMutation(() => ({
    mutationFn: (id: number) => copyMachinesApi.franchise.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
    },
  }));
};
