import { IsNumber, IsOptional, IsString, IsDateString, IsDecimal, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateBillingDto {
  @ApiProperty({
    example: 1,
    description: 'Client copy machine ID',
  })
  @Type(() => Number)
  @IsNumber()
  copy_machine_id: number;

  @ApiProperty({
    example: 1,
    description: 'Client ID',
  })
  @Type(() => Number)
  @IsNumber()
  client_id: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Billing date',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 1000,
    description: 'Previous counter value',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  previous_counter?: number;

  @ApiProperty({
    example: 1500,
    description: 'Current counter value',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  current_counter?: number;

  @ApiProperty({
    example: 'PIX',
    description: 'Payment method',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({
    example: 100.00,
    description: 'Amount to receive',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  amount_to_receive: number;

  @ApiProperty({
    example: 1,
    description: 'Responsible user ID',
  })
  @Type(() => Number)
  @IsNumber()
  responsible_user_id: number;

  @ApiProperty({
    example: 1,
    description: 'Step ID (if associated)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  step_id?: number;

  @ApiProperty({
    example: false,
    description: 'Whether the billing has been invoiced/payment completed',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_invoiced?: boolean;
}

