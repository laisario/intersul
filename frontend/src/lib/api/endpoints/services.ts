/**
 * Services API endpoints
 */

import { axios } from '../client.js';
import type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryParams,
  ServiceStats,
  ServiceCategory,
  ServiceStep
} from '../types/service.types.js';
import type { PaginatedResponse } from '../types/common.types.js';

export const servicesApi = {
  /**
   * Get all services with optional filters
   */
  getAll: (params?: ServiceQueryParams): Promise<PaginatedResponse<Service>> =>
    axios.get('/services', { params }).then(res => res.data),

  /**
   * Get service by ID
   */
  getById: (id: number): Promise<Service> =>
    axios.get(`/services/${id}`).then(res => res.data),

  /**
   * Create new service
   */
  create: (data: CreateServiceDto): Promise<Service> =>
    axios.post('/services', data).then(res => res.data),

  /**
   * Update service
   */
  update: (id: number, data: UpdateServiceDto): Promise<Service> =>
    axios.patch(`/services/${id}`, data).then(res => res.data),

  /**
   * Delete service
   */
  delete: (id: number): Promise<void> =>
    axios.delete(`/services/${id}`).then(() => undefined),

  /**
   * Get service statistics
   */
  getStats: (): Promise<ServiceStats> =>
    axios.get('/services/stats').then(res => res.data),

  /**
   * Get service categories
   */
  getCategories: (): Promise<ServiceCategory[]> =>
    axios.get('/services/categories').then(res => res.data),

  /**
   * Create service category
   */
  createCategory: (data: { name: string; description?: string; color?: string }): Promise<ServiceCategory> =>
    axios.post('/services/categories', data).then(res => res.data),

  /**
   * Update service step
   */
  updateStep: (serviceId: number, stepId: number, data: Partial<ServiceStep>): Promise<ServiceStep> =>
    axios.patch(`/services/${serviceId}/steps/${stepId}`, data).then(res => res.data),
};
