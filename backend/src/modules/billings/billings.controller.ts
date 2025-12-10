import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingsService } from './billings.service';
import { Billing } from './entities/billing.entity';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { GenerateBillingsDto } from './dto/generate-billings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Billings')
@Controller('billings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all billings with optional filters' })
  @ApiResponse({ status: 200, description: 'List of billings', type: [Billing] })
  @ApiQuery({ name: 'city_id', required: false, description: 'Filter by city ID' })
  @ApiQuery({ name: 'client_id', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records per page' })
  async findAll(
    @Query('city_id') city_id?: string,
    @Query('client_id') client_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Billing[]; total: number; page: number; limit: number; totalPages: number }> {
    const filters: any = {};
    if (city_id) filters.city_id = Number(city_id);
    if (client_id) filters.client_id = Number(client_id);
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    return this.billingsService.findAll(filters);
  }

  @Post('generate-by-city')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate billings by city' })
  @ApiResponse({ status: 201, description: 'Billings generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async generateByCity(@Body() generateDto: GenerateBillingsDto) {
    return this.billingsService.generateByCity(generateDto);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new billing' })
  @ApiResponse({ status: 201, description: 'Billing created successfully', type: Billing })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createBillingDto: CreateBillingDto): Promise<Billing> {
    return this.billingsService.create(createBillingDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get billing by ID' })
  @ApiResponse({ status: 200, description: 'Billing found', type: Billing })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Billing> {
    return this.billingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update billing' })
  @ApiResponse({ status: 200, description: 'Billing updated successfully', type: Billing })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - You are not authorized to update this billing' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBillingDto: UpdateBillingDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Billing> {
    return this.billingsService.update(id, updateBillingDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete billing' })
  @ApiResponse({ status: 200, description: 'Billing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.billingsService.remove(id);
  }
}

