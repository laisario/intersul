import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeepPartial, Repository, In } from 'typeorm';
import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { Step } from '../entities/step.entity';
import { Client } from '../../clients/entities/client.entity';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { User } from '../../auth/entities/user.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { AcquisitionType } from '../../../common/enums/acquisition-type.enum';
import { StepStatus } from '../../../common/enums/step-status.enum';
import { ServiceStatus } from '../../../common/enums/service-status.enum';

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
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Billing)
    private billingsRepository: Repository<Billing>,
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

    const isInternal = serviceData.is_internal;

    // Validate external service payment fields
    if (!isInternal) {
      if (serviceData.amount_to_receive === undefined || serviceData.amount_to_receive === null) {
        throw new BadRequestException('amount_to_receive is required for external services');
      }
      if (serviceData.amount_to_receive <= 0) {
        throw new BadRequestException('amount_to_receive must be a positive number');
      }
    }

    if (!isInternal && serviceData.client_id) {
      const client = await this.clientsRepository.findOne({
        where: { id: serviceData.client_id },
      });
      if (!client) {
        throw new BadRequestException(`Cliente com id ${serviceData.client_id} não encontrado`);
      }
    }

    let category = null;
    if (serviceData.category_id) {
      category = await this.categoriesRepository.findOne({
        where: { id: serviceData.category_id },
      });
      if (!category) {
        throw new BadRequestException(`Categoria com id ${serviceData.category_id} não encontrada`);
      }
      if (!serviceData.priority && category.name.toLowerCase().includes('cobrança')) {
        serviceData.priority = 'high';
      }
    }

    if (!isInternal && serviceData.client_copy_machine_id) {
      const clientCopyMachine = await this.copyMachinesRepository.findOne({
        where: { id: serviceData.client_copy_machine_id },
      });
      if (!clientCopyMachine) {
          throw new BadRequestException(`Máquina de cópia de cliente com id ${serviceData.client_copy_machine_id} não encontrada`);
      }
    }

    const cleanServiceData: DeepPartial<Service> = {
      client_id: isInternal ? null : serviceData.client_id,
      category_id: serviceData.category_id,
      client_copy_machine_id: isInternal ? null : serviceData.client_copy_machine_id,
      description: serviceData.description,
      priority: serviceData.priority,
      is_internal: serviceData.is_internal,
      amount_to_receive: isInternal ? null : serviceData.amount_to_receive,
      payment_method: isInternal ? null : serviceData.payment_method,
      is_invoiced: isInternal ? false : (serviceData.is_invoiced ?? false),
    };

    const service = this.servicesRepository.create(cleanServiceData);
    const savedService: Service = await this.servicesRepository.save(service);

    if (steps && steps.length > 0) {
      // Create step entities with proper handling of responsable_id
      const stepEntities = await Promise.all(
        steps.map(async (step) => {
          // Validate responsable_id if provided
          let responsableUser: User | null = null;
          if (step.responsable_id !== undefined) {
            if (step.responsable_id === null) {
              responsableUser = null;
            } else {
              const user = await this.usersRepository.findOne({
                where: { id: step.responsable_id },
              });
              if (!user) {
                throw new BadRequestException(`User with ID ${step.responsable_id} not found`);
              }
              responsableUser = user;
            }
          }

          const stepData: DeepPartial<Step> = {
            name: step.name,
            description: step.description,
            service_id: savedService.id,
            observation: step.observation ?? undefined,
            datetime_start: step.datetime_start ? new Date(step.datetime_start) : undefined,
            datetime_conclusion: step.datetime_conclusion ? new Date(step.datetime_conclusion) : undefined,
            datetime_expiration: step.datetime_expiration ? new Date(step.datetime_expiration) : undefined,
            status: step.status ?? undefined,
            responsable_client: step.responsable_client ?? undefined,
            reason_cancellament: step.reason_cancellament ?? undefined,
            responsable: responsableUser !== undefined ? responsableUser : undefined,
          };

          return this.stepsRepository.create(stepData);
        })
      );

      await this.stepsRepository.save(stepEntities);
    }

    // Create automatic steps for external services
    if (!isInternal) {
      // Create "Realizar pagamento" step
      const paymentStep = this.stepsRepository.create({
        name: 'Realizar pagamento',
        description: `Consultar o valor informado no serviço: R$ ${serviceData.amount_to_receive?.toFixed(2) || '0.00'}`,
        service_id: savedService.id,
        status: StepStatus.PENDING,
      });
      await this.stepsRepository.save(paymentStep);

      // If payment method is BOLETO, create "Cobrança de boleto" step
      const paymentMethod = serviceData.payment_method?.toLowerCase();
      if (paymentMethod === 'boleto' || paymentMethod === 'bank slip' || paymentMethod === 'bankslip') {
        // Find or create "Cobrança de Boleto" category
        let boletoCategory = await this.categoriesRepository.findOne({
          where: { name: 'Cobrança de Boleto' },
        });

        if (!boletoCategory) {
          boletoCategory = this.categoriesRepository.create({
            name: 'Cobrança de Boleto',
            description: 'Categoria para serviços de cobrança de boleto',
          });
          boletoCategory = await this.categoriesRepository.save(boletoCategory);
        }

        const boletoStep = this.stepsRepository.create({
          name: 'Cobrança de boleto',
          description: 'Realizar cobrança de boleto conforme método de pagamento informado',
          service_id: savedService.id,
          category_id: boletoCategory.id,
          status: StepStatus.PENDING,
        });
        await this.stepsRepository.save(boletoStep);
      }
    }
    
    return this.findOne(savedService.id);
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const { steps, ...serviceData } = updateServiceDto;
    const service = await this.findOne(id);

    Object.assign(service, serviceData);
    await this.servicesRepository.save(service);

    if (steps && steps.length > 0) {
      if (service.steps && service.steps.length > 0) {
        await this.stepsRepository.remove(service.steps);
      }

      const stepEntities = await Promise.all(
        steps.map(async (step) => {
          let responsableUser: User | null = null;
          if (step.responsable_id !== undefined) {
            if (step.responsable_id === null) {
              responsableUser = null;
            } else {
              const user = await this.usersRepository.findOne({
                where: { id: step.responsable_id },
              });
              if (!user) {
                throw new BadRequestException(`User with ID ${step.responsable_id} not found`);
              }
              responsableUser = user;
            }
          }

          const stepData: DeepPartial<Step> = {
            name: step.name,
            description: step.description,
            service_id: service.id,
            observation: step.observation ?? undefined,
            datetime_start: step.datetime_start ? new Date(step.datetime_start) : undefined,
            datetime_conclusion: step.datetime_conclusion ? new Date(step.datetime_conclusion) : undefined,
            datetime_expiration: step.datetime_expiration ? new Date(step.datetime_expiration) : undefined,
            status: step.status ?? undefined,
            responsable_client: step.responsable_client ?? undefined,
            reason_cancellament: step.reason_cancellament ?? undefined,
            responsable: responsableUser !== undefined ? responsableUser : undefined,
          };

          return this.stepsRepository.create(stepData);
        })
      );
        
      await this.stepsRepository.save(stepEntities);
    }

    await this.updateServiceStatus(id);

    return this.findOne(id);
  }

  /**
   * Update service status based on steps status
   * If at least one step has status IN_PROGRESS, service status becomes IN_PROGRESS
   * Only updates if service is currently PENDING (to avoid overriding manual status changes)
   */
  async updateServiceStatus(serviceId: number): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['steps'],
    });

    if (!service) {
      return;
    }

    // Don't update if service is manually set to CONCLUDED or CANCELLED
    if (service.status === ServiceStatus.CONCLUDED || service.status === ServiceStatus.CANCELLED) {
      return;
    }

    // Only update if service is currently PENDING
    // This ensures we don't override manual status changes
    if (service.status !== ServiceStatus.PENDING) {
      return;
    }

    // Check if at least one step has status IN_PROGRESS
    const hasInProgressStep = service.steps?.some(step => step.status === StepStatus.IN_PROGRESS);

    // If at least one step is IN_PROGRESS, change service status to IN_PROGRESS
    if (hasInProgressStep) {
      service.status = ServiceStatus.IN_PROGRESS;
      await this.servicesRepository.save(service);
    }
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
      // Get all step IDs
      const stepIds = service.steps.map(step => step.id);
      
      // Find and delete all billings related to these steps
      if (stepIds.length > 0) {
        const billings = await this.billingsRepository.find({
          where: {
            step_id: In(stepIds),
          },
        });
        
        if (billings.length > 0) {
          await this.billingsRepository.remove(billings);
        }
      }
      
      // Now safe to delete the steps
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


