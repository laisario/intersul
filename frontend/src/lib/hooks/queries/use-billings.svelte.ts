import { createQuery, createMutation } from '@tanstack/svelte-query';
import { billingsApi } from '$lib/api/endpoints/billings.js';
import { queryClient } from '$lib/config/query-client.js';
import type {
  Billing,
  CreateBillingDto,
  UpdateBillingDto,
  GenerateBillingsDto,
  BillingQueryParams,
  BillingResponse,
  GenerateBillingsResponse,
} from '$lib/api/types/billing.types.js';
import { PAGINATION } from '$lib/utils/constants.js';

export const useBillings = (params?: BillingQueryParams | (() => BillingQueryParams | undefined)) => {
  return createQuery(() => {
    const resolvedParams = typeof params === 'function' ? params() : params;
    const hasParams = resolvedParams !== undefined;

    return {
      queryKey: ['billings', resolvedParams],
      queryFn: async (): Promise<BillingResponse> => {
        if (!resolvedParams) {
          return {
            data: [],
            total: 0,
            page: 1,
            limit: PAGINATION.DEFAULT_PAGE_SIZE,
            totalPages: 1,
          };
        }

        return billingsApi.getAll(resolvedParams);
      },
      enabled: hasParams,
      staleTime: 2 * 60 * 1000, // 2 minutes
    };
  });
};

/**
 * Get billing by ID
 */
export const useBilling = (id: number) => {
  return createQuery(() => ({
    queryKey: ['billings', id],
    queryFn: async (): Promise<Billing> => {
      return billingsApi.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Create billing mutation
 */
export const useCreateBilling = () => {
  return createMutation(() => ({
    mutationFn: async (data: CreateBillingDto): Promise<Billing> => {
      return billingsApi.create(data);
    },
    onSuccess: () => {
      // Invalidate and refetch billings list
      queryClient.invalidateQueries({ queryKey: ['billings'] });
    },
    onError: (error) => {
      console.error('Create billing failed:', error);
    },
  }));
};

/**
 * Update billing mutation
 */
export const useUpdateBilling = () => {
  return createMutation(() => ({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBillingDto }): Promise<Billing> => {
      return billingsApi.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['billings', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      if (data.stepId) {
        queryClient.invalidateQueries({ queryKey: ['steps', data.stepId] });
      }
    },
    onError: (error) => {
      console.error('Update billing failed:', error);
    },
  }));
};

/**
 * Delete billing mutation
 */
export const useDeleteBilling = () => {
  return createMutation(() => ({
    mutationFn: async (id: number): Promise<void> => {
      return billingsApi.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove billing from cache
      queryClient.removeQueries({ queryKey: ['billings', id] });
      // Invalidate billings list to refetch
      queryClient.invalidateQueries({ queryKey: ['billings'] });
    },
    onError: (error) => {
      console.error('Delete billing failed:', error);
    },
  }));
};

/**
 * Generate billings by city mutation
 */
export const useGenerateBillingsByCity = () => {
  return createMutation(() => ({
    mutationFn: async (data: GenerateBillingsDto): Promise<GenerateBillingsResponse> => {
      return billingsApi.generateByCity(data);
    },
    onSuccess: () => {
      // Invalidate billings, services, and steps
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error('Generate billings failed:', error);
    },
  }));
};


