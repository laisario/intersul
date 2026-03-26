/**
 * Service-related types
 */

import type { BaseEntity } from './common.types';
import type { Client } from './client.types';
import type { AcquisitionType, ClientCopyMachine } from './copy-machine.types';

export interface ServiceCategory extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  active: boolean;
}

export interface Service extends BaseEntity {
  description?: string;
  clientId: number;
  categoryId: number;
  clientCopyMachineId?: number;
  client?: Client;
  category?: Category;
  clientCopyMachine?: ClientCopyMachine;
  steps?: Step[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  priority?: string;
  reasonCancellament?: string;
  isInternal?: boolean;
  amountToReceive?: number;
  paymentMethod?: string;
  isInvoiced?: boolean;
}

export const ServiceStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
} as const;

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const ServicePriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type ServicePriority = (typeof ServicePriority)[keyof typeof ServicePriority];

export interface Step extends BaseEntity {
  name: string;
  description: string;
  observation?: string;
  responsableClient?: string;
  reasonCancellament?: string;
  status?: string;
  datetimeStart?: string;
  datetimeConclusion?: string;
  datetimeExpiration?: string;
  categoryId?: number;
  serviceId?: number;
  responsableId?: number;
  dependsOnStepId?: number | null;
  isBilling?: boolean;
  responsable?: User;
  service?: Service;
  category?: Category;
  images?: Image[];
  billing?: import('./billing.types.js').Billing;
  dependsOn?: Step;
  canStart?: boolean;
  blockReason?: string;
}

export interface StepTemplate {
  name: string;
  description: string;
  observation?: string;
  responsableClient?: string;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  steps?: Step[];
  services?: Service[];
}

export const ServiceStepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

export type ServiceStepStatus = (typeof ServiceStepStatus)[keyof typeof ServiceStepStatus];

export interface CreateServiceStepDto {
  name: string;
  description: string;
  observation?: string;
  responsableId?: number;
  responsableClient?: string;
  datetimeStart?: string;
  datetimeConclusion?: string;
  datetimeExpiration?: string;
}

export interface CreateServiceDto {
  clientId?: number;
  categoryId?: number;
  clientCopyMachineId?: number;
  description?: string;
  priority?: string;
  steps?: CreateServiceStepDto[];
  isInternal?: boolean;
  /** When true on an external service, payment fields apply and payment/boleto steps may be created. */
  hasPayment?: boolean;
  amountToReceive?: number;
  paymentMethod?: string;
  isInvoiced?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  steps?: StepTemplate[];
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  steps?: StepTemplate[];
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
  id: number;
}

export type ServiceListSortBy = 'priority' | 'status' | 'created_at';
export type ServiceListSortOrder = 'asc' | 'desc';

export interface ServiceQueryParams {
  categoryId?: number;
  clientId?: number;
  clientCopyMachineId?: number;
  cityId?: number;
  acquisitionType?: AcquisitionType;
  /** Client name substring search (backend); when set, sort_by/sort_order are ignored */
  search?: string;
  sortBy?: ServiceListSortBy;
  sortOrder?: ServiceListSortOrder;
  page?: number;
  limit?: number;
}

export interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  thisWeek: number;
  thisMonth: number;
}

// Import User type from auth
import type { User } from './auth.types';

export interface Image extends BaseEntity {
  path: string;
  stepId?: number;
}
