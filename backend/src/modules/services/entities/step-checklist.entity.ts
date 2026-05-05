import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Step } from './step.entity';

@Entity('step_checklists')
export class StepChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  completed: boolean;

  @Column()
  step_id: number;

  @ManyToOne(() => Step, (step) => step.checklists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: Step;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
