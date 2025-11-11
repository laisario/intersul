import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from './country.entity';
import { City } from './city.entity';

@Entity('states')
@Index(['code', 'country_id'], { unique: true })
export class State {
  @ApiProperty({
    example: 1,
    description: 'State unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'SP',
    description: 'State abbreviation (2 characters)',
  })
  @Column({ length: 2 })
  code: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'State full name',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Country ID',
  })
  @Column()
  country_id: number;

  @ManyToOne(() => Country, country => country.states, { eager: true })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => City, city => city.state)
  cities: City[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

