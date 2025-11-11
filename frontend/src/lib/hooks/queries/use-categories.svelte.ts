import { createQuery, createMutation } from '@tanstack/svelte-query';
import { categoriesApi } from '$lib/api/endpoints/categories.js';
import { queryClient } from '$lib/config/query-client.js';
import type { 
  Category, 
  CreateCategoryDto, 
  UpdateCategoryDto,
} from '$lib/api/types/service.types.js';

/**
 * Get all categories
 */
export const useCategories = () => {
  return createQuery(() => ({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      return categoriesApi.getAll();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));
};

/**
 * Get category by ID
 */
export const useCategory = (id: number) => {
  return createQuery(() => ({
    queryKey: ['categories', id],
    queryFn: async (): Promise<Category> => {
      return categoriesApi.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Create category mutation
 */
export const useCreateCategory = () => {
  return createMutation(() => ({
    mutationFn: async (data: CreateCategoryDto): Promise<Category> => {
      return categoriesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Create category failed:', error);
    },
  }));
};

/**
 * Update category mutation
 */
export const useUpdateCategory = () => {
  return createMutation(() => ({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCategoryDto }): Promise<Category> => {
      return categoriesApi.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Update category failed:', error);
    },
  }));
};

/**
 * Delete category mutation
 */
export const useDeleteCategory = () => {
  return createMutation(() => ({
    mutationFn: async (id: number): Promise<void> => {
      return categoriesApi.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['categories', id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Delete category failed:', error);
    },
  }));
};
