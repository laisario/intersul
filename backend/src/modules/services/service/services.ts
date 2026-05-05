import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeepPartial, Repository, In } from 'typeorm';
import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { Step } from '../entities/step.entity';
import { StepChecklist } from '../entities/step-checklist.entity';
import { Client } from '../../clients/entities/client.entity';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { User } from '../../auth/entities/user.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { Approval } from '../../common/entities/approval.entity';
import { ImageService } from '../../common/services/image.service';
import { StorageService } from '../../common/services/storage.service';
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
    @InjectRepository(StepChecklist)
    private checklistsRepository: Repository<StepChecklist>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(ClientCopyMachine)
    private copyMachinesRepository: Repository<ClientCopyMachine>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Billing)
    private billingsRepository: Repository<Billing>,
    @InjectRepository(Approval)
    private approvalsRepository: Repository<Approval>,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(filters?: {
    category_id?: number;
    client_id?: number;
    client_copy_machine_id?: number;
    city_id?: number;
    acquisition_type?: AcquisitionType;
    search?: string;
    sort_by?: 'priority' | 'status' | 'created_at';
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    data: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(filters?.page ?? 1, 1);
    const limit = Math.max(Math.min(filters?.limit ?? 10, 100), 1);
    const skip = (page - 1) * limit;

    // No `steps` join here: avoids inflated row counts and broken pagination.
    const query = this.servicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('client.address', 'clientAddress')
      .leftJoinAndSelect('clientAddress.neighborhood', 'neighborhood')
      .leftJoinAndSelect('neighborhood.city', 'city')
      .leftJoinAndSelect('city.state', 'state')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.clientCopyMachine', 'clientCopyMachine')
      .leftJoinAndSelect(
        'clientCopyMachine.catalogCopyMachine',
        'catalogCopyMachine',
      );

    if (filters?.category_id) {
      query.andWhere('service.category_id = :category_id', {
        category_id: filters.category_id,
      });
    }
    if (filters?.client_id) {
      query.andWhere('service.client_id = :client_id', {
        client_id: filters.client_id,
      });
    }
    if (filters?.client_copy_machine_id) {
      query.andWhere(
        'service.client_copy_machine_id = :client_copy_machine_id',
        {
          client_copy_machine_id: filters.client_copy_machine_id,
        },
      );
    }
    if (filters?.city_id) {
      query.andWhere('city.id = :city_id', { city_id: filters.city_id });
    }
    if (filters?.acquisition_type) {
      query.andWhere('clientCopyMachine.acquisition_type = :acquisition_type', {
        acquisition_type: filters.acquisition_type,
      });
    }

    const searchTrim = filters?.search?.trim();
    if (searchTrim) {
      query.andWhere('client.name LIKE :clientSearchLike', {
        clientSearchLike: `%${searchTrim}%`,
      });
      query
        .orderBy('client.name', 'ASC')
        .addOrderBy('service.created_at', 'DESC');
    } else {
      const sortOrder = filters?.sort_order === 'asc' ? 'ASC' : 'DESC';
      const sortBy = filters?.sort_by;
      const allowedSort: Array<'priority' | 'status' | 'created_at'> = [
        'priority',
        'status',
        'created_at',
      ];
      const effectiveSort =
        sortBy && allowedSort.includes(sortBy) ? sortBy : 'created_at';

      if (effectiveSort === 'priority') {
        query
          .orderBy('service.priority', sortOrder)
          .addOrderBy('service.created_at', 'DESC');
      } else if (effectiveSort === 'status') {
        query
          .orderBy('service.status', sortOrder)
          .addOrderBy('service.created_at', 'DESC');
      } else {
        query.orderBy('service.created_at', sortOrder);
      }
    }

    const [pageRows, total] = await query
      .take(limit)
      .skip(skip)
      .getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    const ids = pageRows.map((s) => s.id);
    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages };
    }

    const listRelations = [
      'client',
      'client.address',
      'client.address.neighborhood',
      'client.address.neighborhood.city',
      'client.address.neighborhood.city.state',
      'category',
      'clientCopyMachine',
      'clientCopyMachine.catalogCopyMachine',
      'steps',
      'steps.responsable',
      'steps.checklists',
    ] as const;

    const withSteps = await this.servicesRepository.find({
      where: { id: In(ids) },
      relations: [...listRelations],
    });

    for (const s of withSteps) {
      if (s.steps?.length) {
        s.steps.sort((a, b) => a.id - b.id);
      }
    }

    const orderMap = new Map(ids.map((id, i) => [id, i]));
    withSteps.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );

    return {
      data: withSteps,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: [
        'client',
        'category',
        'clientCopyMachine',
        'steps',
        'steps.responsable',
        'steps.approval',
        'steps.images',
        'steps.checklists',
      ],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { steps: rawSteps, has_payment, ...serviceData } = createServiceDto;

    const isInternal = serviceData.is_internal;
    const hasPayment = this.resolveHasPaymentForCreate(
      has_payment,
      serviceData,
      !!isInternal,
    );
    const steps = this.filterStepsForPaymentMode(rawSteps, hasPayment);

    // Validate external service payment fields (amount_to_receive is now optional)
    if (
      hasPayment &&
      !isInternal &&
      serviceData.amount_to_receive !== undefined &&
      serviceData.amount_to_receive !== null
    ) {
      if (serviceData.amount_to_receive <= 0) {
        throw new BadRequestException(
          'amount_to_receive must be a positive number',
        );
      }
    }

    if (!isInternal && serviceData.client_id) {
      const client = await this.clientsRepository.findOne({
        where: { id: serviceData.client_id },
      });
      if (!client) {
        throw new BadRequestException(
          `Cliente com id ${serviceData.client_id} não encontrado`,
        );
      }
    }

    let category = null;
    if (serviceData.category_id) {
      category = await this.categoriesRepository.findOne({
        where: { id: serviceData.category_id },
      });
      if (!category) {
        throw new BadRequestException(
          `Categoria com id ${serviceData.category_id} não encontrada`,
        );
      }
      if (
        !serviceData.priority &&
        category.name.toLowerCase().includes('cobrança')
      ) {
        serviceData.priority = 'high';
      }
    }

    if (!isInternal && serviceData.client_copy_machine_id) {
      const clientCopyMachine = await this.copyMachinesRepository.findOne({
        where: { id: serviceData.client_copy_machine_id },
      });
      if (!clientCopyMachine) {
        throw new BadRequestException(
          `Máquina de cópia de cliente com id ${serviceData.client_copy_machine_id} não encontrada`,
        );
      }
    }

    const cleanServiceData: DeepPartial<Service> = {
      client_id: isInternal ? null : serviceData.client_id,
      category_id: serviceData.category_id,
      client_copy_machine_id: isInternal
        ? null
        : serviceData.client_copy_machine_id,
      description: serviceData.description,
      priority: serviceData.priority,
      is_internal: serviceData.is_internal,
      amount_to_receive: isInternal
        ? null
        : hasPayment
          ? serviceData.amount_to_receive
          : null,
      payment_method: isInternal
        ? null
        : hasPayment
          ? serviceData.payment_method
          : null,
      is_invoiced: isInternal
        ? false
        : hasPayment
          ? (serviceData.is_invoiced ?? false)
          : false,
    };

    const service = this.servicesRepository.create(cleanServiceData);
    const savedService: Service = await this.servicesRepository.save(service);

    // Helper function to create a step entity
    const createStepEntity = async (
      step: CreateStepDto,
      existingStepNames: Set<string>,
    ): Promise<Step | null> => {
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
              errors: [
                {
                  field: `steps[${steps?.findIndex((s) => s.name === step.name) ?? 0}].responsable_id`,
                  message: `User with ID ${step.responsable_id} not found`,
                },
              ],
            });
          }
          // Validate that user is active
          if (!user.active) {
            throw new BadRequestException({
              message: 'Validation failed',
              errors: [
                {
                  field: `steps[${steps?.findIndex((s) => s.name === step.name) ?? 0}].responsable_id`,
                  message: `Responsável selecionado está inativo`,
                },
              ],
            });
          }
          responsableUser = user;
        }
      }

      const stepData: DeepPartial<Step> = {
        name: step.name,
        description: step.description,
        service_id: savedService.id,
        observation: step.observation ?? undefined,
        datetime_start: step.datetime_start
          ? new Date(step.datetime_start)
          : undefined,
        datetime_conclusion: step.datetime_conclusion
          ? new Date(step.datetime_conclusion)
          : undefined,
        datetime_expiration: step.datetime_expiration
          ? new Date(step.datetime_expiration)
          : undefined,
        status: step.status ?? StepStatus.PENDING,
        responsable_client: step.responsable_client ?? undefined,
        reason_cancellament: step.reason_cancellament ?? undefined,
        responsable:
          responsableUser !== undefined ? responsableUser : undefined,
      };

      const stepEntity = this.stepsRepository.create(stepData);
      // Store checklist_descriptions on the entity for later processing
      (stepEntity as any).checklist_descriptions = step.checklist_descriptions;

      return stepEntity;
    };

    // Get existing step names for duplicate checking
    const existingSteps = await this.stepsRepository.find({
      where: { service_id: savedService.id },
      select: ['name'],
    });
    const existingStepNames = new Set(
      existingSteps.map((s) => s.name.toLowerCase()),
    );

    const stepEntities: (Step | null)[] = [];

    // Create steps from payload (if provided)
    if (steps && steps.length > 0) {
      const payloadStepEntities = await Promise.all(
        steps.map(
          async (step) => await createStepEntity(step, existingStepNames),
        ),
      );
      stepEntities.push(...payloadStepEntities);
    }

    // Auto-generate payment step only when external service explicitly has payment
    // For all payment methods (including boleto), create the standard payment step
    const isBoleto =
      serviceData.payment_method?.toLowerCase() === 'bank slip' ||
      serviceData.payment_method?.toLowerCase() === 'boleto';

    if (!isInternal && hasPayment) {
      const paymentStepName = 'Realizar pagamento';
      const hasPaymentStep =
        existingStepNames.has(paymentStepName.toLowerCase()) ||
        stepEntities.some(
          (se) => se?.name.toLowerCase() === paymentStepName.toLowerCase(),
        );

      if (!hasPaymentStep) {
        // Build description based on amount and payment method
        let paymentDescription = 'Realizar pagamento.';
        if (
          serviceData.amount_to_receive &&
          serviceData.amount_to_receive > 0
        ) {
          const methodLabel = serviceData.payment_method || 'pagamento';
          paymentDescription = `Realizar pagamento (${methodLabel}). Valor: R$ ${serviceData.amount_to_receive.toFixed(2)}.`;
        } else {
          const methodLabel = serviceData.payment_method || 'pagamento';
          paymentDescription = `Realizar pagamento (${methodLabel}). O valor será definido posteriormente na etapa de pagamento.`;
        }

        // Find payment step from payload to get responsable and expiration, or use null
        const paymentStepFromPayload = steps?.find(
          (s) =>
            s.name.toLowerCase().includes('realizar pagamento') ||
            s.name.toLowerCase() === 'realizar pagamento',
        );

        const paymentStepDto: CreateStepDto = {
          name: paymentStepName,
          description: paymentDescription,
          responsable_id: paymentStepFromPayload?.responsable_id ?? null,
          datetime_expiration: paymentStepFromPayload?.datetime_expiration,
          status: StepStatus.PENDING,
        };

        const paymentStepEntity = await createStepEntity(
          paymentStepDto,
          existingStepNames,
        );
        if (paymentStepEntity) {
          stepEntities.push(paymentStepEntity);
          existingStepNames.add(paymentStepName.toLowerCase());
        }
      }
    }

    // Save all step entities (no step dependencies - feature removed)
    const validStepEntities = stepEntities.filter(
      (step) => step !== null,
    ) as Step[];
    if (validStepEntities.length > 0) {
      // Use transaction to ensure atomicity
      await this.stepsRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Save all steps
          await transactionalEntityManager.save(Step, validStepEntities);
        },
      );

      // Create checklists for steps that have checklist_descriptions
      for (const stepEntity of validStepEntities) {
        const savedStep = await this.stepsRepository.findOne({
          where: { service_id: savedService.id, name: stepEntity.name },
        });
        if (
          savedStep &&
          (stepEntity as any).checklist_descriptions &&
          (stepEntity as any).checklist_descriptions.length > 0
        ) {
          // Filter out empty strings
          const validDescriptions = (
            stepEntity as any
          ).checklist_descriptions.filter(
            (desc: string) => desc && desc.trim(),
          );
          if (validDescriptions.length > 0) {
            const checklists = validDescriptions.map((desc: string) =>
              this.checklistsRepository.create({
                description: desc.trim(),
                completed: false,
                step_id: savedStep.id,
              }),
            );
            await this.checklistsRepository.save(checklists);
          }
        }
      }

      await this.recalculateStatus(savedService.id);
    }

    return this.findOne(savedService.id);
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const { steps, has_payment, ...serviceData } = updateServiceDto;
    const service = await this.findOne(id);

    const isInternal =
      serviceData.is_internal !== undefined
        ? serviceData.is_internal
        : service.is_internal;

    let effectiveHasPayment: boolean;
    if (isInternal) {
      effectiveHasPayment = false;
    } else if (has_payment === true) {
      effectiveHasPayment = true;
    } else if (has_payment === false) {
      effectiveHasPayment = false;
    } else {
      effectiveHasPayment =
        this.inferLegacyHasPaymentFromServiceData(serviceData) ||
        this.inferExistingServiceHasPayment(service);
    }

    const {
      amount_to_receive,
      payment_method,
      is_invoiced,
      is_internal: _isInternalPatch,
      ...servicePatch
    } = serviceData;

    Object.assign(service, servicePatch);
    if (serviceData.is_internal !== undefined) {
      service.is_internal = serviceData.is_internal;
    }

    if (isInternal) {
      service.client_id = null;
      service.client_copy_machine_id = null;
      service.amount_to_receive = null;
      service.payment_method = null;
      service.is_invoiced = false;
    } else if (effectiveHasPayment) {
      if (amount_to_receive !== undefined) {
        service.amount_to_receive = amount_to_receive;
      }
      if (payment_method !== undefined) {
        service.payment_method = payment_method;
      }
      if (is_invoiced !== undefined) {
        service.is_invoiced = is_invoiced;
      }
    } else {
      service.amount_to_receive = null;
      service.payment_method = null;
      service.is_invoiced = false;
    }

    await this.servicesRepository.save(service);

    if (steps && steps.length > 0) {
      const stepsToPersist =
        this.filterStepsForPaymentMode(steps, effectiveHasPayment) ?? [];

      if (service.steps && service.steps.length > 0) {
        await this.stepsRepository.remove(service.steps);
      }

      const stepEntities = await Promise.all(
        stepsToPersist.map(async (step) => {
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
                  errors: [
                    {
                      field: `steps[${stepsToPersist.findIndex((s) => s.name === step.name)}].responsable_id`,
                      message: `User with ID ${step.responsable_id} not found`,
                    },
                  ],
                });
              }
              // Validate that user is active
              if (!user.active) {
                throw new BadRequestException({
                  message: 'Validation failed',
                  errors: [
                    {
                      field: `steps[${stepsToPersist.findIndex((s) => s.name === step.name)}].responsable_id`,
                      message: `Responsável selecionado está inativo`,
                    },
                  ],
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
            datetime_start: step.datetime_start
              ? new Date(step.datetime_start)
              : undefined,
            datetime_conclusion: step.datetime_conclusion
              ? new Date(step.datetime_conclusion)
              : undefined,
            datetime_expiration: step.datetime_expiration
              ? new Date(step.datetime_expiration)
              : undefined,
            status: step.status ?? undefined,
            responsable_client: step.responsable_client ?? undefined,
            reason_cancellament: step.reason_cancellament ?? undefined,
            responsable:
              responsableUser !== undefined ? responsableUser : undefined,
          };

          return this.stepsRepository.create(stepData);
        }),
      );

      await this.stepsRepository.save(stepEntities);

      // Create checklists for steps that have checklist_descriptions
      for (const stepEntity of stepEntities) {
        const stepIndex = stepEntities.indexOf(stepEntity);
        const stepDto = stepsToPersist[stepIndex];
        if (
          stepDto &&
          stepDto.checklist_descriptions &&
          stepDto.checklist_descriptions.length > 0
        ) {
          // Find the saved step
          const savedStep = await this.stepsRepository.findOne({
            where: { service_id: service.id, name: stepEntity.name },
          });
          if (savedStep) {
            // Filter out empty strings
            const validDescriptions = stepDto.checklist_descriptions.filter(
              (desc: string) => desc && desc.trim(),
            );
            if (validDescriptions.length > 0) {
              const checklists = validDescriptions.map((desc: string) =>
                this.checklistsRepository.create({
                  description: desc.trim(),
                  completed: false,
                  step_id: savedStep.id,
                }),
              );
              await this.checklistsRepository.save(checklists);
            }
          }
        }
      }
    }

    if (!isInternal && !effectiveHasPayment) {
      const existingSteps = await this.stepsRepository.find({
        where: { service_id: id },
      });
      const toRemove = existingSteps.filter((s) =>
        this.isAutoPaymentOrBoletoStepName(s.name),
      );
      if (toRemove.length) {
        await this.stepsRepository.remove(toRemove);
      }
    }

    await this.recalculateStatus(id);

    return this.findOne(id);
  }

  /**
   * Recalculates service status from step statuses (feature: service-status-from-steps).
   * Business rules: no steps → PENDING; all PENDING → PENDING; all CONCLUDED → CONCLUDED;
   * any IN_PROGRESS → IN_PROGRESS; mixed → IN_PROGRESS; all CANCELLED → CONCLUDED.
   * Skips recalculation when service is CANCELLED (preserves manual cancellation).
   */
  async recalculateStatus(serviceId: number): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['steps'],
    });

    if (!service) {
      return;
    }

    if (service.status === ServiceStatus.CANCELLED) {
      return;
    }

    const steps = service.steps ?? [];
    const nonCancelled = steps.filter((s) => s.status !== StepStatus.CANCELLED);

    let newStatus: ServiceStatus;
    if (steps.length === 0) {
      newStatus = ServiceStatus.PENDING;
    } else if (nonCancelled.length === 0) {
      newStatus = ServiceStatus.CONCLUDED;
    } else if (nonCancelled.some((s) => s.status === StepStatus.IN_PROGRESS)) {
      newStatus = ServiceStatus.IN_PROGRESS;
    } else if (nonCancelled.every((s) => s.status === StepStatus.CONCLUDED)) {
      newStatus = ServiceStatus.CONCLUDED;
    } else if (nonCancelled.every((s) => s.status === StepStatus.PENDING)) {
      newStatus = ServiceStatus.PENDING;
    } else {
      newStatus = ServiceStatus.IN_PROGRESS;
    }

    if (service.status !== newStatus) {
      service.status = newStatus;
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
      const stepIds = service.steps.map((step) => step.id);

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

      // Delete images for each step (R2 files + DB rows)
      for (const stepId of stepIds) {
        const images = await this.imageService.findByStepId(stepId);
        for (const image of images) {
          const key = this.storageService.extractKeyFromUrl(image.path);
          if (key) {
            try {
              await this.storageService.deleteFile(key);
            } catch {
              // File already gone from R2 — proceed with DB cleanup
            }
          }
        }
        await this.imageService.removeByStepId(stepId);
      }

      // Delete approvals for all steps
      await this.approvalsRepository.delete({ step_id: In(stepIds) });

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
      .andWhere('step.status != :concluded', {
        concluded: StepStatus.CONCLUDED,
      })
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

  private resolveHasPaymentForCreate(
    has_payment: boolean | undefined,
    serviceData: Omit<CreateServiceDto, 'steps' | 'has_payment'>,
    isInternal: boolean,
  ): boolean {
    if (isInternal) {
      return false;
    }
    if (has_payment === true) {
      return true;
    }
    if (has_payment === false) {
      return false;
    }
    return this.inferLegacyHasPaymentFromServiceData(serviceData);
  }

  private inferLegacyHasPaymentFromServiceData(
    serviceData: Partial<
      Pick<CreateServiceDto, 'amount_to_receive' | 'payment_method'>
    >,
  ): boolean {
    const hasAmount =
      serviceData.amount_to_receive != null &&
      Number(serviceData.amount_to_receive) > 0;
    const hasMethod = !!(
      serviceData.payment_method && String(serviceData.payment_method).trim()
    );
    return hasAmount || hasMethod;
  }

  private inferExistingServiceHasPayment(service: Service): boolean {
    if (service.is_internal) {
      return false;
    }
    const hasAmount =
      service.amount_to_receive != null &&
      Number(service.amount_to_receive) > 0;
    const hasMethod = !!(
      service.payment_method && String(service.payment_method).trim()
    );
    if (hasAmount || hasMethod || service.is_invoiced) {
      return true;
    }
    const stepNames = (service.steps || []).map((s) => s.name.toLowerCase());
    return stepNames.some(
      (n) =>
        n === 'realizar pagamento' ||
        n === 'cobrança de boleto' ||
        n.includes('cobrança de boleto'),
    );
  }

  private isAutoPaymentOrBoletoStepName(name: string): boolean {
    const n = name.trim().toLowerCase();
    return n === 'realizar pagamento' || n === 'cobrança de boleto';
  }

  private filterStepsForPaymentMode(
    steps: CreateStepDto[] | undefined,
    hasPayment: boolean,
  ): CreateStepDto[] | undefined {
    if (!steps?.length) {
      return steps;
    }
    if (hasPayment) {
      return steps;
    }
    return steps.filter((s) => !this.isAutoPaymentOrBoletoStepName(s.name));
  }
}
