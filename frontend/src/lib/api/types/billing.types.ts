import type { BaseEntity } from './common.types';
import type { Client } from './client.types';
import type { ClientCopyMachine } from './copy-machine.types';
import type { User } from './auth.types';
import type { Step } from './service.types';

export interface Billing extends BaseEntity {
  copyMachineId: number;
  clientId: number;
  date: string;
  previousCounter?: number;
  currentCounter?: number;
  paymentMethod?: string;
  amountToReceive: number;
  isInvoiced?: boolean;
  responsibleUserId: number;
  stepId?: number;
  copyMachine?: ClientCopyMachine;
  client?: Client;
  responsibleUser?: User;
  step?: Step;
}

export interface CreateBillingDto {
  copyMachineId: number;
  clientId: number;
  date: string;
  previousCounter?: number;
  currentCounter?: number;
  paymentMethod?: string;
  amountToReceive: number;
  responsibleUserId: number;
  stepId?: number;
  isInvoiced?: boolean;
}

export interface UpdateBillingDto extends Partial<CreateBillingDto> {}

export interface MachineUserMapping {
  copyMachineId: number;
  responsibleUserId: number;
  datetimeExpiration?: string;
  previousCounter?: number;
  paymentMethod?: string;
  isInvoiced?: boolean;
  boletoServiceResponsibleUserId?: number;
  boletoServiceExpirationDate?: string;
}

export interface GenerateBillingsDto {
  cityId: number;
  machines: MachineUserMapping[];
}

export interface BillingQueryParams {
  cityId?: number;
  clientId?: number;
  paymentMethod?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BillingResponse {
  data: Billing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenerateBillingsResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface BillingJobStatus {
  jobId: string;
  state: string;
  name?: string;
  createdAt?: number;
  attempts?: number;
  result?: {
    status: string;
    billingsCount?: number;
    servicesCount?: number;
    stepsCount?: number;
  };
  error?: string;
}


