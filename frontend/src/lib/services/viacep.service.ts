import axios from 'axios';

export interface ViaCepResponse {
  cep: string;
  logradouro: string; // street
  complemento: string;
  bairro: string; // neighborhood
  localidade: string; // city
  uf: string; // state
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export class ViaCepService {
  private static readonly baseUrl = 'https://viacep.com.br/ws';

  /**
   * Fetch address information directly from ViaCEP API
   * @param cep - Brazilian postal code (with or without hyphen)
   * @returns Address data or null if not found
   */
  static async getAddressByCep(cep: string): Promise<ViaCepResponse | null> {
    try {
      // Remove any non-numeric characters
      const cleanCep = cep.replace(/\D/g, '');

      // Validate CEP format (must have 8 digits)
      if (cleanCep.length !== 8) {
        console.warn(`Invalid CEP format: ${cep}`);
        return null;
      }

      const url = `${this.baseUrl}/${cleanCep}/json/`;
      console.log(`Fetching address for CEP: ${cleanCep}`);

      const response = await axios.get<ViaCepResponse>(url, {
        timeout: 5000,
      });

      // ViaCEP returns {erro: true} for invalid CEPs
      if (response.data.erro) {
        console.warn(`CEP not found: ${cleanCep}`);
        return null;
      }

      return response.data;
    } catch (error: any) {
      console.error(`Error fetching CEP ${cep}:`, error.message);
      return null;
    }
  }

  /**
   * Format ViaCEP response for display
   */
  static formatAddress(viaCepData: ViaCepResponse) {
    return {
      postal_code: viaCepData.cep,
      street: viaCepData.logradouro || '',
      neighborhood: viaCepData.bairro || '',
      city: viaCepData.localidade || '',
      state: viaCepData.uf || '',
    };
  }
}

