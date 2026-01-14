
import type { BaseEntity } from './common.types';
import type { Address, CreateAddressDto } from './address.types';

export type HowMetCompany = 'SOCIAL_MEDIA' | 'REFERRAL' | 'GOOGLE_SEARCH' | 'WALK_IN' | 'OTHER';

export interface Client extends BaseEntity {
  name: string;
  cnpj?: string;
  cpf?: string;
  email: string;
  phone?: string;
  active: boolean;
  address?: Address;
  howMetCompany?: HowMetCompany;
}

export interface CreateClientDto {
  name: string;
  cnpj?: string;
  cpf?: string;
  email: string;
  phone?: string;
  address?: CreateAddressDto;
  howMetCompany?: HowMetCompany;
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
