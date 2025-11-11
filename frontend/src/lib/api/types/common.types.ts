/**
 * Common API types and interfaces
 */

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: Record<string, any>;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}
