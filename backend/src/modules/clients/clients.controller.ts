import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully', type: Client })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients or paginated list with search' })
  @ApiQuery({ name: 'search', required: false, description: 'Partial match by client name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of clients', type: [Client] })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Client[] | { data: Client[]; total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean }> {
    if (search !== undefined || page !== undefined || limit !== undefined) {
      return this.clientsService.findAllPaginated({
        search: search || undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
    }
    return this.clientsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client statistics' })
  @ApiResponse({ status: 200, description: 'Client statistics returned successfully' })
  async getStats() {
    return this.clientsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client found', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle client active status' })
  @ApiResponse({ status: 200, description: 'Client active status toggled successfully', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<Client> {
    return this.clientsService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.clientsService.remove(id);
  }
}
