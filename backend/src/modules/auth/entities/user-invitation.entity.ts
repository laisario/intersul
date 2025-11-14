import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from './user.entity';

@Entity('user_invitations')
export class UserInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @ManyToOne(() => User, (user) => user.invitationsCreated, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column()
  created_by_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

