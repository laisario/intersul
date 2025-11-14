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
  client_id: number;
  category_id: number;
  client_copy_machine_id?: number;
  client?: Client;
  category?: Category;
  clientCopyMachine?: ClientCopyMachine;
  steps?: Step[];
  created_at?: string;
  updated_at?: string;
  status?: string;
  priority?: string;
  reason_cancellament?: string;
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
  responsable_client?: string;
  reason_cancellament?: string;
  status?: string;
  datetime_start?: string;
  datetime_conclusion?: string;
  datetime_expiration?: string;
  category_id?: number;
  service_id?: number;
  responsable_id?: number;
  responsable?: User;
  service?: Service;
  category?: Category;
  images?: Image[];
}

export interface StepTemplate {
  name: string;
  description: string;
  observation?: string;
  responsable_client?: string;
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
  responsable_id?: number;
  responsable_client?: string;
  datetime_start?: string;
  datetime_conclusion?: string;
  datetime_expiration?: string;
}

export interface CreateServiceDto {
  client_id?: number;
  category_id?: number;
  client_copy_machine_id?: number;
  description?: string;
  priority?: string;
  steps?: CreateServiceStepDto[];
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

export interface ServiceQueryParams {
  category_id?: number;
  client_id?: number;
  client_copy_machine_id?: number;
  city_id?: number;
  acquisition_type?: AcquisitionType;
  search?: string;
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
  step_id?: number;
}
