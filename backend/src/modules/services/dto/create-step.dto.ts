import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StepStatus } from '../../../common/enums/step-status.enum';

export class CreateStepDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsDateString()
  @IsOptional()
  datetime_start?: string;

  @IsDateString()
  @IsOptional()
  datetime_conclusion?: string;

  @IsDateString()
  @IsOptional()
  datetime_expiration?: string;

  @IsEnum(StepStatus)
  @IsOptional()
  status?: StepStatus;

  @IsNumber()
  @IsOptional()
  responsable_id?: number | null;

  @IsString()
  @IsOptional()
  responsable_client?: string;

  @IsString()
  @IsOptional()
  reason_cancellament?: string;

  @IsNumber()
  @IsOptional()
  service_id?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  checklist_descriptions?: string[];
}
