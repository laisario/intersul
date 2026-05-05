import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStepChecklistDto {
  @ApiProperty({ description: 'Checklist item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Whether the item is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class UpdateStepChecklistDto {
  @ApiPropertyOptional({ description: 'Checklist item description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the item is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class BulkCreateStepChecklistDto {
  @ApiProperty({ description: 'Array of checklist item descriptions' })
  @IsString({ each: true })
  @IsNotEmpty()
  descriptions: string[];
}
