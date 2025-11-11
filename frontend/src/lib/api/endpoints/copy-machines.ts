import { axios, axiosForFiles } from '../client.js';
import type { PaginatedResponse } from '../types/common.types.js';
import type { 
  CopyMachineCatalog,
  ClientCopyMachine,
  Franchise,
  CreateCopyMachineCatalogDto,
  UpdateCopyMachineCatalogDto,
  CreateClientCopyMachineDto,
  UpdateClientCopyMachineDto,
  CreateFranchiseDto,
  UpdateFranchiseDto,
  CopyMachineQueryParams,
  CopyMachineStats
} from '../types/copy-machine.types.js';

export const copyMachinesApi = {
  catalog: {
    getAll: async (search?: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<CopyMachineCatalog>> => {
      const params: any = { page, limit };
      if (search) params.search = search;
      
      const response = await axios.get('/copy-machines/catalog', { params });
      return response.data;
    },

    getById: (id: number): Promise<CopyMachineCatalog> =>
      axios.get(`/copy-machines/catalog/${id}`).then(res => res.data),

    create: async (data: FormData | CreateCopyMachineCatalogDto): Promise<CopyMachineCatalog> => {
      const client = (typeof FormData !== 'undefined' && data instanceof FormData) ? axiosForFiles : axios;
      const res = await client.post('/copy-machines/catalog', data);
      return res.data;
    },
    
    update: async (id: number, data: FormData | UpdateCopyMachineCatalogDto): Promise<CopyMachineCatalog> => {
      const client = (typeof FormData !== 'undefined' && data instanceof FormData) ? axiosForFiles : axios;
      const res = await client.patch(`/copy-machines/catalog/${id}`, data);
      return res.data;
    },

    delete: (id: number): Promise<void> =>
      axios.delete(`/copy-machines/catalog/${id}`).then(() => undefined),
  },

  // Client copy machines endpoints
  client: {
    /**
     * Get client copy machines by client ID
     */
    getByClient: (clientId: number): Promise<ClientCopyMachine[]> =>
      axios.get(`/copy-machines/client/by-client/${clientId}`).then(res => res.data),

    /**
     * Get client copy machine by ID
     */
    getById: (id: number): Promise<ClientCopyMachine> =>
      axios.get(`/copy-machines/client/${id}`).then(res => res.data),

    /**
     * Create new client copy machine
     */
    create: (data: CreateClientCopyMachineDto): Promise<ClientCopyMachine> =>
      axios.post('/copy-machines/client', data).then(res => res.data),

    /**
     * Update client copy machine
     */
    update: (id: number, data: UpdateClientCopyMachineDto): Promise<ClientCopyMachine> =>
      axios.patch(`/copy-machines/client/${id}`, data).then(res => res.data),

    /**
     * Delete client copy machine
     */
    delete: (id: number): Promise<void> =>
      axios.delete(`/copy-machines/client/${id}`).then(() => undefined),
  },

  // Franchise endpoints
  franchise: {
    /**
     * Get all franchises
     */
    getAll: (): Promise<Franchise[]> =>
      axios.get('/copy-machines/franchise').then(res => res.data),

    /**
     * Get franchise by ID
     */
    getById: (id: number): Promise<Franchise> =>
      axios.get(`/copy-machines/franchise/${id}`).then(res => res.data),

    /**
     * Create new franchise
     */
    create: (data: CreateFranchiseDto): Promise<Franchise> =>
      axios.post('/copy-machines/franchise', data).then(res => res.data),

    /**
     * Update franchise
     */
    update: (id: number, data: UpdateFranchiseDto): Promise<Franchise> =>
      axios.patch(`/copy-machines/franchise/${id}`, data).then(res => res.data),

    /**
     * Delete franchise
     */
    delete: (id: number): Promise<void> =>
      axios.delete(`/copy-machines/franchise/${id}`).then(() => undefined),
  },

  /**
   * Get copy machine statistics
   */
  getStats: (): Promise<CopyMachineStats> =>
    axios.get('/copy-machines/stats').then(res => res.data),
};
