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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CopyMachinesService } from './copy-machines.service';
import { CreateCopyMachineCatalogDto } from './dto/create-copy-machine-catalog.dto';
import { UpdateCopyMachineCatalogDto } from './dto/update-copy-machine-catalog.dto';
import { CreateClientCopyMachineDto } from './dto/create-client-copy-machine.dto';
import { UpdateClientCopyMachineDto } from './dto/update-client-copy-machine.dto';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { CopyMachineCatalog } from './entities/copy-machine-catalog.entity';
import { ClientCopyMachine } from './entities/client-copy-machine.entity';
import { Franchise } from './entities/franchise.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../common/services/storage.service';

@ApiTags('Máquinas Copiadoras')
@Controller('copy-machines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CopyMachinesController {
  constructor(
    private readonly copyMachinesService: CopyMachinesService,
    private readonly storageService: StorageService,
  ) {}

  private slugify(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  private resolveExtension(file: Express.Multer.File): string {
    const fromName = path.extname(file.originalname || '');
    if (fromName) return fromName;
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[file.mimetype] || '.jpg';
  }

  @Post('catalog')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Criar uma nova máquina copiadora do catálogo' })
  @ApiResponse({
    status: 201,
    description: 'Máquina copiadora do catálogo criada com sucesso',
    type: CopyMachineCatalog,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  async createCatalog(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() createCopyMachineCatalogDto: CreateCopyMachineCatalogDto,
  ): Promise<CopyMachineCatalog> {
    if (file) {
      const fileExtension = this.resolveExtension(file);
      const manufacturer = this.slugify(
        createCopyMachineCatalogDto.manufacturer || '',
      );
      const model = this.slugify(createCopyMachineCatalogDto.model || '');
      const base = [manufacturer, model].filter(Boolean).join('-') || 'machine';
      const fileName = `${base}-${Date.now()}${fileExtension}`;

      // Upload file to R2 storage
      const imageUrl = await this.storageService.uploadFile(
        file.buffer,
        fileName,
        'copy-machines',
        file.mimetype,
      );

      createCopyMachineCatalogDto.file = imageUrl;
    }
    return this.copyMachinesService.createCatalog(createCopyMachineCatalogDto);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Obter todas as máquinas copiadoras do catálogo' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de máquinas copiadoras do catálogo',
  })
  async findAllCatalog(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: CopyMachineCatalog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.copyMachinesService.findAllCatalog(search, pageNum, limitNum);
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Obter máquina copiadora do catálogo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do catálogo encontrada',
    type: CopyMachineCatalog,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do catálogo não encontrada',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CopyMachineCatalog> {
    return this.copyMachinesService.findOneCatalog(id);
  }

  @Patch('catalog/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Atualizar máquina copiadora do catálogo' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do catálogo atualizada com sucesso',
    type: CopyMachineCatalog,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do catálogo não encontrada',
  })
  async updateCatalog(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() updateCopyMachineCatalogDto: UpdateCopyMachineCatalogDto,
  ): Promise<CopyMachineCatalog> {
    if (file) {
      const fileExtension = this.resolveExtension(file);
      const manufacturer = this.slugify(
        updateCopyMachineCatalogDto.manufacturer || '',
      );
      const model = this.slugify(updateCopyMachineCatalogDto.model || '');
      const base = [manufacturer, model].filter(Boolean).join('-') || 'machine';
      const fileName = `${base}-${Date.now()}${fileExtension}`;

      // Upload file to R2 storage
      const imageUrl = await this.storageService.uploadFile(
        file.buffer,
        fileName,
        'copy-machines',
        file.mimetype,
      );

      updateCopyMachineCatalogDto.file = imageUrl;
    }
    return this.copyMachinesService.updateCatalog(
      id,
      updateCopyMachineCatalogDto,
    );
  }

  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Excluir máquina copiadora do catálogo' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do catálogo excluída com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do catálogo não encontrada',
  })
  async removeCatalog(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.copyMachinesService.removeCatalog(id);
  }

  @Get('rent')
  @ApiOperation({ summary: 'Obter máquinas alugadas (RENT)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de máquinas alugadas',
  })
  async findRentMachines(
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: ClientCopyMachine[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: { clientId?: number; page?: number; limit?: number } = {};
    if (clientId) filters.clientId = parseInt(clientId, 10);
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    return this.copyMachinesService.findRentMachines(filters);
  }

  @Get('sold')
  @ApiOperation({ summary: 'Obter máquinas vendidas (SOLD)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de máquinas vendidas',
  })
  async findSoldMachines(
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: ClientCopyMachine[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: { clientId?: number; page?: number; limit?: number } = {};
    if (clientId) filters.clientId = parseInt(clientId, 10);
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    return this.copyMachinesService.findSoldMachines(filters);
  }

  @Get('external')
  @ApiOperation({ summary: 'Obter máquinas externas (sem catálogo)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de máquinas externas',
  })
  async findExternalMachines(
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: ClientCopyMachine[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: { clientId?: number; page?: number; limit?: number } = {};
    if (clientId) filters.clientId = parseInt(clientId, 10);
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    return this.copyMachinesService.findExternalMachines(filters);
  }

  // Client Copy Machine endpoints
  @Post('client')
  @ApiOperation({ summary: 'Criar uma nova máquina copiadora do cliente' })
  @ApiResponse({
    status: 201,
    description: 'Máquina copiadora do cliente criada com sucesso',
    type: ClientCopyMachine,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  async createClientCopyMachine(
    @Body() createClientCopyMachineDto: CreateClientCopyMachineDto,
  ): Promise<ClientCopyMachine> {
    return this.copyMachinesService.createClientCopyMachine(
      createClientCopyMachineDto,
    );
  }

  @Patch('client/:id')
  @ApiOperation({ summary: 'Atualizar máquina copiadora do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do cliente atualizada com sucesso',
    type: ClientCopyMachine,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do cliente não encontrada',
  })
  async updateClientCopyMachine(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientCopyMachineDto: UpdateClientCopyMachineDto,
  ): Promise<ClientCopyMachine> {
    return this.copyMachinesService.updateClientCopyMachine(
      id,
      updateClientCopyMachineDto,
    );
  }

  @Get('client/by-client/:clientId')
  @ApiOperation({
    summary: 'Obter todas as máquinas copiadoras de um cliente específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de máquinas copiadoras do cliente',
    type: [ClientCopyMachine],
  })
  async findByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
  ): Promise<ClientCopyMachine[]> {
    return this.copyMachinesService.findByClient(clientId);
  }

  @Get('client/:id')
  @ApiOperation({ summary: 'Obter máquina copiadora do cliente por ID' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do cliente encontrada',
    type: ClientCopyMachine,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do cliente não encontrada',
  })
  async findOneClientCopyMachine(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClientCopyMachine> {
    return this.copyMachinesService.findOneClientCopyMachine(id);
  }

  @Delete('client/:id')
  @ApiOperation({ summary: 'Excluir máquina copiadora do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Máquina copiadora do cliente excluída com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina copiadora do cliente não encontrada',
  })
  async removeClientCopyMachine(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.copyMachinesService.removeClientCopyMachine(id);
  }

  // Franchise endpoints
  @Post('franchise')
  @ApiOperation({ summary: 'Criar um novo plano de franquia' })
  @ApiResponse({
    status: 201,
    description: 'Plano de franquia criado com sucesso',
    type: Franchise,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  async createFranchise(
    @Body() createFranchiseDto: CreateFranchiseDto,
  ): Promise<Franchise> {
    return this.copyMachinesService.createFranchise(createFranchiseDto);
  }

  @Get('franchise')
  @ApiOperation({ summary: 'Obter todos os planos de franquia' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos os planos de franquia',
    type: [Franchise],
  })
  async findAllFranchises(
    @Query('period') period?: string,
    @Query('color') color?: string,
    @Query('paper_type') paper_type?: string,
  ): Promise<Franchise[]> {
    return this.copyMachinesService.findAllFranchises({
      period,
      color: color === 'true' ? true : color === 'false' ? false : undefined,
      paper_type,
    });
  }

  @Get('franchise/:id')
  @ApiOperation({ summary: 'Obter plano de franquia por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plano de franquia encontrado',
    type: Franchise,
  })
  @ApiResponse({ status: 404, description: 'Plano de franquia não encontrado' })
  async findOneFranchise(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Franchise> {
    return this.copyMachinesService.findOneFranchise(id);
  }

  @Patch('franchise/:id')
  @ApiOperation({ summary: 'Atualizar plano de franquia' })
  @ApiResponse({
    status: 200,
    description: 'Plano de franquia atualizado com sucesso',
    type: Franchise,
  })
  @ApiResponse({ status: 404, description: 'Plano de franquia não encontrado' })
  async updateFranchise(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFranchiseDto: UpdateFranchiseDto,
  ): Promise<Franchise> {
    return this.copyMachinesService.updateFranchise(id, updateFranchiseDto);
  }

  @Delete('franchise/:id')
  @ApiOperation({ summary: 'Excluir plano de franquia' })
  @ApiResponse({
    status: 200,
    description: 'Plano de franquia excluído com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Plano de franquia não encontrado' })
  async removeFranchise(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.copyMachinesService.removeFranchise(id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload de imagem para máquina' })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  async uploadImage(@UploadedFile() file: any): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

    // Upload file to R2 storage
    const imageUrl = await this.storageService.uploadFile(
      file.buffer,
      fileName,
      'copy-machines',
      file.mimetype,
    );

    return { imageUrl };
  }
}
