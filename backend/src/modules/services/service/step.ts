import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Step } from '../entities/step.entity';
import { UpdateStepDto } from '../dto/update-step.dto';
import { StepStatus } from '../../../common/enums/step-status.enum';
import { ServicesService } from './services';

@Injectable()
export class StepService {
  constructor(
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
    @Inject(forwardRef(() => ServicesService))
    private servicesService: ServicesService,
  ) {}

  async findMySteps(userId: number, filter?: 'created_today' | 'expires_today'): Promise<Step[]> {
    const where: any = { responsable_id: userId };

    // Apply date filters
    if (filter === 'created_today' || filter === 'expires_today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (filter === 'created_today') {
        where.created_at = Between(today, tomorrow);
      } else if (filter === 'expires_today') {
        where.datetime_expiration = Between(today, tomorrow);
      }
    }

    return this.stepsRepository.find({
      where,
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Step> {
    // First, try to find the step by ID (without responsable_id check)
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // If user is the responsable, they have full access
    // Otherwise, they can still view the step (read-only access)
    // This allows users to view steps from services they can see
    return step;
  }

  async update(id: number, userId: number, updateStepDto: UpdateStepDto): Promise<Step> {
    // For update, we need to check if user is the responsable
    const step = await this.stepsRepository.findOne({
      where: { id, responsable_id: userId },
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found or you are not responsible for it`);
    }

    if (updateStepDto.observation !== undefined) {
      step.observation = updateStepDto.observation;
    }
    if (updateStepDto.responsable_client !== undefined) {
      step.responsable_client = updateStepDto.responsable_client;
    }

    return this.stepsRepository.save(step);
  }

  async startStep(id: number, userId: number): Promise<Step> {
    // First, find the step by ID
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can start the step
    if (step.responsable_id !== userId) {
      throw new BadRequestException('Only the responsable assigned to this step can start it');
    }

    if (step.status !== StepStatus.PENDING) {
      throw new BadRequestException('Step can only be started if it is pending');
    }

    step.status = StepStatus.IN_PROGRESS;
    step.datetime_start = new Date();

    const savedStep = await this.stepsRepository.save(step);

    // Update service status if step has service_id
    if (step.service_id) {
      await this.servicesService.updateServiceStatus(step.service_id);
    }

    return savedStep;
  }

  async concludeStep(id: number, userId: number): Promise<Step> {
    // First, find the step by ID
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can conclude the step
    if (step.responsable_id !== userId) {
      throw new BadRequestException('Only the responsable assigned to this step can conclude it');
    }

    if (step.status !== StepStatus.IN_PROGRESS) {
      throw new BadRequestException('Step can only be concluded if it is in progress');
    }

    step.status = StepStatus.CONCLUDED;
    step.datetime_conclusion = new Date();

    const savedStep = await this.stepsRepository.save(step);

    // Update service status if step has service_id
    if (step.service_id) {
      await this.servicesService.updateServiceStatus(step.service_id);
    }

    return savedStep;
  }

  async cancelStep(id: number, userId: number, reason: string): Promise<Step> {
    // First, find the step by ID
    const step = await this.stepsRepository.findOne({
      where: { id },
      relations: ['service', 'service.client', 'category', 'responsable', 'images'],
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    // Explicit validation: only the responsable can cancel the step
    if (step.responsable_id !== userId) {
      throw new BadRequestException('Only the responsable assigned to this step can cancel it');
    }

    if (step.status === StepStatus.CONCLUDED) {
      throw new BadRequestException('Cannot cancel a concluded step');
    }

    step.status = StepStatus.CANCELLED;
    step.reason_cancellament = reason;

    const savedStep = await this.stepsRepository.save(step);

    // Update service status if step has service_id
    if (step.service_id) {
      await this.servicesService.updateServiceStatus(step.service_id);
    }

    return savedStep;
  }
}

