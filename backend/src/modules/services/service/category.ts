import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Step } from '../entities/step.entity';
import { StepChecklist } from '../entities/step-checklist.entity';
import { Service } from '../entities/service.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Step)
    private stepRepository: Repository<Step>,
    @InjectRepository(StepChecklist)
    private checklistRepository: Repository<StepChecklist>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { steps, ...categoryData } = createCategoryDto;
    const category = this.categoryRepository.create(categoryData);
    const savedCategory = await this.categoryRepository.save(category);

    // Create steps if provided
    if (steps && steps.length > 0) {
      const stepEntities = steps.map(stepTemplate => 
        this.stepRepository.create({
          name: stepTemplate.name,
          description: stepTemplate.description,
          observation: stepTemplate.observation,
          responsable_client: stepTemplate.responsable_client,
          category_id: savedCategory.id,
        })
      );
      const savedSteps = await this.stepRepository.save(stepEntities);

      // Create checklists for steps
      for (let i = 0; i < savedSteps.length; i++) {
        const stepTemplate = steps[i];
        if (stepTemplate.checklist_descriptions && stepTemplate.checklist_descriptions.length > 0) {
          const checklists = stepTemplate.checklist_descriptions.map(desc =>
            this.checklistRepository.create({
              description: desc,
              completed: false,
              step_id: savedSteps[i].id,
            })
          );
          await this.checklistRepository.save(checklists);
        }
      }
    }

    // Return category with steps
    return this.categoryRepository.findOne({
      where: { id: savedCategory.id },
      relations: ['steps', 'steps.checklists'],
    });
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if there are services using this category
    const servicesCount = await this.serviceRepository.count({
      where: { category_id: id },
    });

    if (servicesCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir a categoria "${category.name}" pois existem ${servicesCount} serviço(s) associado(s) a ela. Remova ou altere os serviços antes de excluir a categoria.`
      );
    }

    // Delete the category (steps will be deleted automatically due to CASCADE)
    await this.categoryRepository.delete(id);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['steps', 'steps.checklists'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    return this.categoryRepository.findOne({ 
      where: { id },
      relations: ['steps', 'steps.checklists'],
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const { steps, ...categoryData } = updateCategoryDto;
    const category = await this.categoryRepository.findOne({ where: { id }, relations: ['steps'] });
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update category data
    Object.assign(category, categoryData);
    await this.categoryRepository.save(category);

    // Update steps if provided
    if (steps !== undefined) {
      // Delete existing steps for this category
      if (category.steps && category.steps.length > 0) {
        await this.stepRepository.remove(category.steps);
      }

      // Create new steps
      if (steps.length > 0) {
        const stepEntities = steps.map(stepTemplate => 
          this.stepRepository.create({
            name: stepTemplate.name,
            description: stepTemplate.description,
            observation: stepTemplate.observation,
            responsable_client: stepTemplate.responsable_client,
            category_id: category.id,
          })
        );
        const savedSteps = await this.stepRepository.save(stepEntities);

        // Create checklists for steps
        for (let i = 0; i < savedSteps.length; i++) {
          const stepTemplate = steps[i];
          if (stepTemplate.checklist_descriptions && stepTemplate.checklist_descriptions.length > 0) {
            const checklists = stepTemplate.checklist_descriptions.map(desc =>
              this.checklistRepository.create({
                description: desc,
                completed: false,
                step_id: savedSteps[i].id,
              })
            );
            await this.checklistRepository.save(checklists);
          }
        }
      }
    }

    // Return category with updated steps
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['steps', 'steps.checklists'],
    });
  }
}