import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import * as path from 'path';
import { StepService } from '../service/step';
import { StepChecklistService } from '../service/step-checklist';
import { UpdateStepDto } from '../dto/update-step.dto';
import { Step } from '../entities/step.entity';
import { StepChecklist } from '../entities/step-checklist.entity';
import {
  CreateStepChecklistDto,
  UpdateStepChecklistDto,
  BulkCreateStepChecklistDto,
} from '../dto/step-checklist.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';
import { ImageService } from '../../common/services/image.service';
import { StorageService } from '../../common/services/storage.service';
import { Image } from '../../common/entities/image.entity';

@ApiTags('Steps')
@Controller('steps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StepController {
  constructor(
    private readonly stepService: StepService,
    private readonly stepChecklistService: StepChecklistService,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
  ) {}

  @Get('my-steps')
  @ApiOperation({ summary: 'Get all steps assigned to current user' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['created_today', 'expires_today', 'expired'],
    description: 'Filter steps by date',
  })
  @ApiResponse({
    status: 200,
    description: 'List of steps returned successfully',
    type: [Step],
  })
  async findMySteps(
    @CurrentUser() user: CurrentUserData,
    @Query('filter') filter?: 'created_today' | 'expires_today' | 'expired',
  ): Promise<Step[]> {
    return this.stepService.findMySteps(user.id, filter);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all steps assigned to a specific user (for admins/managers)',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['created_today', 'expires_today', 'expired'],
    description: 'Filter steps by date',
  })
  @ApiResponse({
    status: 200,
    description: 'List of steps returned successfully',
    type: [Step],
  })
  async findStepsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('filter') filter?: 'created_today' | 'expires_today' | 'expired',
  ): Promise<Step[]> {
    return this.stepService.findStepsByUserId(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get step by ID' })
  @ApiResponse({ status: 200, description: 'Step found', type: Step })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Step> {
    return this.stepService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update step' })
  @ApiResponse({
    status: 200,
    description: 'Step updated successfully',
    type: Step,
  })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @Body() updateStepDto: UpdateStepDto,
  ): Promise<Step> {
    return this.stepService.update(id, user.id, updateStepDto, user.role);
  }

  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start a step (change status from PENDING to IN_PROGRESS)',
  })
  @ApiResponse({
    status: 200,
    description: 'Step started successfully',
    type: Step,
  })
  @ApiResponse({ status: 400, description: 'Step cannot be started' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async startStep(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Step> {
    return this.stepService.startStep(id, user.id);
  }

  @Patch(':id/conclude')
  @ApiOperation({
    summary: 'Conclude a step (change status from IN_PROGRESS to CONCLUDED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Step concluded successfully',
    type: Step,
  })
  @ApiResponse({ status: 400, description: 'Step cannot be concluded' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async concludeStep(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Step> {
    return this.stepService.concludeStep(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a step (change status to CANCELLED)' })
  @ApiResponse({
    status: 200,
    description: 'Step cancelled successfully',
    type: Step,
  })
  @ApiResponse({ status: 400, description: 'Step cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async cancelStep(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { reason: string },
  ): Promise<Step> {
    if (!body.reason) {
      throw new BadRequestException('Reason for cancellation is required');
    }
    return this.stepService.cancelStep(id, user.id, body.reason);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload an image for a step' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: Image,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Image> {
    // Verify step exists and user is the responsable (for write operations)
    const step = await this.stepService.findOne(id, user.id);
    // Additional check: user must be the responsable to upload images
    if (step.responsable?.id !== user.id) {
      throw new BadRequestException(
        'Only the responsable can upload images to this step',
      );
    }

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

    // Upload file to R2 storage
    const imageUrl = await this.storageService.uploadFile(
      file.buffer,
      fileName,
      'steps',
      file.mimetype,
    );

    // Save image URL to database
    return this.imageService.create(imageUrl, id);
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get all images for a step' })
  @ApiResponse({
    status: 200,
    description: 'List of images returned successfully',
    type: [Image],
  })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async getImages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Image[]> {
    // Verify step exists and user has access
    await this.stepService.findOne(id, user.id);
    return this.imageService.findByStepId(id);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete an image from a step' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Step or image not found' })
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    // Verify step exists and user is the responsable (for write operations)
    const step = await this.stepService.findOne(id, user.id);
    // Additional check: user must be the responsable to delete images
    if (step.responsable?.id !== user.id) {
      throw new BadRequestException(
        'Only the responsable can delete images from this step',
      );
    }

    // Get image to verify it belongs to the step
    const images = await this.imageService.findByStepId(id);
    const image = images.find((img) => img.id === imageId);

    if (!image) {
      throw new BadRequestException(
        'Image not found or does not belong to this step',
      );
    }

    // Delete file from R2 storage
    // Extract the key from the URL (e.g., 'steps/filename.jpg')
    const key = this.storageService.extractKeyFromUrl(image.path);
    if (key) {
      try {
        await this.storageService.deleteFile(key);
      } catch (error) {
        // Log error but don't fail if file doesn't exist in R2
        console.error(`Failed to delete file from R2: ${error.message}`);
      }
    }

    // Delete from database
    await this.imageService.remove(imageId);
  }

  @Get(':id/checklists')
  @ApiOperation({ summary: 'Get all checklist items for a step' })
  @ApiResponse({
    status: 200,
    description: 'Checklist items returned successfully',
    type: [StepChecklist],
  })
  async getChecklists(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<StepChecklist[]> {
    await this.stepService.findOne(id, user.id);
    return this.stepChecklistService.findByStepId(id);
  }

  @Post(':id/checklists')
  @ApiOperation({ summary: 'Create a checklist item for a step' })
  @ApiResponse({
    status: 201,
    description: 'Checklist item created successfully',
    type: StepChecklist,
  })
  async createChecklist(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateStepChecklistDto,
  ): Promise<StepChecklist> {
    await this.stepService.findOne(id, user.id);
    return this.stepChecklistService.create(id, dto, user.id);
  }

  @Post(':id/checklists/bulk')
  @ApiOperation({ summary: 'Create multiple checklist items for a step' })
  @ApiResponse({
    status: 201,
    description: 'Checklist items created successfully',
    type: [StepChecklist],
  })
  async createChecklistsBulk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: BulkCreateStepChecklistDto,
  ): Promise<StepChecklist[]> {
    await this.stepService.findOne(id, user.id);
    return this.stepChecklistService.createBulk(id, dto.descriptions, user.id);
  }

  @Patch('checklists/:checklistId')
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiResponse({
    status: 200,
    description: 'Checklist item updated successfully',
    type: StepChecklist,
  })
  async updateChecklist(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateStepChecklistDto,
  ): Promise<StepChecklist> {
    return this.stepChecklistService.update(checklistId, dto, user.id);
  }

  @Patch('checklists/:checklistId/toggle')
  @ApiOperation({ summary: 'Toggle checklist item completion status' })
  @ApiResponse({
    status: 200,
    description: 'Checklist item toggled successfully',
    type: StepChecklist,
  })
  async toggleChecklist(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<StepChecklist> {
    return this.stepChecklistService.toggleComplete(checklistId, user.id);
  }

  @Delete('checklists/:checklistId')
  @ApiOperation({ summary: 'Delete a checklist item' })
  @ApiResponse({
    status: 200,
    description: 'Checklist item deleted successfully',
  })
  async deleteChecklist(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.stepChecklistService.delete(checklistId, user.id);
  }

  @Delete(':id/checklists')
  @ApiOperation({ summary: 'Delete all checklist items for a step' })
  @ApiResponse({
    status: 200,
    description: 'All checklist items deleted successfully',
  })
  async deleteAllChecklists(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.stepChecklistService.deleteAllByStepId(id, user.id);
  }
}
