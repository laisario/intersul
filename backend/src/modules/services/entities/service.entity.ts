import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { Category } from './category.entity';
import { Step } from './step.entity';
import { ServiceStatus } from '../../../common/enums/service-status.enum';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  client_id: number;

  @Column({ nullable: true })
  category_id: number;

  @Column({ nullable: true })
  client_copy_machine_id: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  priority: string;

  @Column({ type: 'text', nullable: true })
  reason_cancellament: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Client, (client) => client.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Category, (category) => category.services)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => ClientCopyMachine, (clientCopyMachine) => clientCopyMachine.services, { nullable: true })
  @JoinColumn({ name: 'client_copy_machine_id' })
  clientCopyMachine: ClientCopyMachine;

  @OneToMany(() => Step, (step) => step.service)
  steps: Step[];
}
