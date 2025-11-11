import { createQuery, createMutation } from '@tanstack/svelte-query';
import { servicesApi } from '$lib/api/endpoints/services.js';
import { queryClient } from '$lib/config/query-client.js';
import type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryParams,
  ServiceStats,
  ServiceCategory,
  ServiceStep
} from '$lib/api/types/service.types.js';
import type { PaginatedResponse } from '$lib/api/types/common.types.js';
import { PAGINATION } from '$lib/utils/constants.js';


export const useServices = (params?: ServiceQueryParams | (() => ServiceQueryParams | undefined)) => {
  return createQuery(() => {
    const resolvedParams = typeof params === 'function' ? params() : params;
    const hasParams = resolvedParams !== undefined;

    return {
      queryKey: ['services', resolvedParams],
      queryFn: async (): Promise<PaginatedResponse<Service>> => {
        if (!resolvedParams) {
          return {
            data: [],
            total: 0,
            page: 1,
            limit: PAGINATION.DEFAULT_PAGE_SIZE,
            totalPages: 1,
          };
        }

        return servicesApi.getAll(resolvedParams);
      },
      enabled: hasParams,
      staleTime: 2 * 60 * 1000, // 2 minutes
    };
  });
};

export const useClientServiceHistory = (
  clientId: number | null,
  options?: { limit?: number }
) => {
  return createQuery(() => ({
    queryKey: ['services', 'client-history', clientId, options?.limit],
    queryFn: async (): Promise<PaginatedResponse<Service>> => {
      if (!clientId) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: options?.limit ?? 5,
          totalPages: 1,
        };
      }

      return servicesApi.getAll({
        client_id: clientId,
        page: 1,
        limit: options?.limit ?? 5,
      });
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  }));
};

/**
 * Get service by ID
 */
export const useService = (id: number) => {
  return createQuery(() => ({
    queryKey: ['services', id],
    queryFn: async (): Promise<Service> => {
      return servicesApi.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Create service mutation
 */
export const useCreateService = () => {
  // Using centralized queryClient
  
  return createMutation(() => ({
    mutationFn: async (data: CreateServiceDto): Promise<Service> => {
      return servicesApi.create(data);
    },
    onSuccess: () => {
      // Invalidate and refetch services list
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Create service failed:', error);
    },
  }));
};

/**
 * Update service mutation
 */
export const useUpdateService = () => {
  // Using centralized queryClient
  
  return createMutation(() => ({
    mutationFn: async ({ id, data }: { id: number; data: UpdateServiceDto }): Promise<Service> => {
      return servicesApi.update(id, data);
    },
    onSuccess: (data) => {
      // Update the specific service in cache
      queryClient.setQueryData(['services', data.id], data);
      // Invalidate services list to refetch
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Update service failed:', error);
    },
  }));
};

/**
 * Delete service mutation
 */
export const useDeleteService = () => {
  // Using centralized queryClient
  
  return createMutation(() => ({
    mutationFn: async (id: number): Promise<void> => {
      return servicesApi.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove service from cache
      queryClient.removeQueries({ queryKey: ['services', id] });
      // Invalidate services list to refetch
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Delete service failed:', error);
    },
  }));
};

/**
 * Get service statistics
 */
export const useServiceStats = () => {
  return createQuery(() => ({
    queryKey: ['services', 'stats'],
    queryFn: async (): Promise<ServiceStats> => {
      return servicesApi.getStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Get service categories
 */
export const useServiceCategories = () => {
  return createQuery(() => ({
    queryKey: ['services', 'categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      return servicesApi.getCategories();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  }));
};

/**
 * Create service category mutation
 */
export const useCreateServiceCategory = () => {
  // Using centralized queryClient
  
  return createMutation(() => ({
    mutationFn: async (data: { name: string; description?: string; color?: string }): Promise<ServiceCategory> => {
      return servicesApi.createCategory(data);
    },
    onSuccess: () => {
      // Invalidate categories
      queryClient.invalidateQueries({ queryKey: ['services', 'categories'] });
    },
    onError: (error) => {
      console.error('Create service category failed:', error);
    },
  }));
};

/**
 * Update service step mutation
 */
export const useUpdateServiceStep = () => {
  // Using centralized queryClient
  
  return createMutation(() => ({
    mutationFn: async ({ 
      serviceId, 
      stepId, 
      data 
    }: { 
      serviceId: number; 
      stepId: number; 
      data: Partial<ServiceStep> 
    }): Promise<ServiceStep> => {
      return servicesApi.updateStep(serviceId, stepId, data);
    },
    onSuccess: (data, { serviceId }) => {
      // Invalidate the specific service to refetch with updated steps
      queryClient.invalidateQueries({ queryKey: ['services', serviceId] });
      // Also invalidate services list
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Update service step failed:', error);
    },
  }));
};
