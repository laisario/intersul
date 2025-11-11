import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Step } from '../../services/entities/step.entity';
import { UserInvitation } from './user-invitation.entity';
import { Address } from '../../common/entities/address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TECHNICIAN,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  position: string;

  @OneToOne(() => Address, { cascade: true, eager: true, nullable: true })
  @JoinColumn()
  address?: Address;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Step, (step) => step.responsable)
  assignedSteps: Step[];

  @OneToMany(() => UserInvitation, (invitation) => invitation.createdBy)
  invitationsCreated: UserInvitation[];
}
