import { Controller, Get, UseGuards, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics returned successfully',
  })
  async getStats(@Query('force') force?: string) {
    const forceRecalculate = force === 'true';
    return this.dashboardService.getStats(forceRecalculate);
  }

  @Get('stats/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all cached dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All cached statistics returned successfully',
  })
  async getAllStats() {
    return this.dashboardService.getAllCachedStats();
  }

  @Get('stats/:year/:month')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics for specific month (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics for the specified month returned successfully',
  })
  async getStatsForMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dashboardService.getStatsForMonth(year, month);
  }
}

