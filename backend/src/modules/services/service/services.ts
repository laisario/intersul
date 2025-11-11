import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { Step } from '../entities/step.entity';
import { Client } from '../../clients/entities/client.entity';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { AcquisitionType } from '../../../common/enums/acquisition-type.enum';
import { StepStatus } from '../../../common/enums/step-status.enum';
@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(ClientCopyMachine)
    private copyMachinesRepository: Repository<ClientCopyMachine>,
  ) {}

  async findAll(filters?: {
    category_id?: number;
    client_id?: number;
    client_copy_machine_id?: number;
    city_id?: number;
    acquisition_type?: AcquisitionType;
    page?: number;
    limit?: number;
  }): Promise<{ data: Service[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    const query = this.servicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('client.address', 'clientAddress')
      .leftJoinAndSelect('clientAddress.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.city', 'city')
      .leftJoinAndSelect('city.state', 'state')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.clientCopyMachine', 'clientCopyMachine')
      .leftJoinAndSelect('clientCopyMachine.catalogCopyMachine', 'catalogCopyMachine')
      .leftJoinAndSelect('service.steps', 'steps')

    if (filters?.category_id) {
      query.andWhere('service.category_id = :category_id', { category_id: filters.category_id });
    }
    if (filters?.client_id) {
      query.andWhere('service.client_id = :client_id', { client_id: filters.client_id });
    }
    if (filters?.client_copy_machine_id) {
      query.andWhere('service.client_copy_machine_id = :client_copy_machine_id', { client_copy_machine_id: filters.client_copy_machine_id });
    }
    if (filters?.city_id) {
      query.andWhere('city.id = :city_id', { city_id: filters.city_id });
    }
    if (filters?.acquisition_type) {
      query.andWhere('clientCopyMachine.acquisition_type = :acquisition_type', {
        acquisition_type: filters.acquisition_type,
      });
    }

    const [data, total] = await query
      .orderBy('service.created_at', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['client', 'category', 'clientCopyMachine', 'steps', 'steps.responsable', 'steps.approval', 'steps.images'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { steps, ...serviceData } = createServiceDto;

    // Validate that client exists
    const client = await this.clientsRepository.findOne({
      where: { id: serviceData.client_id },
    });
    if (!client) {
      throw new BadRequestException(`Client with ID ${serviceData.client_id} not found`);
    }

    // Validate that category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: serviceData.category_id },
    });
    if (!category) {
      throw new BadRequestException(`Category with ID ${serviceData.category_id} not found`);
    }

    // Validate that client copy machine exists (if provided)
    if (serviceData.client_copy_machine_id) {
      const clientCopyMachine = await this.copyMachinesRepository.findOne({
        where: { id: serviceData.client_copy_machine_id },
      });
      if (!clientCopyMachine) {
        throw new BadRequestException(`Client copy machine with ID ${serviceData.client_copy_machine_id} not found`);
      }
    }

    const service = this.servicesRepository.create(serviceData);
    const savedService = await this.servicesRepository.save(service);

    if (steps && steps.length > 0) {
      const stepEntities = steps.map(step => this.stepsRepository.create({
        ...step,
        service_id: savedService.id,
      }));
      await this.stepsRepository.save(stepEntities);
    }

    return this.findOne(savedService.id);
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const { steps, ...serviceData } = updateServiceDto;
    const service = await this.findOne(id);

    Object.assign(service, serviceData);
    await this.servicesRepository.save(service);

    if (steps !== undefined) {
      if (service.steps && service.steps.length > 0) {
        await this.stepsRepository.remove(service.steps);
      }

      if (steps.length > 0) {
        const stepEntities = steps.map(step => this.stepsRepository.create({
          ...step,
          service_id: service.id,
        }));
        await this.stepsRepository.save(stepEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['steps'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (service.steps && service.steps.length > 0) {
      await this.stepsRepository.remove(service.steps);
    }

    await this.servicesRepository.remove(service);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const total = await this.servicesRepository.count();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const currentDay = startOfWeek.getDay(); // Sunday = 0
    const distanceToMonday = (currentDay + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - distanceToMonday);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeek = await this.servicesRepository.count({
      where: {
        created_at: Between(startOfWeek, now),
      },
    });

    const thisMonth = await this.servicesRepository.count({
      where: {
        created_at: Between(startOfMonth, now),
      },
    });

    const latestSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .select('step.service_id', 'serviceId')
      .addSelect('step.status', 'status')
      .where(
        `NOT EXISTS (
          SELECT 1 FROM steps newerStep
          WHERE newerStep.service_id = step.service_id
            AND newerStep.updated_at > step.updated_at
        )`,
      )
      .getRawMany<{ serviceId: number; status: StepStatus }>();

    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    const servicesWithSteps = new Set<number>();
    for (const row of latestSteps) {
      servicesWithSteps.add(row.serviceId);
      switch (row.status) {
        case StepStatus.PENDING:
          pending += 1;
          break;
        case StepStatus.IN_PROGRESS:
          inProgress += 1;
          break;
        case StepStatus.CONCLUDED:
          completed += 1;
          break;
        case StepStatus.CANCELLED:
          cancelled += 1;
          break;
        default:
          pending += 1;
          break;
      }
    }

    const servicesWithoutSteps = total - servicesWithSteps.size;
    if (servicesWithoutSteps > 0) {
      pending += servicesWithoutSteps;
    }

    const overdueResult = await this.stepsRepository
      .createQueryBuilder('step')
      .select('DISTINCT step.service_id', 'serviceId')
      .where('step.datetime_expiration IS NOT NULL')
      .andWhere('step.datetime_expiration < :now', { now })
      .andWhere('step.status != :concluded', { concluded: StepStatus.CONCLUDED })
      .getRawMany();

    const overdue = overdueResult.length;

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      overdue,
      thisWeek,
      thisMonth,
    };
  }
}


