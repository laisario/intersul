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
import { CreateStepDto } from '../dto/create-step.dto';
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

    // Validate external service payment fields (amount_to_receive is now optional)
    if (!isInternal && serviceData.amount_to_receive !== undefined && serviceData.amount_to_receive !== null) {
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

    // Helper function to create a step entity
    const createStepEntity = async (step: CreateStepDto, existingStepNames: Set<string>): Promise<Step | null> => {
          // Skip if step with same name already exists (idempotency)
          if (existingStepNames.has(step.name.toLowerCase())) {
            return null;
          }

          let responsableUser: User | null = null;
          if (step.responsable_id !== undefined) {
            if (step.responsable_id === null) {
              responsableUser = null;
            } else {
              const user = await this.usersRepository.findOne({
                where: { id: step.responsable_id },
              });
              if (!user) {
                throw new BadRequestException({
                  message: 'Validation failed',
                  errors: [{
                    field: `steps[${steps?.findIndex(s => s.name === step.name) ?? 0}].responsable_id`,
                    message: `User with ID ${step.responsable_id} not found`
                  }]
                });
              }
              // Validate that user is active
              if (!user.active) {
                throw new BadRequestException({
                  message: 'Validation failed',
                  errors: [{
                    field: `steps[${steps?.findIndex(s => s.name === step.name) ?? 0}].responsable_id`,
                    message: `Responsável selecionado está inativo`
                  }]
                });
              }
              responsableUser = user;
            }
          }

          // Handle boleto step category
          let categoryId: number | undefined = undefined;
          if (step.name === 'Cobrança de boleto' || step.name.toLowerCase().includes('cobrança de boleto')) {
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
            categoryId = boletoCategory.id;
          }

          const stepData: DeepPartial<Step> = {
            name: step.name,
            description: step.description,
            service_id: savedService.id,
            observation: step.observation ?? undefined,
            datetime_start: step.datetime_start ? new Date(step.datetime_start) : undefined,
            datetime_conclusion: step.datetime_conclusion ? new Date(step.datetime_conclusion) : undefined,
            datetime_expiration: step.datetime_expiration ? new Date(step.datetime_expiration) : undefined,
            status: step.status ?? StepStatus.PENDING,
            responsable_client: step.responsable_client ?? undefined,
            reason_cancellament: step.reason_cancellament ?? undefined,
            responsable: responsableUser !== undefined ? responsableUser : undefined,
            category_id: categoryId,
          };

          return this.stepsRepository.create(stepData);
    };

    // Get existing step names for duplicate checking
    const existingSteps = await this.stepsRepository.find({
      where: { service_id: savedService.id },
      select: ['name'],
    });
    const existingStepNames = new Set(existingSteps.map(s => s.name.toLowerCase()));

    const stepEntities: (Step | null)[] = [];

    // Create steps from payload (if provided)
    if (steps && steps.length > 0) {
      const payloadStepEntities = await Promise.all(
        steps.map(async (step) => await createStepEntity(step, existingStepNames))
      );
      stepEntities.push(...payloadStepEntities);
    }

    // Auto-generate payment step for external services (always, regardless of amount_to_receive)
    if (!isInternal) {
      const paymentStepName = 'Realizar pagamento';
      const hasPaymentStep = existingStepNames.has(paymentStepName.toLowerCase()) ||
        stepEntities.some(se => se?.name.toLowerCase() === paymentStepName.toLowerCase());

      if (!hasPaymentStep) {
        // Build description based on whether amount is provided
        let paymentDescription = 'Realizar pagamento.';
        if (serviceData.amount_to_receive && serviceData.amount_to_receive > 0) {
          paymentDescription = `Realizar pagamento. Consulte o valor informado no serviço: R$ ${serviceData.amount_to_receive.toFixed(2)}.`;
        } else {
          paymentDescription = 'Realizar pagamento. O valor será definido posteriormente na etapa de pagamento.';
        }

        // Find payment step from payload to get responsable and expiration, or use null
        const paymentStepFromPayload = steps?.find(s => 
          s.name.toLowerCase().includes('realizar pagamento') || 
          s.name.toLowerCase() === 'realizar pagamento'
        );

        const paymentStepDto: CreateStepDto = {
          name: paymentStepName,
          description: paymentDescription,
          responsable_id: paymentStepFromPayload?.responsable_id ?? null,
          datetime_expiration: paymentStepFromPayload?.datetime_expiration,
          status: StepStatus.PENDING,
        };

        const paymentStepEntity = await createStepEntity(paymentStepDto, existingStepNames);
        if (paymentStepEntity) {
          stepEntities.push(paymentStepEntity);
          existingStepNames.add(paymentStepName.toLowerCase());
        }
      }

      // Auto-generate boleto step if payment method is Boleto
      const isBoleto = serviceData.payment_method?.toLowerCase() === 'bank slip' || 
                       serviceData.payment_method?.toLowerCase() === 'boleto';
      
      if (isBoleto) {
        const boletoStepName = 'Cobrança de boleto';
        const hasBoletoStep = existingStepNames.has(boletoStepName.toLowerCase()) ||
          stepEntities.some(se => se?.name.toLowerCase() === boletoStepName.toLowerCase());

        if (!hasBoletoStep) {
          // Find boleto step from payload to get responsable and expiration, or use null
          const boletoStepFromPayload = steps?.find(s => 
            s.name.toLowerCase().includes('cobrança de boleto') || 
            s.name.toLowerCase() === 'cobrança de boleto'
          );

          const boletoStepDto: CreateStepDto = {
            name: boletoStepName,
            description: 'Gerar/realizar cobrança via boleto para o serviço.',
            responsable_id: boletoStepFromPayload?.responsable_id ?? null, // Optional for boleto
            datetime_expiration: boletoStepFromPayload?.datetime_expiration,
            status: StepStatus.PENDING,
          };

          const boletoStepEntity = await createStepEntity(boletoStepDto, existingStepNames);
          if (boletoStepEntity) {
            stepEntities.push(boletoStepEntity);
          }
        }
      }
    }

    // Save all step entities and set dependencies based on order (atomically in transaction)
    const validStepEntities = stepEntities.filter(step => step !== null) as Step[];
    if (validStepEntities.length > 0) {
      // Use transaction to ensure atomicity
      await this.stepsRepository.manager.transaction(async (transactionalEntityManager) => {
        // Save steps first to get their IDs
        const savedSteps = await transactionalEntityManager.save(Step, validStepEntities);
        
        // Set dependencies: step[0] has no dependency, step[i] depends on step[i-1]
        for (let i = 0; i < savedSteps.length; i++) {
          if (i === 0) {
            savedSteps[i].depends_on_step_id = null;
          } else {
            savedSteps[i].depends_on_step_id = savedSteps[i - 1].id;
          }
        }
        
        // Save again with dependencies set
        await transactionalEntityManager.save(Step, savedSteps);
      });
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
                throw new BadRequestException({
                  message: 'Validation failed',
                  errors: [{
                    field: `steps[${steps.findIndex(s => s.name === step.name)}].responsable_id`,
                    message: `User with ID ${step.responsable_id} not found`
                  }]
                });
              }
              // Validate that user is active
              if (!user.active) {
                throw new BadRequestException({
                  message: 'Validation failed',
                  errors: [{
                    field: `steps[${steps.findIndex(s => s.name === step.name)}].responsable_id`,
                    message: `Responsável selecionado está inativo`
                  }]
                });
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


