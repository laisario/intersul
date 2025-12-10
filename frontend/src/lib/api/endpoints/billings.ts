/**
 * Billings API endpoints
 */

import { axios } from '../client.js';
import type {
  Billing,
  CreateBillingDto,
  UpdateBillingDto,
  GenerateBillingsDto,
  BillingQueryParams,
  BillingResponse,
  GenerateBillingsResponse,
} from '../types/billing.types.js';

export const billingsApi = {
  /**
   * Get all billings with optional filters
   */
  getAll: (params?: BillingQueryParams): Promise<BillingResponse> =>
    axios.get('/billings', { params }).then((res) => res.data),

  /**
   * Get billing by ID
   */
  getById: (id: number): Promise<Billing> =>
    axios.get(`/billings/${id}`).then((res) => res.data),

  /**
   * Create new billing
   */
  create: (data: CreateBillingDto): Promise<Billing> =>
    axios.post('/billings', data).then((res) => res.data),

  /**
   * Update billing
   */
  update: (id: number, data: UpdateBillingDto): Promise<Billing> =>
    axios.patch(`/billings/${id}`, data).then((res) => res.data),

  /**
   * Delete billing
   */
  delete: (id: number): Promise<void> =>
    axios.delete(`/billings/${id}`).then(() => undefined),

  /**
   * Generate billings by city
   */
  generateByCity: (data: GenerateBillingsDto): Promise<GenerateBillingsResponse> =>
    axios.post('/billings/generate-by-city', data).then((res) => res.data),
};


