/**
 * Service steps query hooks
 */

import { createMutation } from '@tanstack/svelte-query';
import { servicesApi } from '$lib/api/endpoints/services.js';
import { queryClient } from '$lib/config/query-client.js';
import type { ServiceStep, ServiceStepStatus } from '$lib/api/types/service.types.js';

export const useCreateStep = () => {
  return createMutation({
    mutationFn: async ({ serviceId, data }: { serviceId: number; data: { title: string; description?: string; assignedUserId?: number } }) => {
      const response = await servicesApi.createStep(serviceId, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useUpdateStep = () => {
  return createMutation({
    mutationFn: async ({ serviceId, stepId, data }: { serviceId: number; stepId: number; data: { title?: string; description?: string; assignedUserId?: number; status?: ServiceStepStatus } }) => {
      const response = await servicesApi.updateStep(serviceId, stepId, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useDeleteStep = () => {
  return createMutation({
    mutationFn: async ({ serviceId, stepId }: { serviceId: number; stepId: number }) => {
      await servicesApi.deleteStep(serviceId, stepId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
