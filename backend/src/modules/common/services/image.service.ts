import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../entities/image.entity';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  async create(path: string, stepId: number): Promise<Image> {
    const image = this.imageRepository.create({
      path,
      step_id: stepId,
    });
    return this.imageRepository.save(image);
  }

  async findByStepId(stepId: number): Promise<Image[]> {
    return this.imageRepository.find({
      where: { step_id: stepId },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: number): Promise<void> {
    await this.imageRepository.delete(id);
  }

  async removeByStepId(stepId: number): Promise<void> {
    await this.imageRepository.delete({ step_id: stepId });
  }
}

