import { Controller, Get, Delete, Patch, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user';
import { UserRole } from '../../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (defaults to active users only)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status (overrides default)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive users (admin only, for list views)' })
  @ApiResponse({ status: 200, description: 'Users returned successfully', type: [User] })
  async findAll(
    @Query('role') role?: UserRole,
    @Query('active') active?: string | boolean,
    @Query('includeInactive') includeInactive?: string | boolean,
  ): Promise<User[]> {
    let activeFilter: boolean | undefined;
    if (active !== undefined) {
      if (typeof active === 'boolean') {
        activeFilter = active;
      } else {
        activeFilter = active === 'true' || active === '1';
      }
    }
    
    let includeInactiveFilter = false;
    if (includeInactive !== undefined) {
      if (typeof includeInactive === 'boolean') {
        includeInactiveFilter = includeInactive;
      } else {
        includeInactiveFilter = includeInactive === 'true' || includeInactive === '1';
      }
    }
    
    return this.userService.findAll({ role, active: activeFilter, includeInactive: includeInactiveFilter });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics returned successfully' })
  async getStats() {
    return this.userService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User active status toggled successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }
}
