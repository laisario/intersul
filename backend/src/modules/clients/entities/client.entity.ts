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
import { Service } from '../../services/entities/service.entity';
import { ClientCopyMachine } from '../../copy-machines/entities/client-copy-machine.entity';
import { Address } from '../../common/entities/address.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  cnpj: string;

  @Column({ unique: true, nullable: true })
  cpf: string;

  @OneToOne(() => Address, { cascade: true, eager: true, nullable: true })
  @JoinColumn()
  address?: Address;

  @Column({ nullable: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Service, (service) => service.client, { onDelete: 'CASCADE' })
  services: Service[];

  @OneToMany(() => ClientCopyMachine, (clientCopyMachine) => clientCopyMachine.client, { onDelete: 'CASCADE' })
  copyMachines: ClientCopyMachine[];
}
