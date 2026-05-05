import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';
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

  @ApiProperty({
    example: false,
    description: 'Whether this is an internal service',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_internal?: boolean;

  @ApiProperty({
    example: true,
    description:
      'When false (external service), no payment step is created and payment fields are cleared. When omitted on create, inferred from amount_to_receive / payment_method for backward compatibility.',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  has_payment?: boolean;

  @ApiProperty({
    example: 100.0,
    description: 'Amount to receive (optional for external services)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'amount_to_receive must be a number' })
  @Min(0, { message: 'amount_to_receive must be a positive number' })
  amount_to_receive?: number;

  @ApiProperty({
    example: 'PIX',
    description: 'Payment method (optional for external services)',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({
    example: false,
    description:
      'Whether payment has been completed (optional for external services)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  })
  is_invoiced?: boolean;
}
