import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../auth/entities/user.entity';
import { Step } from '../../services/entities/step.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('billings')
export class Billing {
  @ApiProperty({
    example: 1,
    description: 'Billing unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Client copy machine ID',
  })
  @Column()
  copy_machine_id: number;

  @ApiProperty({
    example: 1,
    description: 'Client ID',
  })
  @Column()
  client_id: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Billing date',
  })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({
    example: 1000,
    description: 'Previous counter value',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  previous_counter: number;

  @ApiProperty({
    example: 1500,
    description: 'Current counter value',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  current_counter: number;

  @ApiProperty({
    example: 'PIX',
    description: 'Payment method',
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string;

  @ApiProperty({
    example: 100.00,
    description: 'Amount to receive',
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount_to_receive: number;

  @ApiProperty({
    example: false,
    description: 'Whether the billing has been invoiced/payment completed',
    required: false,
  })
  @Column({ type: 'boolean', default: false })
  is_invoiced: boolean;

  @ApiProperty({
    example: 1,
    description: 'Responsible user ID',
  })
  @Column()
  responsible_user_id: number;

  @ApiProperty({
    example: 1,
    description: 'Step ID (if associated)',
    required: false,
  })
  @Column({ nullable: true })
  step_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ClientCopyMachine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'copy_machine_id' })
  copyMachine: ClientCopyMachine;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser: User;

  @OneToOne(() => Step, (step) => step.billing, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'step_id' })
  step: Step;
}

