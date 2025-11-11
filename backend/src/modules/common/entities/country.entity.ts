import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { State } from './state.entity';

@Entity('countries')
export class Country {
  @ApiProperty({
    example: 1,
    description: 'Country unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Brasil',
    description: 'Country name',
  })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({
    example: 'BR',
    description: 'Country code (ISO 3166-1 alpha-2)',
  })
  @Column({ length: 2, unique: true })
  code: string;

  @OneToMany(() => State, state => state.country)
  states: State[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

