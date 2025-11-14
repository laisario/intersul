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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { StepService } from '../service/step';
import { UpdateStepDto } from '../dto/update-step.dto';
import { Step } from '../entities/step.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { ImageService } from '../../common/services/image.service';
import { Image } from '../../common/entities/image.entity';

@ApiTags('Steps')
@Controller('steps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StepController {
  constructor(
    private readonly stepService: StepService,
    private readonly imageService: ImageService,
  ) {}

  @Get('my-steps')
  @ApiOperation({ summary: 'Get all steps assigned to current user' })
  @ApiQuery({ name: 'filter', required: false, enum: ['created_today', 'expires_today'], description: 'Filter steps by date' })
  @ApiResponse({ status: 200, description: 'List of steps returned successfully', type: [Step] })
  async findMySteps(
    @CurrentUser() user: CurrentUserData,
    @Query('filter') filter?: 'created_today' | 'expires_today',
  ): Promise<Step[]> {
    return this.stepService.findMySteps(user.id, filter);
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
  @ApiResponse({ status: 200, description: 'Step updated successfully', type: Step })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
    @Body() updateStepDto: UpdateStepDto,
  ): Promise<Step> {
    return this.stepService.update(id, user.id, updateStepDto);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a step (change status from PENDING to IN_PROGRESS)' })
  @ApiResponse({ status: 200, description: 'Step started successfully', type: Step })
  @ApiResponse({ status: 400, description: 'Step cannot be started' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async startStep(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Step> {
    return this.stepService.startStep(id, user.id);
  }

  @Patch(':id/conclude')
  @ApiOperation({ summary: 'Conclude a step (change status from IN_PROGRESS to CONCLUDED)' })
  @ApiResponse({ status: 200, description: 'Step concluded successfully', type: Step })
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
  @ApiResponse({ status: 200, description: 'Step cancelled successfully', type: Step })
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
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', type: Image })
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
    if (step.responsable_id !== user.id) {
      throw new BadRequestException('Only the responsable can upload images to this step');
    }

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = './uploads/steps';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save image path to database
    const imagePath = `/uploads/steps/${fileName}`;
    return this.imageService.create(imagePath, id);
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get all images for a step' })
  @ApiResponse({ status: 200, description: 'List of images returned successfully', type: [Image] })
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
    if (step.responsable_id !== user.id) {
      throw new BadRequestException('Only the responsable can delete images from this step');
    }

    // Get image to verify it belongs to the step
    const images = await this.imageService.findByStepId(id);
    const image = images.find(img => img.id === imageId);

    if (!image) {
      throw new BadRequestException('Image not found or does not belong to this step');
    }

    // Delete file from disk
    const filePath = `.${image.path}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.imageService.remove(imageId);
  }
}

