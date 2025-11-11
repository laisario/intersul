import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { City } from './city.entity';
import { Address } from './address.entity';

@Entity('neighborhoods')
@Index(['name', 'city_id'], { unique: true })
export class Neighborhood {
  @ApiProperty({
    example: 1,
    description: 'Neighborhood unique identifier',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Centro',
    description: 'Neighborhood name',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'City ID',
  })
  @Column()
  city_id: number;

  @ManyToOne(() => City, city => city.neighborhoods, { eager: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  @OneToMany(() => Address, address => address.neighborhood)
  addresses: Address[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

