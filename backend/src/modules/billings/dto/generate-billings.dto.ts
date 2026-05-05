import {
  IsNumber,
  IsObject,
  ValidateNested,
  IsOptional,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MachineUserMapping {
  @ApiProperty({
    example: 1,
    description: 'Client copy machine ID',
  })
  @Type(() => Number)
  @IsNumber()
  copy_machine_id: number;

  @ApiProperty({
    example: 1,
    description: 'Responsible user ID',
  })
  @Type(() => Number)
  @IsNumber()
  responsible_user_id: number;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Step expiration date (optional)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  datetime_expiration?: string;

  @ApiProperty({
    example: 12345,
    description:
      'Previous counter at the moment of billing generation (optional)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  previous_counter?: number;

  @ApiProperty({
    example: 'PIX',
    description: 'Payment method (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  payment_method?: string;

  @ApiProperty({
    example: false,
    description:
      'Whether billing has been invoiced/payment completed (optional)',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_invoiced?: boolean;

  @ApiProperty({
    example: 1,
    description:
      'User ID responsible for boleto billing service (only when payment_method is Boleto)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  boleto_service_responsible_user_id?: number;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description:
      'Expiration date for boleto billing service (only when payment_method is Boleto)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  boleto_service_expiration_date?: string;
}

export class GenerateBillingsDto {
  @ApiProperty({
    example: 1,
    description: 'City ID',
  })
  @Type(() => Number)
  @IsNumber()
  city_id: number;

  @ApiProperty({
    example: [
      { copy_machine_id: 1, responsible_user_id: 2 },
      { copy_machine_id: 2, responsible_user_id: 3 },
    ],
    description: 'Mapping of machines to responsible users',
    type: [MachineUserMapping],
  })
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => MachineUserMapping)
  machines: MachineUserMapping[];
}
