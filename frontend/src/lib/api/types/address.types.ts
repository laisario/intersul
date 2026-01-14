import type { BaseEntity } from './common.types';

export interface Country extends BaseEntity {
  name: string;
  code: string;
}

export interface State extends BaseEntity {
  code: string;
  name: string;
  countryId: number;
  country?: Country;
}

export interface City extends BaseEntity {
  name: string;
  stateId: number;
  state?: State;
}

export interface Neighborhood extends BaseEntity {
  name: string;
  cityId: number;
  city?: City;
}

export interface Address extends BaseEntity {
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhoodId: number;
  neighborhood?: Neighborhood;
}

export interface CreateAddressDto {
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhoodId: number;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

export interface ViaCepData {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
