import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { jwtConfig } from '../../../config/jwt.config';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
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

    const byRole = Object.values(UserRole).reduce((acc, role, index) => {
      acc[role] = roleCounts[index] ?? 0;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      total,
      active,
      inactive: total - active,
      byRole,
      newThisMonth,
    };
  }
}
