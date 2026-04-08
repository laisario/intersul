/**
 * Utility functions for formatting data
 */

import { UserRole } from '$lib/api/types/auth.types.js';
import { ServiceStatus } from '$lib/api/types/service.types.js';
import { getServiceStatusLabel, getServicePriorityLabel } from './constants.js';
import type {
  ServiceStatus as ServiceStatusValue,
  ServicePriority as ServicePriorityValue
} from '$lib/api/types/service.types.js';

type UserRoleValue = UserRole;

// Date formatting
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(dateObj);
}

export function daysUntilExpiration(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

export function getExpirationColor(days: number): string {
  if (days < 3) {
    return 'red';
  } else if (days < 7) {
    return 'orange';
  } else if (days < 14) {
    return 'yellow';
  } else {
    return 'green';
  }
}

export function getExpirationBadgeClasses(days: number): string {
  if (days < 3) {
    return 'border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200';
  } else if (days < 7) {
    return 'border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200';
  } else if (days < 14) {
    return 'border border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-200';
  } else {
    return 'border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Hoje';
  } else if (diffInDays === 1) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    return `${diffInDays} dias atrás`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} semana${weeks > 1 ? 's' : ''} atrás`;
  } else {
    return formatDate(dateObj);
  }
}

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Number formatting
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num / 100);
}

// Duration formatting
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

// Status formatting
export function formatServiceStatus(status: ServiceStatusValue | string | null | undefined): string {
  // Use the centralized function from constants
  return getServiceStatusLabel(status);
}

export function formatServicePriority(priority: ServicePriorityValue): string {
  return getServicePriorityLabel(priority);
}

export function formatUserRole(role: UserRoleValue): string {
  const roleMap = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.MANAGER]: 'Gerente',
    [UserRole.TECHNICIAN]: 'Técnico',
    [UserRole.COMMERCIAL]: 'Comercial',
  };
  
  return roleMap[role] || role;
}

// Phone formatting
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

// File size formatting
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Text formatting
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
}

export function isValidCPF(cpf: string): boolean {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  if (!cpfRegex.test(cpf)) return false;
  
  // CPF validation algorithm
  const digits = cpf.replace(/\D/g, '').split('').map(Number);
  
  if (digits.length !== 11) return false;
  if (digits.every(digit => digit === digits[0])) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = sum % 11;
  let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digits[9] !== checkDigit1) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = sum % 11;
  let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digits[10] === checkDigit2;
}

/** Exact API / form values → Portuguese labels (stored value may stay "Fiado"). */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Fiado: 'Faturado',
  Cash: 'Dinheiro',
  PIX: 'PIX',
  'Debit Card': 'Cartão de Débito',
  'Credit Card': 'Cartão de Crédito',
  'Bank Slip': 'Boleto',
  Transfer: 'Transferência',
};

/**
 * Display label for payment method strings stored in the API.
 * Persisted value remains "Fiado" where applicable; UI shows "Faturado".
 */
export function getPaymentMethodLabel(method?: string | null): string {
  if (!method || typeof method !== 'string') return '';
  const normalized = method.trim();
  if (PAYMENT_METHOD_LABELS[normalized]) return PAYMENT_METHOD_LABELS[normalized];
  const lower = normalized.toLowerCase();
  if (lower === 'bank slip' || lower === 'boleto') return 'Boleto';
  if (lower === 'pix') return 'PIX';
  if (lower === 'cash' || lower === 'dinheiro') return 'Dinheiro';
  if (lower === 'credit card' || lower === 'cartão' || lower === 'cartao') return 'Cartão';
  return normalized;
}
