import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CopyMachineCatalog } from './entities/copy-machine-catalog.entity';
import { ClientCopyMachine } from './entities/client-copy-machine.entity';
import { Franchise } from './entities/franchise.entity';
import { CreateCopyMachineCatalogDto } from './dto/create-copy-machine-catalog.dto';
import { UpdateCopyMachineCatalogDto } from './dto/update-copy-machine-catalog.dto';
import { CreateClientCopyMachineDto } from './dto/create-client-copy-machine.dto';
import { UpdateClientCopyMachineDto } from './dto/update-client-copy-machine.dto';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { AcquisitionType } from '../../common/enums/acquisition-type.enum';

@Injectable()
export class CopyMachinesService {
  constructor(
    @InjectRepository(CopyMachineCatalog)
    private copyMachineCatalogRepository: Repository<CopyMachineCatalog>,
    @InjectRepository(ClientCopyMachine)
    private clientCopyMachineRepository: Repository<ClientCopyMachine>,
    @InjectRepository(Franchise)
    private franchiseRepository: Repository<Franchise>,
    private dataSource: DataSource,
  ) {}

  // Catalog Copy Machine methods

  async createCatalog(createCopyMachineCatalogDto: CreateCopyMachineCatalogDto): Promise<CopyMachineCatalog> {
    const copyMachine = this.copyMachineCatalogRepository.create(createCopyMachineCatalogDto);
    return this.copyMachineCatalogRepository.save(copyMachine);
  }

  async findAllCatalog(
    search?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ data: CopyMachineCatalog[]; total: number; page: number; limit: number; totalPages: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    let queryBuilder = this.copyMachineCatalogRepository
      .createQueryBuilder('catalog')
      .where('catalog.isDisabled = :isDisabled', { isDisabled: false })
      .orderBy('catalog.created_at', 'DESC');
    
    const q = search?.trim();
    if (q) {
      // Case-insensitive partial match on model/manufacturer (and description as fallback).
      // Uses LOWER(...) so it works on MySQL as well.
      queryBuilder = queryBuilder.andWhere(
        '(LOWER(catalog.model) LIKE :search OR LOWER(catalog.manufacturer) LIKE :search OR LOWER(catalog.description) LIKE :search)',
        { search: `%${q.toLowerCase()}%` },
      );
    }
    
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    };
  }

  async findOneCatalog(id: number): Promise<CopyMachineCatalog> {
    const copyMachine = await this.copyMachineCatalogRepository.findOne({
      where: { id, isDisabled: false },
      relations: ['clientCopyMachines'],
    });

    if (!copyMachine) {
      throw new NotFoundException(`Catalog copy machine with ID ${id} not found`);
    }

    return copyMachine;
  }

  async updateCatalog(id: number, updateCopyMachineCatalogDto: UpdateCopyMachineCatalogDto): Promise<CopyMachineCatalog> {
    const copyMachine = await this.findOneCatalog(id);
    Object.assign(copyMachine, updateCopyMachineCatalogDto);
    return this.copyMachineCatalogRepository.save(copyMachine);
  }

  async removeCatalog(id: number): Promise<void> {
    const copyMachine = await this.copyMachineCatalogRepository.findOne({
      where: { id },
    });

    if (!copyMachine) {
      throw new NotFoundException(`Catalog copy machine with ID ${id} not found`);
    }

    copyMachine.isDisabled = true;
    await this.copyMachineCatalogRepository.save(copyMachine);
  }

  // Client Copy Machine methods
  async createClientCopyMachine(createClientCopyMachineDto: CreateClientCopyMachineDto): Promise<ClientCopyMachine> {
    // Use a transaction to ensure atomicity of stock update and machine creation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate that catalog machine is not disabled if provided
      let catalogMachine: CopyMachineCatalog | null = null;
      if (createClientCopyMachineDto.catalog_copy_machine_id) {
        catalogMachine = await queryRunner.manager.findOne(CopyMachineCatalog, {
          where: { id: createClientCopyMachineDto.catalog_copy_machine_id },
          lock: { mode: 'pessimistic_write' }, // Lock row for update to prevent race conditions
        });
        if (!catalogMachine) {
          throw new NotFoundException(`Catalog copy machine with ID ${createClientCopyMachineDto.catalog_copy_machine_id} not found`);
        }
        if (catalogMachine.isDisabled) {
          throw new NotFoundException(`Cannot link to a disabled catalog machine. The machine has been deactivated.`);
        }
      }

      // Validate that franchise is not disabled if provided
      if (createClientCopyMachineDto.franchise_id) {
        const franchise = await queryRunner.manager.findOne(Franchise, {
          where: { id: createClientCopyMachineDto.franchise_id },
        });
        if (!franchise) {
          throw new NotFoundException(`Franchise with ID ${createClientCopyMachineDto.franchise_id} not found`);
        }
        if (franchise.isDisabled) {
          throw new NotFoundException(`Cannot link to a disabled franchise. The franchise has been deactivated.`);
        }
      }

      // Create client machine
      const clientCopyMachine = queryRunner.manager.create(ClientCopyMachine, createClientCopyMachineDto);
      const savedClientCopyMachine = await queryRunner.manager.save(ClientCopyMachine, clientCopyMachine);

      // Decrement quantity if acquisition type is RENT or SOLD (ALUGADA or VENDIDA)
      if (
        catalogMachine &&
        (createClientCopyMachineDto.acquisition_type === AcquisitionType.RENT ||
          createClientCopyMachineDto.acquisition_type === AcquisitionType.SOLD)
      ) {
        // Use atomic SQL update to decrement quantity (allows negative values)
        await queryRunner.manager
          .createQueryBuilder()
          .update(CopyMachineCatalog)
          .set({
            quantity: () => 'COALESCE(quantity, 0) - 1',
          })
          .where('id = :id', { id: catalogMachine.id })
          .execute();
      }

      await queryRunner.commitTransaction();

      // Reload the client machine with relations
      return this.findOneClientCopyMachine(savedClientCopyMachine.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOneClientCopyMachine(id: number): Promise<ClientCopyMachine> {
    const clientCopyMachine = await this.clientCopyMachineRepository.findOne({
      where: { id },
      relations: ['client', 'catalogCopyMachine', 'services', 'franchise'],
    });

    if (!clientCopyMachine) {
      throw new NotFoundException(`Client copy machine with ID ${id} not found`);
    }

    return clientCopyMachine;
  }

  async updateClientCopyMachine(id: number, updateClientCopyMachineDto: UpdateClientCopyMachineDto): Promise<ClientCopyMachine> {
    const clientCopyMachine = await this.findOneClientCopyMachine(id);

    // Validate catalog / franchise when provided (null clears the link)
    if (updateClientCopyMachineDto.catalog_copy_machine_id !== undefined) {
      if (updateClientCopyMachineDto.catalog_copy_machine_id !== null) {
        const catalogMachine = await this.copyMachineCatalogRepository.findOne({
          where: { id: updateClientCopyMachineDto.catalog_copy_machine_id },
        });
        if (!catalogMachine) {
          throw new NotFoundException(
            `Catalog copy machine with ID ${updateClientCopyMachineDto.catalog_copy_machine_id} not found`,
          );
        }
        if (catalogMachine.isDisabled) {
          throw new NotFoundException(
            `Cannot link to a disabled catalog machine. The machine has been deactivated.`,
          );
        }
      }
    }

    if (updateClientCopyMachineDto.franchise_id !== undefined) {
      if (updateClientCopyMachineDto.franchise_id !== null) {
        const franchise = await this.franchiseRepository.findOne({
          where: { id: updateClientCopyMachineDto.franchise_id },
        });
        if (!franchise) {
          throw new NotFoundException(`Franchise with ID ${updateClientCopyMachineDto.franchise_id} not found`);
        }
        if (franchise.isDisabled) {
          throw new NotFoundException(
            `Cannot link to a disabled franchise. The franchise has been deactivated.`,
          );
        }
      }
    }

    // Stale ManyToOne relations would keep old franchise.id / catalogCopyMachine.id in memory while
    // Object.assign only updates franchise_id / catalog_copy_machine_id, producing inconsistent JSON.
    if (updateClientCopyMachineDto.catalog_copy_machine_id !== undefined) {
      clientCopyMachine.catalogCopyMachine = undefined;
    }
    if (updateClientCopyMachineDto.franchise_id !== undefined) {
      clientCopyMachine.franchise = undefined;
    }

    Object.assign(clientCopyMachine, updateClientCopyMachineDto);
    await this.clientCopyMachineRepository.save(clientCopyMachine);

    return this.findOneClientCopyMachine(id);
  }

  async removeClientCopyMachine(id: number): Promise<void> {
    const clientCopyMachine = await this.findOneClientCopyMachine(id);
    await this.clientCopyMachineRepository.remove(clientCopyMachine);
  }

  async findByClient(clientId: number): Promise<ClientCopyMachine[]> {
    return this.clientCopyMachineRepository.find({
      where: { client_id: clientId },
      relations: ['catalogCopyMachine', 'services', 'franchise'],
      order: { created_at: 'DESC' },
    });
  }

  async findRentMachines(
    filters?: { clientId?: number; page?: number; limit?: number }
  ): Promise<{ data: ClientCopyMachine[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    const query = this.clientCopyMachineRepository
      .createQueryBuilder('machine')
      .leftJoinAndSelect('machine.client', 'client')
      .leftJoinAndSelect('machine.catalogCopyMachine', 'catalogCopyMachine')
      .leftJoinAndSelect('machine.franchise', 'franchise')
      .where('machine.acquisition_type = :acquisitionType', { acquisitionType: AcquisitionType.RENT })
      .orderBy('machine.created_at', 'DESC');

    if (filters?.clientId) {
      query.andWhere('machine.client_id = :clientId', { clientId: filters.clientId });
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return { data, total, page, limit, totalPages };
  }

  async findSoldMachines(
    filters?: { clientId?: number; page?: number; limit?: number }
  ): Promise<{ data: ClientCopyMachine[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    const query = this.clientCopyMachineRepository
      .createQueryBuilder('machine')
      .leftJoinAndSelect('machine.client', 'client')
      .leftJoinAndSelect('machine.catalogCopyMachine', 'catalogCopyMachine')
      .where('machine.acquisition_type = :acquisitionType', { acquisitionType: AcquisitionType.SOLD })
      .orderBy('machine.created_at', 'DESC');

    if (filters?.clientId) {
      query.andWhere('machine.client_id = :clientId', { clientId: filters.clientId });
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return { data, total, page, limit, totalPages };
  }

  async findExternalMachines(
    filters?: { clientId?: number; page?: number; limit?: number }
  ): Promise<{ data: ClientCopyMachine[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    const query = this.clientCopyMachineRepository
      .createQueryBuilder('machine')
      .leftJoinAndSelect('machine.client', 'client')
      .where('machine.catalog_copy_machine_id IS NULL')
      .orderBy('machine.created_at', 'DESC');

    if (filters?.clientId) {
      query.andWhere('machine.client_id = :clientId', { clientId: filters.clientId });
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return { data, total, page, limit, totalPages };
  }

  // Franchise methods
  async createFranchise(createFranchiseDto: CreateFranchiseDto): Promise<Franchise> {
    const franchise = this.franchiseRepository.create(createFranchiseDto);
    return this.franchiseRepository.save(franchise);
  }

  async findAllFranchises(filters?: {
    period?: string;
    color?: boolean;
    paper_type?: string;
  }): Promise<Franchise[]> {
    const queryBuilder = this.franchiseRepository
      .createQueryBuilder('franchise')
      .where('franchise.isDisabled = :isDisabled', { isDisabled: false })
      .leftJoinAndSelect('franchise.clientCopyMachines', 'clientCopyMachines');

    if (filters?.period) {
      queryBuilder.andWhere('franchise.period LIKE :period', { period: `%${filters.period}%` });
    }

    if (filters?.color !== undefined) {
      queryBuilder.andWhere('franchise.color = :color', { color: filters.color });
    }

    if (filters?.paper_type) {
      queryBuilder.andWhere('franchise.paper_type LIKE :paper_type', { paper_type: `%${filters.paper_type}%` });
    }

    return queryBuilder.orderBy('franchise.created_at', 'DESC').getMany();
  }

  async findOneFranchise(id: number): Promise<Franchise> {
    const franchise = await this.franchiseRepository.findOne({
      where: { id, isDisabled: false },
      relations: ['clientCopyMachines', 'clientCopyMachines.client'],
    });
    if (!franchise) {
      throw new NotFoundException(`Franchise with ID ${id} not found`);
    }
    return franchise;
  }

  async updateFranchise(id: number, updateFranchiseDto: UpdateFranchiseDto): Promise<Franchise> {
    const franchise = await this.findOneFranchise(id);
    Object.assign(franchise, updateFranchiseDto);
    return this.franchiseRepository.save(franchise);
  }

  async removeFranchise(id: number): Promise<void> {
    const franchise = await this.franchiseRepository.findOne({
      where: { id },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise with ID ${id} not found`);
    }

    franchise.isDisabled = true;
    await this.franchiseRepository.save(franchise);
  }
}
