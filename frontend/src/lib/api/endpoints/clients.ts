/**
 * Clients API endpoints
 */

import { axios } from '../client.js';
import type { 
  Client, 
  CreateClientDto, 
  UpdateClientDto, 
  ClientQueryParams,
  ClientStats 
} from '../types/client.types.js';

export const clientsApi = {
  /**
   * Get all clients with optional filters
   */
  getAll: (params?: ClientQueryParams): Promise<Client[]> =>
    axios.get('/clients', { params }).then(res => res.data),

  /**
   * Get client by ID
   */
  getById: (id: number): Promise<Client> =>
    axios.get(`/clients/${id}`).then(res => res.data),

  /**
   * Create new client
   */
  create: (data: CreateClientDto): Promise<Client> =>
    axios.post('/clients', data).then(res => res.data),

  /**
   * Update client
   */
  update: (id: number, data: UpdateClientDto): Promise<Client> =>
    axios.patch(`/clients/${id}`, data).then(res => res.data),

  /**
   * Toggle client active status
   */
  toggleActive: (id: number): Promise<Client> =>
    axios.patch(`/clients/${id}/toggle-active`).then(res => res.data),

  /**
   * Delete client
   */
  delete: (id: number): Promise<void> =>
    axios.delete(`/clients/${id}`).then(() => undefined),

  /**
   * Get client statistics
   */
  getStats: (): Promise<ClientStats> =>
    axios.get('/clients/stats').then(res => res.data),

  /**
   * Search clients
   */
  search: (query: string): Promise<Client[]> =>
    axios.get('/clients/search', { params: { q: query } }).then(res => res.data),
};
