import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('dashboard_stats')
@Unique(['year', 'month'])
export class DashboardStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number; // 1-12

  // Clients stats
  @Column({ type: 'int', default: 0 })
  clients_total: number;

  @Column({ type: 'int', default: 0 })
  clients_new_this_month: number;

  // Services stats
  @Column({ type: 'int', default: 0 })
  services_total: number;

  @Column({ type: 'int', default: 0 })
  services_pending: number;

  @Column({ type: 'int', default: 0 })
  services_in_progress: number;

  @Column({ type: 'int', default: 0 })
  services_completed: number;

  @Column({ type: 'int', default: 0 })
  services_cancelled: number;

  @Column({ type: 'int', default: 0 })
  services_this_week: number;

  @Column({ type: 'int', default: 0 })
  services_this_month: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

