import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientsRepository.create(createClientDto);
    return this.clientsRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return this.clientsRepository.save(client);
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
  }

  async toggleActive(id: number): Promise<Client> {
    const client = await this.findOne(id);
    client.active = !client.active;
    return this.clientsRepository.save(client);
  }

  async getStats(): Promise<{
    total: number;
    newThisMonth: number;
    servicesThisMonth: number;
  }> {
    const total = await this.clientsRepository.count();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newThisMonth, servicesThisMonth] = await Promise.all([
      this.clientsRepository.count({
        where: {
          created_at: Between(startOfMonth, now),
        },
      }),
      this.servicesRepository.count({
        where: {
          created_at: Between(startOfMonth, now),
        },
      }),
    ]);

    return {
      total,
      newThisMonth,
      servicesThisMonth,
    };
  }
}
