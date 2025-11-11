import { IsString, IsNumber, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    example: '01310-100',
    description: 'Postal code (CEP)',
  })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido. Use o formato 00000-000' })
  postal_code: string;

  @ApiProperty({
    example: 'Rua das Flores',
    description: 'Street name',
  })
  @IsString()
  @MinLength(2)
  street: string;

  @ApiProperty({
    example: '123',
    description: 'Street number',
  })
  @IsString()
  @MinLength(1)
  number: string;

  @ApiProperty({
    example: 'Apto 45',
    description: 'Address complement (apartment, suite, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    example: 1,
    description: 'Neighborhood ID',
  })
  @IsNumber()
  neighborhood_id: number;
}
