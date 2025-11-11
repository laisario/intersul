import { IsString, IsBoolean, IsNumber, IsDecimal, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFranchiseDto {
  @ApiProperty({
    example: '12 months',
    description: 'Rental period',
  })
  @IsString()
  @MinLength(1)
  period: string;

  @ApiProperty({
    example: 'A4',
    description: 'Paper size/type',
  })
  @IsString()
  @MinLength(1)
  paper_type: string;

  @ApiProperty({
    example: true,
    description: 'Color printing capability',
  })
  @IsBoolean()
  color: boolean;

  @ApiProperty({
    example: 1000,
    description: 'Quantity of pages/copies included',
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 0.05,
    description: 'Price per unit (page/copy)',
  })
  @IsNumber()
  unit_price: number;
}
