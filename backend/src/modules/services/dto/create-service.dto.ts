import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { CreateStepDto } from './create-step.dto';
import { ServiceStatus } from '../../../common/enums/service-status.enum';

export class CreateServiceDto {
  @ApiProperty({
    example: 1,
    description: 'Client ID',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'client_id must be a number' })
  client_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Category ID',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'category_id must be a number' })
  category_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Client Copy Machine ID (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  client_copy_machine_id?: number;

  @ApiProperty({
    example: 'Service description',
    description: 'Service description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'HIGH',
    description: 'Service priority (e.g., LOW, MEDIUM, HIGH, URGENT)',
    required: false,
  })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Service status',
    enum: ServiceStatus,
    required: false,
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiProperty({
    example: 'Reason for cancellation',
    description: 'Reason for service cancellation',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason_cancellament?: string;

  @ApiProperty({
    description: 'Steps associated with this service',
    type: [CreateStepDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  @IsOptional()
  steps?: CreateStepDto[];
}
