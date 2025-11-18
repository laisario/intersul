import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/service/services';
import { DashboardStats } from './entities/dashboard-stats.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardStats)
    private readonly statsRepository: Repository<DashboardStats>,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
  ) {}

  /**
   * Get dashboard stats for current month
   * Returns cached data if available, otherwise calculates and caches
   */
  async getStats(forceRecalculate: boolean = false) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    // Try to get cached stats for current month
    if (!forceRecalculate) {
      const cachedStats = await this.statsRepository.findOne({
        where: { year, month },
      });

      if (cachedStats) {
        return this.mapEntityToResponse(cachedStats);
      }
    }

    // Calculate fresh stats
    const [clients, services] = await Promise.all([
      this.clientsService.getStats(),
      this.servicesService.getStats(),
    ]);

    const statsData = {
      clients: {
        total: clients.total,
        newThisMonth: clients.newThisMonth,
      },
      services: {
        total: services.total,
        pending: services.pending,
        inProgress: services.inProgress,
        completed: services.completed,
        cancelled: services.cancelled,
        thisWeek: services.thisWeek,
        thisMonth: services.thisMonth,
      },
    };

    // Save to cache (upsert)
    await this.statsRepository.upsert(
      {
        year,
        month,
        clients_total: statsData.clients.total,
        clients_new_this_month: statsData.clients.newThisMonth,
        services_total: statsData.services.total,
        services_pending: statsData.services.pending,
        services_in_progress: statsData.services.inProgress,
        services_completed: statsData.services.completed,
        services_cancelled: statsData.services.cancelled,
        services_this_week: statsData.services.thisWeek,
        services_this_month: statsData.services.thisMonth,
      },
      ['year', 'month'],
    );

    return statsData;
  }

  /**
   * Get historical stats for a specific month/year
   */
  async getStatsForMonth(year: number, month: number) {
    const stats = await this.statsRepository.findOne({
      where: { year, month },
    });

    if (!stats) {
      return null;
    }

    return this.mapEntityToResponse(stats);
  }

  /**
   * Get all cached stats (for analytics/reporting)
   */
  async getAllCachedStats() {
    const stats = await this.statsRepository.find({
      order: { year: 'DESC', month: 'DESC' },
    });

    return stats.map((stat) => this.mapEntityToResponse(stat));
  }

  /**
   * Map entity to API response format
   */
  private mapEntityToResponse(entity: DashboardStats) {
    return {
      clients: {
        total: entity.clients_total,
        newThisMonth: entity.clients_new_this_month,
      },
      services: {
        total: entity.services_total,
        pending: entity.services_pending,
        inProgress: entity.services_in_progress,
        completed: entity.services_completed,
        cancelled: entity.services_cancelled,
        thisWeek: entity.services_this_week,
        thisMonth: entity.services_this_month,
      },
    };
  }
}

