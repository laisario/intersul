
import type { BaseEntity } from './common.types';
import type { Address, CreateAddressDto } from './address.types';

export interface Client extends BaseEntity {
  name: string;
  cnpj?: string;
  cpf?: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface CreateClientDto {
  name: string;
  cnpj?: string;
  cpf?: string;
  email: string;
  phone?: string;
  address?: CreateAddressDto;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ClientQueryParams {
  search?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface ClientStats {
  total: number;
  newThisMonth: number;
  servicesThisMonth: number;
}
