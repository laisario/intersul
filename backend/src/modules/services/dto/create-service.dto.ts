import { IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateStepDto } from './create-step.dto';

export class CreateServiceDto {
  @ApiProperty({
    example: 1,
    description: 'Client ID',
  })
  @IsNumber()
  client_id: number;

  @ApiProperty({
    example: 1,
    description: 'Category ID',
  })
  @IsNumber()
  category_id: number;

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
