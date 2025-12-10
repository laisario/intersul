import type { BaseEntity } from './common.types';
import type { Client } from './client.types';
import type { ClientCopyMachine } from './copy-machine.types';
import type { User } from './auth.types';
import type { Step } from './service.types';

export interface Billing extends BaseEntity {
  copy_machine_id: number;
  client_id: number;
  date: string;
  previous_counter?: number;
  current_counter?: number;
  payment_method?: string;
  amount_to_receive: number;
  is_invoiced?: boolean;
  responsible_user_id: number;
  step_id?: number;
  copyMachine?: ClientCopyMachine;
  client?: Client;
  responsibleUser?: User;
  step?: Step;
}

export interface CreateBillingDto {
  copy_machine_id: number;
  client_id: number;
  date: string;
  previous_counter?: number;
  current_counter?: number;
  payment_method?: string;
  amount_to_receive: number;
  responsible_user_id: number;
  step_id?: number;
  is_invoiced?: boolean;
}

export interface UpdateBillingDto extends Partial<CreateBillingDto> {}

export interface MachineUserMapping {
  copy_machine_id: number;
  responsible_user_id: number;
  datetime_expiration?: string;
  payment_method?: string;
  is_invoiced?: boolean;
  boleto_service_responsible_user_id?: number;
  boleto_service_expiration_date?: string;
}

export interface GenerateBillingsDto {
  city_id: number;
  machines: MachineUserMapping[];
}

export interface BillingQueryParams {
  city_id?: number;
  client_id?: number;
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


