import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Step } from '../entities/step.entity';
import { UpdateStepDto } from '../dto/update-step.dto';
import { StepStatus } from '../../../common/enums/step-status.enum';
import { ServicesService } from './services';
import { Service } from '../entities/service.entity';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class StepService {
  constructor(
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => ServicesService))
    private servicesService: ServicesService,
  ) {}

  async findMySteps(
    userId: number,
    filter?: 'created_today' | 'expires_today' | 'expired',
  ): Promise<Step[]> {
    const where: any = { responsable: { id: userId } };

    // Apply date filters
    if (
      filter === 'created_today' ||
      filter === 'expires_today' ||
      filter === 'expired'
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (filter === 'created_today') {
        where.created_at = Between(today, tomorrow);
      } else if (filter === 'expires_today') {
        where.datetime_expiration = Between(today, tomorrow);
      } else if (filter === 'expired') {
        // Filter for steps that have already expired (datetime_expiration < today)
        where.datetime_expiration = LessThan(today);
      }
    }

    return this.stepsRepository.find({
      where,
      relations: [
        'service',
        'service.client',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
        'checklists',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findStepsByUserId(
    userId: number,
    filter?: 'created_today' | 'expires_today' | 'expired',
  ): Promise<Step[]> {
    // This method allows admins/managers to view steps for any user
    const where: any = { responsable: { id: userId } };

    // Apply date filters
    if (
      filter === 'created_today' ||
      filter === 'expires_today' ||
      filter === 'expired'
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (filter === 'created_today') {
        where.created_at = Between(today, tomorrow);
      } else if (filter === 'expires_today') {
        where.datetime_expiration = Between(today, tomorrow);
      } else if (filter === 'expired') {
        // Filter for steps that have already expired (datetime_expiration < today)
        where.datetime_expiration = LessThan(today);
      }
    }

    return this.stepsRepository.find({
      where,
      relations: [
        'service',
        'service.client',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
        'checklists',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Step> {
    // First, try to find the step by ID (without responsable_id check)
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: [
        'service',
        'service.client',
        'service.category',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
        'checklists',
      ],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Compute canStart flag for frontend
    let canStart = false;
    const blockReason: string | undefined = undefined;

    const serviceCategoryName = step.service?.category?.name;
    // Steps can be started independently - no dependency check needed
    if (step.status === StepStatus.PENDING) {
      canStart = true;
    }

    // Add computed properties (these won't be saved to DB, just for API response)
    (step as any).canStart = canStart;
    if (blockReason) {
      (step as any).blockReason = blockReason;
    }

    // If user is the responsable, they have full access
    // Otherwise, they can still view the step (read-only access)
    // This allows users to view steps from services they can see
    return step;
  }

  async update(
    id: number,
    userId: number,
    updateStepDto: UpdateStepDto,
    userRole?: string,
  ): Promise<Step> {
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: ['responsable'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';
    const isResponsable = step.responsable?.id === userId;

    if (!isAdminOrManager && !isResponsable) {
      throw new NotFoundException(
        `Step with ID ${id} not found or you are not responsible for it`,
      );
    }

    if (updateStepDto.responsable_id !== undefined) {
      if (!isAdminOrManager) {
        throw new ForbiddenException(
          'Only admins and managers can update the responsible user',
        );
      }

      if (updateStepDto.responsable_id === null) {
        step.responsable = null;
      } else {
        const newResponsable = await this.usersRepository.findOne({
          where: { id: updateStepDto.responsable_id },
        });
        if (!newResponsable) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: [
              {
                field: 'responsable_id',
                message: `User with ID ${updateStepDto.responsable_id} not found`,
              },
            ],
          });
        }
        // Validate that user is active
        if (!newResponsable.active) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: [
              {
                field: 'responsable_id',
                message: 'Responsável selecionado está inativo',
              },
            ],
          });
        }
        step.responsable = newResponsable;
      }
    }

    if (updateStepDto.observation !== undefined) {
      step.observation = updateStepDto.observation;
    }
    if (updateStepDto.responsable_client !== undefined) {
      step.responsable_client = updateStepDto.responsable_client;
    }
    if (updateStepDto.status !== undefined) {
      step.status = updateStepDto.status;
    }

    const savedStep = await this.stepsRepository.save(step);

    if (step.service_id) {
      await this.servicesService.recalculateStatus(step.service_id);
    }

    return savedStep;
  }

  async startStep(id: number, userId: number): Promise<Step> {
    // First, find the step by ID with its dependency
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: [
        'service',
        'service.client',
        'service.category',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
      ],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can start the step
    if (step.responsable?.id !== userId) {
      throw new BadRequestException(
        'Only the responsable assigned to this step can start it',
      );
    }

    if (step.status !== StepStatus.PENDING) {
      throw new BadRequestException(
        'Step can only be started if it is pending',
      );
    }

    // Steps can be started independently - no dependency check needed
    step.status = StepStatus.IN_PROGRESS;
    step.datetime_start = new Date();

    const savedStep = await this.stepsRepository.save(step);

    if (step.service_id) {
      await this.servicesService.recalculateStatus(step.service_id);
    }

    return savedStep;
  }

  async concludeStep(id: number, userId: number): Promise<Step> {
    // First, find the step by ID
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: [
        'service',
        'service.client',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
      ],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can conclude the step
    if (step.responsable?.id !== userId) {
      throw new BadRequestException(
        'Only the responsable assigned to this step can conclude it',
      );
    }

    if (step.status !== StepStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Step can only be concluded if it is in progress',
      );
    }

    step.status = StepStatus.CONCLUDED;
    step.datetime_conclusion = new Date();

    const savedStep = await this.stepsRepository.save(step);

    if (step.service_id) {
      await this.servicesService.recalculateStatus(step.service_id);

      // If step is "Realizar pagamento" from external service, update is_invoiced
      if (step.name === 'Realizar pagamento' && step.service_id) {
        const service = await this.servicesRepository.findOne({
          where: { id: step.service_id },
        });
        if (service && !service.is_internal) {
          service.is_invoiced = true;
          await this.servicesRepository.save(service);
        }
      }
    }

    return savedStep;
  }

  async cancelStep(id: number, userId: number, reason: string): Promise<Step> {
    // First, find the step by ID
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: [
        'service',
        'service.client',
        'category',
        'responsable',
        'images',
        'billing',
        'billing.copyMachine',
        'billing.copyMachine.franchise',
        'billing.client',
        'billing.responsibleUser',
      ],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can cancel the step
    if (step.responsable?.id !== userId) {
      throw new BadRequestException(
        'Only the responsable assigned to this step can cancel it',
      );
    }

    if (step.status === StepStatus.CONCLUDED) {
      throw new BadRequestException('Cannot cancel a concluded step');
    }

    step.status = StepStatus.CANCELLED;
    step.reason_cancellament = reason;

    const savedStep = await this.stepsRepository.save(step);

    if (step.service_id) {
      await this.servicesService.recalculateStatus(step.service_id);
    }

    return savedStep;
  }
}
