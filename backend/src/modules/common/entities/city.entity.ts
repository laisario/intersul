import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { State } from './state.entity';
import { Neighborhood } from './neighborhood.entity';

@Entity('cities')
@Index(['name', 'state_id'], { unique: true })
export class City {
  @ApiProperty({
    example: 1,
    description: 'City unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'São Paulo',
    description: 'City name',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'State ID',
  })
  @Column()
  state_id: number;

  @ManyToOne(() => State, state => state.cities, { eager: true })
  @JoinColumn({ name: 'state_id' })
  state: State;

  @OneToMany(() => Neighborhood, neighborhood => neighborhood.city)
  neighborhoods: Neighborhood[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

