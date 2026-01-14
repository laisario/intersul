import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { StepStatus } from '../../../common/enums/step-status.enum';
import { User } from '../../auth/entities/user.entity';
import { Category } from './category.entity';
import { Service } from './service.entity';
import { Approval } from '../../common/entities/approval.entity';
import { Image } from '../../common/entities/image.entity';
import { Billing } from '../../billings/entities/billing.entity';

@Entity('steps')
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  observation: string;

  @Column({ type: 'timestamp', nullable: true })
  datetime_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  datetime_conclusion: Date;

  @Column({ type: 'timestamp', nullable: true })
  datetime_expiration: Date;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING,
  })
  status: StepStatus;
  
  @Column({ nullable: true })
  responsable_client: string;
  
  @Column({ type: 'text', nullable: true })
  reason_cancellament: string;
  
  @Column({ nullable: true })
  category_id: number;
  
  @Column({ nullable: true })
  service_id: number;
  
  @Column({ default: false })
  is_billing: boolean;
  
  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;
  
  @ManyToOne(() => User, (user) => user.assignedSteps)
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;

  // Getter for backward compatibility with frontend
  get responsable_id(): number | undefined {
    return this.responsable?.id;
  }

  @ManyToOne(() => Category, (category) => category.steps, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Service, (service) => service.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToOne(() => Approval, (approval) => approval.step)
  approval: Approval;

  @OneToMany(() => Image, (image) => image.step)
  images: Image[];

  @OneToOne(() => Billing, (billing) => billing.step)
  billing: Billing;
}
