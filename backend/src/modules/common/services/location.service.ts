import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../entities/country.entity';
import { State } from '../entities/state.entity';
import { City } from '../entities/city.entity';
import { Neighborhood } from '../entities/neighborhood.entity';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Neighborhood)
    private neighborhoodRepository: Repository<Neighborhood>,
  ) {}

  /**
   * Find or create a country
   */
  async findOrCreateCountry(name: string, code: string): Promise<Country> {
    let country = await this.countryRepository.findOne({ where: { code } });
    
    if (!country) {
      country = this.countryRepository.create({ name, code });
      country = await this.countryRepository.save(country);
      this.logger.log(`Created new country: ${code} - ${name}`);
    }
    
    return country;
  }

  /**
   * Find or create a state
   */
  async findOrCreateState(code: string, name: string, countryId: number): Promise<State> {
    let state = await this.stateRepository.findOne({ where: { code, country_id: countryId } });
    
    if (!state) {
      state = this.stateRepository.create({ code, name, country_id: countryId });
      state = await this.stateRepository.save(state);
      this.logger.log(`Created new state: ${code} - ${name}`);
    }
    
    return state;
  }

  /**
   * Find or create a city
   */
  async findOrCreateCity(name: string, stateId: number): Promise<City> {
    let city = await this.cityRepository.findOne({ 
      where: { name, state_id: stateId } 
    });
    
    if (!city) {
      city = this.cityRepository.create({ name, state_id: stateId });
      city = await this.cityRepository.save(city);
      this.logger.log(`Created new city: ${name}`);
    }
    
    return city;
  }

  /**
   * Find or create a neighborhood
   */
  async findOrCreateNeighborhood(name: string, cityId: number): Promise<Neighborhood> {
    let neighborhood = await this.neighborhoodRepository.findOne({ 
      where: { name, city_id: cityId } 
    });
    
    if (!neighborhood) {
      neighborhood = this.neighborhoodRepository.create({ name, city_id: cityId });
      neighborhood = await this.neighborhoodRepository.save(neighborhood);
      this.logger.log(`Created new neighborhood: ${name}`);
    }
    
    return neighborhood;
  }

  /**
   * Get all countries
   */
  async getAllCountries(): Promise<Country[]> {
    return this.countryRepository.find({ order: { name: 'ASC' } });
  }

  /**
   * Get all states
   */
  async getAllStates(): Promise<State[]> {
    return this.stateRepository.find({ order: { name: 'ASC' } });
  }

  /**
   * Get states by country
   */
  async getStatesByCountry(countryId: number): Promise<State[]> {
    return this.stateRepository.find({ 
      where: { country_id: countryId },
      order: { name: 'ASC' }
    });
  }

  /**
   * Get cities by state
   */
  async getCitiesByState(stateId: number): Promise<City[]> {
    return this.cityRepository.find({ 
      where: { state_id: stateId },
      order: { name: 'ASC' }
    });
  }

  /**
   * Get neighborhoods by city
   */
  async getNeighborhoodsByCity(cityId: number): Promise<Neighborhood[]> {
    return this.neighborhoodRepository.find({ 
      where: { city_id: cityId },
      order: { name: 'ASC' }
    });
  }

  /**
   * Process ViaCEP data and create/find location entities
   */
  async processViaCepLocation(
    stateCode: string,
    cityName: string,
    neighborhoodName: string
  ): Promise<{ neighborhoodId: number; neighborhood: Neighborhood }> {
    // State names mapping
    const stateNames: Record<string, string> = {
      'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
      'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
      'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
      'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
      'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
      'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
      'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
    };

    const stateName = stateNames[stateCode] || stateCode;

    // Create or find country (Brasil)
    const country = await this.findOrCreateCountry('Brasil', 'BR');

    // Create or find state
    const state = await this.findOrCreateState(stateCode, stateName, country.id);

    // Create or find city
    const city = await this.findOrCreateCity(cityName, state.id);

    // Create or find neighborhood
    const neighborhood = await this.findOrCreateNeighborhood(neighborhoodName, city.id);

    return { neighborhoodId: neighborhood.id, neighborhood };
  }
}

