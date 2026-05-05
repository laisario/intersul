import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { jwtConfig } from '../../../config/jwt.config';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Step } from '../../services/entities/step.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
  ) {}

  async findAll(filters?: {
    role?: UserRole;
    active?: boolean;
    includeInactive?: boolean;
  }): Promise<User[]> {
    const where: any = {};

    if (filters?.role !== undefined) {
      where.role = filters.role;
    }

    // Default to active=true unless includeInactive=true is explicitly set
    // If active is explicitly set, use that value; otherwise default to true unless includeInactive
    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else if (filters?.includeInactive !== true) {
      // Default to active users only unless includeInactive is explicitly true
      where.active = true;
    }
    // If includeInactive is true and active is not set, don't filter by active (show all)

    return this.usersRepository.find({ where });
  }

  /**
   * Find active users only - convenience method for selects
   */
  async findActiveUsers(filters?: { role?: UserRole }): Promise<User[]> {
    return this.findAll({ ...filters, active: true });
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    newThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, newThisMonth, roleCounts] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { active: true } }),
      this.usersRepository.count({
        where: {
          created_at: Between(startOfMonth, now),
        },
      }),
      Promise.all(
        Object.values(UserRole).map((role) =>
          this.usersRepository.count({
            where: { role },
          }),
        ),
      ),
    ]);

    const byRole = Object.values(UserRole).reduce(
      (acc, role, index) => {
        acc[role] = roleCounts[index] ?? 0;
        return acc;
      },
      {} as Record<UserRole, number>,
    );

    return {
      total,
      active,
      inactive: total - active,
      byRole,
      newThisMonth,
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.active = !user.active;
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Set responsable_id to NULL in all steps that reference this user
    // This prevents foreign key constraint errors
    await this.stepsRepository.update(
      { responsable: { id } },
      { responsable: null },
    );

    await this.usersRepository.remove(user);
  }
}
