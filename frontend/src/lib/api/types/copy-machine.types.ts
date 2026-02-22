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
  isDisabled?: boolean;
}

export enum AcquisitionType {
  RENT = 'RENT',
  SOLD = 'SOLD',
  OWNED = 'OWNED',
}

export interface ClientCopyMachine extends BaseEntity {
  serialNumber: string;
  clientId: number;
  catalogCopyMachineId?: number;
  externalModel?: string;
  externalManufacturer?: string;
  externalDescription?: string;
  acquisitionType: AcquisitionType;
  value?: number;
  franchiseId?: number;
  ultimoContador?: number;
  client?: Client;
  catalogCopyMachine?: CopyMachineCatalog;
  franchise?: Franchise;
  services?: Service[];
}

export interface Franchise extends BaseEntity {
  period: string;
  paperType: string; 
  color: boolean;
  quantity: number;
  unitPrice?: number;
  isDisabled?: boolean;
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
  serialNumber: string;
  clientId: number;
  catalogCopyMachineId?: number;
  externalModel?: string;
  externalManufacturer?: string;
  externalDescription?: string;
  acquisitionType: AcquisitionType;
  value?: number;
  franchiseId?: number;
}

export interface UpdateClientCopyMachineDto extends Partial<CreateClientCopyMachineDto> {}

export interface CreateFranchiseDto {
  period: string;
  paperType: string;
  color: boolean;
  quantity: number;
  unitPrice: number;
}

export interface UpdateFranchiseDto extends Partial<CreateFranchiseDto> {}

export interface CopyMachineQueryParams {
  clientId?: number;
  status?: string; // TODO: Define proper enum if needed
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
