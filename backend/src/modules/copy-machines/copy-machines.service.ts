import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(catalog.model LIKE :search OR catalog.manufacturer LIKE :search OR catalog.description LIKE :search)', 
        { search: `%${search}%` }
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
    // Validate that catalog machine is not disabled if provided
    if (createClientCopyMachineDto.catalog_copy_machine_id) {
      const catalogMachine = await this.copyMachineCatalogRepository.findOne({
        where: { id: createClientCopyMachineDto.catalog_copy_machine_id },
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
      const franchise = await this.franchiseRepository.findOne({
        where: { id: createClientCopyMachineDto.franchise_id },
      });
      if (!franchise) {
        throw new NotFoundException(`Franchise with ID ${createClientCopyMachineDto.franchise_id} not found`);
      }
      if (franchise.isDisabled) {
        throw new NotFoundException(`Cannot link to a disabled franchise. The franchise has been deactivated.`);
      }
    }

    const clientCopyMachine = this.clientCopyMachineRepository.create(createClientCopyMachineDto);
    return this.clientCopyMachineRepository.save(clientCopyMachine);
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

    // Validate that catalog machine is not disabled if being updated
    if (updateClientCopyMachineDto.catalog_copy_machine_id !== undefined) {
      const catalogMachine = await this.copyMachineCatalogRepository.findOne({
        where: { id: updateClientCopyMachineDto.catalog_copy_machine_id },
      });
      if (catalogMachine && catalogMachine.isDisabled) {
        throw new NotFoundException(`Cannot link to a disabled catalog machine. The machine has been deactivated.`);
      }
    }

    // Validate that franchise is not disabled if being updated
    if (updateClientCopyMachineDto.franchise_id !== undefined) {
      const franchise = await this.franchiseRepository.findOne({
        where: { id: updateClientCopyMachineDto.franchise_id },
      });
      if (franchise && franchise.isDisabled) {
        throw new NotFoundException(`Cannot link to a disabled franchise. The franchise has been deactivated.`);
      }
    }

    Object.assign(clientCopyMachine, updateClientCopyMachineDto);
    return this.clientCopyMachineRepository.save(clientCopyMachine);
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

  async findAllFranchises(): Promise<Franchise[]> {
    return this.franchiseRepository.find({
      where: { isDisabled: false },
      relations: ['clientCopyMachines'],
      order: { created_at: 'DESC' },
    });
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
