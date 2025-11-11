/**
 * Categories API endpoints
 */

import { axios } from '../client.js';
import type { 
  Category,
  CreateCategoryDto,
  UpdateCategoryDto
} from '../types/service.types.js';

export const categoriesApi = {
  /**
   * Get all categories
   */
  getAll: (): Promise<Category[]> =>
    axios.get('/categories').then(res => res.data),

  /**
   * Get category by ID
   */
  getById: (id: number): Promise<Category> =>
    axios.get(`/categories/${id}`).then(res => res.data),

  /**
   * Create new category
   */
  create: (data: CreateCategoryDto): Promise<Category> =>
    axios.post('/categories', data).then(res => res.data),

  /**
   * Update category
   */
  update: (id: number, data: UpdateCategoryDto): Promise<Category> =>
    axios.patch(`/categories/${id}`, data).then(res => res.data),

  /**
   * Delete category
   */
  delete: (id: number): Promise<void> =>
    axios.delete(`/categories/${id}`).then(() => undefined),
};
