import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LocationService } from '../services/location.service';

@ApiTags('address')
@Controller('address')
export class AddressController {
  constructor(
    private readonly locationService: LocationService,
  ) {}

  @Post('process-location')
  @ApiOperation({ summary: 'Process location data and return neighborhood ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        state_code: { type: 'string', example: 'SP' },
        city_name: { type: 'string', example: 'São Paulo' },
        neighborhood_name: { type: 'string', example: 'Centro' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Location processed successfully',
  })
  async processLocation(
    @Body() body: { state_code: string; city_name: string; neighborhood_name: string }
  ) {
    const { neighborhood } = await this.locationService.processViaCepLocation(
      body.state_code,
      body.city_name,
      body.neighborhood_name,
    );

    return {
      neighborhood_id: neighborhood.id,
      neighborhood: neighborhood,
    };
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'Countries retrieved successfully' })
  async getAllCountries() {
    return this.locationService.getAllCountries();
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully' })
  async getAllStates() {
    return this.locationService.getAllStates();
  }

  @Get('countries/:countryId/states')
  @ApiOperation({ summary: 'Get states by country' })
  @ApiParam({ name: 'countryId', description: 'Country ID' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully' })
  async getStatesByCountry(@Param('countryId') countryId: number) {
    return this.locationService.getStatesByCountry(+countryId);
  }

  @Get('states/:stateId/cities')
  @ApiOperation({ summary: 'Get cities by state' })
  @ApiParam({ name: 'stateId', description: 'State ID' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  async getCitiesByState(@Param('stateId') stateId: number) {
    return this.locationService.getCitiesByState(+stateId);
  }

  @Get('cities/:cityId/neighborhoods')
  @ApiOperation({ summary: 'Get neighborhoods by city' })
  @ApiParam({ name: 'cityId', description: 'City ID' })
  @ApiResponse({ status: 200, description: 'Neighborhoods retrieved successfully' })
  async getNeighborhoodsByCity(@Param('cityId') cityId: number) {
    return this.locationService.getNeighborhoodsByCity(+cityId);
  }
}

