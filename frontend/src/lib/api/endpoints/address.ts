import { axios } from '../client.js';
import type { Country, State, City, Neighborhood } from '../types/address.types';

export interface ProcessLocationResponse {
  neighborhood_id: number;
  neighborhood: Neighborhood;
}

export const addressApi = {
  // Process location data and get neighborhood ID
  processLocation: (data: { 
    state_code: string; 
    city_name: string; 
    neighborhood_name: string 
  }): Promise<ProcessLocationResponse> =>
    axios.post('/address/process-location', data).then(res => res.data),
  
  getCountries: (): Promise<Country[]> =>
    axios.get('/address/countries').then(res => res.data),
  
  getStates: (): Promise<State[]> =>
    axios.get('/address/states').then(res => res.data),
  
  getStatesByCountry: (countryId: number): Promise<State[]> =>
    axios.get(`/address/countries/${countryId}/states`).then(res => res.data),
  
  getCitiesByState: (stateId: number): Promise<City[]> =>
    axios.get(`/address/states/${stateId}/cities`).then(res => res.data),
  
  getNeighborhoodsByCity: (cityId: number): Promise<Neighborhood[]> =>
    axios.get(`/address/cities/${cityId}/neighborhoods`).then(res => res.data),
};

