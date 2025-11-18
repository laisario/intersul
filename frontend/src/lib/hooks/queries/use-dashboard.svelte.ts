/**
 * Dashboard query hooks
 */

import { createQuery } from '@tanstack/svelte-query';
import { axios } from '$lib/api/client.js';
import { browser } from '$app/environment';

export interface DashboardStats {
  clients: {
    total: number;
    newThisMonth: number;
  };
  services: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    thisWeek: number;
    thisMonth: number;
  };
}

const STORAGE_KEY = 'dashboard_stats';
const STORAGE_TIMESTAMP_KEY = 'dashboard_stats_timestamp';

/**
 * Validate if cached stats still make sense
 * Returns true if stats are valid, false if they should be recalculated
 */
function validateStats(stats: DashboardStats | null): boolean {
  if (!stats) return false;

  // Check if totals are non-negative
  if (stats.clients.total < 0 || stats.services.total < 0) return false;

  // Check if service statuses add up correctly (allow some tolerance for real-time changes)
  const serviceStatusSum = 
    stats.services.pending + 
    stats.services.inProgress + 
    stats.services.completed + 
    stats.services.cancelled;
  
  // Services statuses should not exceed total by more than 10% (allowing for concurrent updates)
  if (serviceStatusSum > stats.services.total * 1.1) return false;

  // Check if new clients this month doesn't exceed total
  if (stats.clients.newThisMonth > stats.clients.total) return false;

  // Check if this month services doesn't exceed total
  if (stats.services.thisMonth > stats.services.total) return false;

  return true;
}

/**
 * Load stats from localStorage
 */
function loadCachedStats(): DashboardStats | null {
  if (!browser) return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;

    const stats = JSON.parse(cached) as DashboardStats;
    const cacheDate = new Date(timestamp);
    const now = new Date();

    // Check if cache is from current month (don't use old month's data)
    if (
      cacheDate.getFullYear() !== now.getFullYear() ||
      cacheDate.getMonth() !== now.getMonth()
    ) {
      return null;
    }

    // Validate stats make sense
    if (!validateStats(stats)) {
      return null;
    }

    return stats;
  } catch (error) {
    console.error('Failed to load cached stats:', error);
    return null;
  }
}

/**
 * Save stats to localStorage
 */
function saveCachedStats(stats: DashboardStats): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save cached stats:', error);
  }
}

/**
 * Get dashboard statistics
 * Loads from cache first, then fetches from API if needed
 */
export const useDashboardStats = () => {
  // Load initial data from cache
  const initialData = loadCachedStats();

  return createQuery(() => ({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await axios.get('/dashboard/stats');
      const stats = response.data;
      
      // Save to cache after fetching
      saveCachedStats(stats);
      
      return stats;
    },
    initialData,
    enabled: false, // Only fetch when manually triggered
    staleTime: 0, // Always consider stale to force refetch on button click
  }));
};

/**
 * Force recalculation of stats
 */
export const useForceRecalculateStats = () => {
  return createQuery(() => ({
    queryKey: ['dashboard', 'stats', 'force'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await axios.get('/dashboard/stats?force=true');
      const stats = response.data;
      
      // Save to cache after fetching
      saveCachedStats(stats);
      
      return stats;
    },
    enabled: false, // Only fetch when manually triggered
    staleTime: 0,
  }));
};
