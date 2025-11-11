import type { BaseEntity } from './common.types';
import type { Client } from './client.types';
import type { Service } from './service.types.js';

export interface CopyMachineCatalog extends BaseEntity {
  model: string;
  manufacturer: string;
  description?: string;
  features: string[];
  price?: number;
  quantity?: number;
  file?: string;
}

export enum AcquisitionType {
  RENT = 'RENT',
  SOLD = 'SOLD',
  OWNED = 'OWNED',
}

export interface ClientCopyMachine extends BaseEntity {
  serial_number: string;
  client_id: number;
  catalog_copy_machine_id?: number;
  external_model?: string;
  external_manufacturer?: string;
  external_description?: string;
  acquisition_type: AcquisitionType;
  value?: number;
  franchise_id?: number;
  client?: Client;
  catalogCopyMachine?: CopyMachineCatalog;
  franchise?: Franchise;
  services?: Service[];
}

export interface Franchise extends BaseEntity {
  period: string;
  paper_type: string; 
  color: boolean;
  quantity: number;
  unitPrice: number;
}

export interface CreateCopyMachineCatalogDto {
  model: string;
  manufacturer: string;
  description?: string;
  features?: string[];
  price?: number;
  quantity?: number;
  file?: string;
}

export interface UpdateCopyMachineCatalogDto extends Partial<CreateCopyMachineCatalogDto> {
  id: number;
}

export interface CreateClientCopyMachineDto {
  serial_number: string;
  client_id: number;
  catalog_copy_machine_id?: number;
  external_model?: string;
  external_manufacturer?: string;
  external_description?: string;
  acquisition_type: AcquisitionType;
  value?: number;
  franchise_id?: number;
}

export interface UpdateClientCopyMachineDto extends Partial<CreateClientCopyMachineDto> {}

export interface CreateFranchiseDto {
  period: string;
  paper_type: string;
  color: boolean;
  quantity: number;
  unitPrice: number;
}

export interface UpdateFranchiseDto extends Partial<CreateFranchiseDto> {}

export interface CopyMachineQueryParams {
  clientId?: number;
  status?: ClientCopyMachineStatus;
  brand?: string;
  model?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CopyMachineStats {
  totalMachines: number;
  activeMachines: number;
  maintenanceRequired: number;
  totalClients: number;
  averageMachinesPerClient: number;
}
