import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ClientCopyMachine } from './client-copy-machine.entity';

@Entity('franchises')
export class Franchise {
  @ApiProperty({
    example: 1,
    description: 'Franchise unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: '12 months',
    description: 'Rental period',
  })
  @Column({ length: 50 })
  period: string;

  @ApiProperty({
    example: 'A4',
    description: 'Paper size/type',
  })
  @Column({ length: 20 })
  paper_type: string;

  @ApiProperty({
    example: true,
    description: 'Color printing capability',
  })
  @Column({ default: false })
  color: boolean;

  @ApiProperty({
    example: 1000,
    description: 'Quantity of pages/copies included',
  })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({
    example: 0.05,
    description: 'Price per unit (page/copy)',
  })
  @Column({ type: 'decimal', precision: 10, scale: 4 })
  unit_price: number;

  @ApiProperty({
    example: '2024-01-15T00:00:00.000Z',
    description: 'Franchise creation date',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: '2024-01-15T00:00:00.000Z',
    description: 'Franchise last update date',
  })
  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => ClientCopyMachine, (clientCopyMachine) => clientCopyMachine.franchise)
  clientCopyMachines: ClientCopyMachine[];
}
