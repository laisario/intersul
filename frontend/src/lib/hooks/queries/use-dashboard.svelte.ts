/**
 * Dashboard query hooks
 */

import { createQuery } from '@tanstack/svelte-query';
import { useClientStats } from './use-clients.svelte.js';
import { useServiceStats } from './use-services.svelte.js';
import { useUserStats } from './use-users.svelte.js';

export interface DashboardStats {
  clients: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    newThisMonth: number;
  };
  services: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    newThisMonth: number;
  };
  copyMachines: {
    totalMachines: number;
    activeMachines: number;
    maintenanceRequired: number;
    totalClients: number;
    averageMachinesPerClient: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'client' | 'service' | 'user' | 'machine';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  description: string;
  timestamp: string;
  user: string;
}

/**
 * Get dashboard statistics
 */
export const useDashboardStats = () => {
  const clientStats = useClientStats();
  const serviceStats = useServiceStats();
  const userStats = useUserStats();

  return createQuery(() => ({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Combine all stats into a single dashboard object
      const [clients, services, users] = await Promise.all([
        clientStats.queryFn(),
        serviceStats.queryFn(),
        userStats.queryFn(),
      ]);

      return {
        clients,
        services,
        users,
        copyMachines: {
          totalMachines: 0, // TODO: Implement when copy machine stats are available
          activeMachines: 0,
          maintenanceRequired: 0,
          totalClients: clients.total,
          averageMachinesPerClient: 0,
        },
      };
    },
    enabled: clientStats.isSuccess && serviceStats.isSuccess && userStats.isSuccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
};

/**
 * Get dashboard activity feed
 */
export const useDashboardActivity = () => {
  return createQuery(() => ({
    queryKey: ['dashboard', 'activity'],
    queryFn: async (): Promise<DashboardActivity[]> => {
      // TODO: Implement activity feed endpoint
      // For now, return mock data
      return [
        {
          id: '1',
          type: 'client',
          action: 'created',
          description: 'Novo cliente cadastrado',
          timestamp: new Date().toISOString(),
          user: 'Admin',
        },
        {
          id: '2',
          type: 'service',
          action: 'completed',
          description: 'Serviço de manutenção concluído',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'Técnico',
        },
        {
          id: '3',
          type: 'service',
          action: 'created',
          description: 'Novo serviço agendado',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'Gerente',
        },
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));
};
