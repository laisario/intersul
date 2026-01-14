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
  isInvoiced?: boolean;
  responsibleUserId: number;
  stepId?: number;
}

export interface UpdateBillingDto extends Partial<CreateBillingDto> {}

export interface MachineUserMapping {
  copyMachineId: number;
  responsibleUserId: number;
}

export interface GenerateBillingsDto {
  cityId: number;
  machines: MachineUserMapping[];
}

export interface BillingQueryParams {
  cityId?: number;
  clientId?: number;
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
  billings: Billing[];
  services: any[];
  steps: Step[];
}


