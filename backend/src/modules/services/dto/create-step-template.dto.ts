import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStepTemplateDto {
  @ApiProperty({
    example: 'Initial Assessment',
    description: 'Step name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Evaluate the machine condition',
    description: 'Step additional information',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Check all components thoroughly',
    description: 'Step observation/notes',
  })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Client contact person responsible for this step',
  })
  @IsString()
  @IsOptional()
  responsable_client?: string;

  @ApiPropertyOptional({
    description: 'Checklist item descriptions',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  checklist_descriptions?: string[];
}
