import { createQuery, createMutation } from '@tanstack/svelte-query';
import { stepsApi } from '$lib/api/endpoints/steps.js';
import { queryClient } from '$lib/config/query-client.js';
import type { Step } from '$lib/api/types/service.types.js';
import type { Image } from '$lib/api/types/service.types.js';
import type { UpdateStepDto } from '$lib/api/endpoints/steps.js';
import type { StepChecklist } from '$lib/api/types/service.types.js';

type StepsFilter = 'created_today' | 'expires_today' | 'expired';
type StepsFilterInput = StepsFilter | (() => StepsFilter | undefined) | undefined;
type StepsQueryOptions = {
  enabled?: boolean | (() => boolean);
};

export const useMySteps = (
  filter?: StepsFilterInput,
  options?: StepsQueryOptions,
) => {
  return createQuery(() => {
    const resolvedFilter = typeof filter === 'function' ? filter() : filter;
    const enabledOption = options?.enabled;
    const resolvedEnabled =
      typeof enabledOption === 'function' ? enabledOption() : enabledOption;

    return {
      queryKey: ['steps', 'my-steps', resolvedFilter],
      queryFn: (): Promise<Step[]> => stepsApi.getMySteps(resolvedFilter),
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: resolvedEnabled ?? true,
    };
  });
};

export const useStepsByUserId = (
  userId: number,
  filter?: StepsFilterInput,
  options?: StepsQueryOptions,
) => {
  return createQuery(() => {
    const resolvedFilter = typeof filter === 'function' ? filter() : filter;
    const enabledOption = options?.enabled;
    const resolvedEnabled =
      typeof enabledOption === 'function' ? enabledOption() : enabledOption;

    return {
      queryKey: ['steps', 'user', userId, resolvedFilter],
      queryFn: (): Promise<Step[]> => stepsApi.getStepsByUserId(userId, resolvedFilter),
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: (resolvedEnabled ?? true) && !!userId,
    };
  });
};

export const useStep = (id: number) => {
  return createQuery(() => ({
    queryKey: ['steps', id],
    queryFn: (): Promise<Step> => stepsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

export const useUpdateStep = () => {
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UpdateStepDto }): Promise<Step> =>
      stepsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['steps', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['steps', data.id] });
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      if (data.service_id) {
        queryClient.invalidateQueries({ queryKey: ['services', data.service_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Update step failed:', error);
    },
  }));
};

export const useStartStep = () => {
  return createMutation(() => ({
    mutationFn: (id: number): Promise<Step> => stepsApi.start(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['steps', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      // Invalidate service query because service status may change when step status changes
      if (data.service_id) {
        queryClient.invalidateQueries({ queryKey: ['services', data.service_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Start step failed:', error);
    },
  }));
};

export const useConcludeStep = () => {
  return createMutation(() => ({
    mutationFn: (id: number): Promise<Step> => stepsApi.conclude(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['steps', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      // Invalidate service query because service status may change when step status changes
      if (data.service_id) {
        queryClient.invalidateQueries({ queryKey: ['services', data.service_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Conclude step failed:', error);
    },
  }));
};

export const useCancelStep = () => {
  return createMutation(() => ({
    mutationFn: ({ id, reason }: { id: number; reason: string }): Promise<Step> =>
      stepsApi.cancel(id, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(['steps', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      // Invalidate service query because service status may change when step status changes
      if (data.service_id) {
        queryClient.invalidateQueries({ queryKey: ['services', data.service_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      console.error('Cancel step failed:', error);
    },
  }));
};

export const useStepImages = (stepId: number, options?: { enabled?: boolean | (() => boolean) }) => {
  return createQuery(() => {
    const enabledOption = options?.enabled;
    const resolvedEnabled = typeof enabledOption === 'function' ? enabledOption() : enabledOption;
    return {
      queryKey: ['steps', stepId, 'images'],
      queryFn: (): Promise<Image[]> => stepsApi.getImages(stepId),
      enabled: (resolvedEnabled ?? true) && !!stepId,
      staleTime: 2 * 60 * 1000,
    };
  });
};

export const useStepChecklists = (stepId: number) => {
  return createQuery(() => ({
    queryKey: ['steps', stepId, 'checklists'],
    queryFn: (): Promise<StepChecklist[]> => stepsApi.getChecklists(stepId),
    enabled: !!stepId,
    staleTime: 2 * 60 * 1000,
  }));
};

export const useCreateChecklist = () => {
  return createMutation(() => ({
    mutationFn: ({ stepId, data }: { stepId: number; data: { description: string } }): Promise<StepChecklist> =>
      stepsApi.createChecklist(stepId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['steps', variables.stepId, 'checklists'] });
    },
  }));
};

export const useToggleChecklist = () => {
  return createMutation(() => ({
    mutationFn: (checklistId: number): Promise<StepChecklist> =>
      stepsApi.toggleChecklist(checklistId),
    onSuccess: (data) => {
      // Invalidate step queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ['steps'] });
      queryClient.invalidateQueries({ queryKey: ['steps', 'my-steps'] });
      queryClient.invalidateQueries({ queryKey: ['steps', data.step_id] });
      // Invalidate service queries as step status may have changed
      if ((data as any).step?.service_id) {
        queryClient.invalidateQueries({ queryKey: ['services', (data as any).step.service_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  }));
};

export const useDeleteChecklist = () => {
  return createMutation(() => ({
    mutationFn: (checklistId: number): Promise<void> =>
      stepsApi.deleteChecklist(checklistId),
  }));
};

