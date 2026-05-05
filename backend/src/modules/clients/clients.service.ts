import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, QueryFailedError, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Service } from '../services/entities/service.entity';

export interface ClientsPaginationResult {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

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
    try {
      return await this.clientsRepository.save(client);
    } catch (err) {
      this.rethrowIfDuplicateClient(err);
    }
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllPaginated(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ClientsPaginationResult> {
    const page = Math.max(params?.page ?? 1, 1);
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const search = params?.search?.trim();

    const qb = this.clientsRepository
      .createQueryBuilder('client')
      .orderBy('client.name', 'ASC')
      .addOrderBy('client.id', 'ASC');

    if (search) {
      qb.andWhere('client.name LIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
    };
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
    try {
      return await this.clientsRepository.save(client);
    } catch (err) {
      this.rethrowIfDuplicateClient(err);
    }
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
  }

  /**
   * Maps MySQL duplicate key on unique indexes (cpf, cnpj, email) to a clear 400 message.
   * Index names match InitialSchema migration on `clients`.
   */
  private rethrowIfDuplicateClient(err: unknown): never {
    if (!(err instanceof QueryFailedError)) {
      throw err;
    }
    const driverError = (
      err as QueryFailedError & {
        driverError?: { errno?: number; code?: string };
      }
    ).driverError;
    const isDup =
      driverError?.errno === 1062 || driverError?.code === 'ER_DUP_ENTRY';
    if (!isDup) {
      throw err;
    }
    const full = err.message;
    const keyMatch = full.match(/for key ['`]([^'`]+)['`]/);
    const keyRef = keyMatch?.[1] ?? '';
    // UNIQUE (`cpf`)
    if (keyRef.includes('IDX_4245ac34add1ceeb505efc9877')) {
      throw new BadRequestException(
        'Este CPF já está cadastrado para outro cliente.',
      );
    }
    // UNIQUE (`cnpj`)
    if (keyRef.includes('IDX_c2528f5ea78df3e939950b861c')) {
      throw new BadRequestException(
        'Este CNPJ já está cadastrado para outro cliente.',
      );
    }
    // UNIQUE (`email`)
    if (keyRef.includes('IDX_b48860677afe62cd96e1265948')) {
      throw new BadRequestException(
        'Este e-mail já está cadastrado para outro cliente.',
      );
    }
    throw new BadRequestException(
      'Já existe um cadastro com este dado. Verifique CPF, CNPJ ou e-mail.',
    );
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
