import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StepChecklist } from '../entities/step-checklist.entity';
import {
  CreateStepChecklistDto,
  UpdateStepChecklistDto,
} from '../dto/step-checklist.dto';
import { StepService } from './step';
import { StepStatus } from '../../../common/enums/step-status.enum';
import { Step } from '../entities/step.entity';

@Injectable()
export class StepChecklistService {
  constructor(
    @InjectRepository(StepChecklist)
    private checklistRepository: Repository<StepChecklist>,
    @InjectRepository(Step)
    private stepRepository: Repository<Step>,
    private stepService: StepService,
  ) {}

  async findByStepId(stepId: number): Promise<StepChecklist[]> {
    return this.checklistRepository.find({
      where: { step_id: stepId },
      order: { created_at: 'ASC' },
    });
  }

  async create(
    stepId: number,
    dto: CreateStepChecklistDto,
    userId: number,
  ): Promise<StepChecklist> {
    const step = await this.stepService.findOne(stepId, userId);

    const checklist = this.checklistRepository.create({
      description: dto.description,
      completed: dto.completed || false,
      step_id: stepId,
    });

    return this.checklistRepository.save(checklist);
  }

  async createBulk(
    stepId: number,
    descriptions: string[],
    userId: number,
  ): Promise<StepChecklist[]> {
    const step = await this.stepService.findOne(stepId, userId);

    const checklists = descriptions.map((desc) =>
      this.checklistRepository.create({
        description: desc,
        completed: false,
        step_id: stepId,
      }),
    );

    return this.checklistRepository.save(checklists);
  }

  async update(
    id: number,
    dto: UpdateStepChecklistDto,
    userId: number,
  ): Promise<StepChecklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['step'],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist item not found');
    }

    if (dto.description !== undefined) {
      checklist.description = dto.description;
    }
    if (dto.completed !== undefined) {
      checklist.completed = dto.completed;
    }

    return this.checklistRepository.save(checklist);
  }

  async toggleComplete(id: number, userId: number): Promise<StepChecklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['step'],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist item not found');
    }

    checklist.completed = !checklist.completed;
    const savedChecklist = await this.checklistRepository.save(checklist);

    // If checklist was just checked and step is still PENDING, start the step
    if (
      checklist.completed &&
      checklist.step &&
      checklist.step.status === StepStatus.PENDING
    ) {
      checklist.step.status = StepStatus.IN_PROGRESS;
      await this.stepRepository.save(checklist.step);
      (savedChecklist as any).step = checklist.step;
    }

    return savedChecklist;
  }

  async delete(id: number, userId: number): Promise<void> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['step'],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist item not found');
    }

    await this.checklistRepository.remove(checklist);
  }

  async deleteAllByStepId(stepId: number, userId: number): Promise<void> {
    const step = await this.stepService.findOne(stepId, userId);
    await this.checklistRepository.delete({ step_id: stepId });
  }
}
