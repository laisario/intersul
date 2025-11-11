import type { BaseEntity } from './common.types';

export interface Country extends BaseEntity {
  name: string;
  code: string;
}

export interface State extends BaseEntity {
  code: string;
  name: string;
  country_id: number;
  country?: Country;
}

export interface City extends BaseEntity {
  name: string;
  state_id: number;
  state?: State;
}

export interface Neighborhood extends BaseEntity {
  name: string;
  city_id: number;
  city?: City;
}

export interface Address extends BaseEntity {
  postal_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood_id: number;
  neighborhood?: Neighborhood;
}

export interface CreateAddressDto {
  postal_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood_id: number;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

export interface ViaCepData {
  postal_code: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
