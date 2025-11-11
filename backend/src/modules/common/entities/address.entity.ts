import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Neighborhood } from './neighborhood.entity';

@Entity('addresses')
export class Address {
  @ApiProperty({
    example: 1,
    description: 'Address unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: '01310-100',
    description: 'Postal code (CEP)',
  })
  @Column({ length: 10 })
  postal_code: string;

  @ApiProperty({
    example: 'Rua das Flores',
    description: 'Street name',
  })
  @Column({ length: 200 })
  street: string;

  @ApiProperty({
    example: '123',
    description: 'Street number',
  })
  @Column({ length: 20 })
  number: string;

  @ApiProperty({
    example: 'Apto 45',
    description: 'Address complement (apartment, suite, etc.)',
    required: false,
  })
  @Column({ nullable: true })
  complement?: string;

  @ApiProperty({
    example: 1,
    description: 'Neighborhood ID',
  })
  @Column()
  neighborhood_id: number;

  @ManyToOne(() => Neighborhood, neighborhood => neighborhood.addresses, { eager: true })
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
