/**
 * Application constants
 */

import { UserRole } from '$lib/api/types/auth.types.js';
import { ServiceStatus, ServicePriority } from '$lib/api/types/service.types.js';
import { AcquisitionType } from '$lib/api/types/copy-machine.types.js';

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
} as const;

// User roles and permissions
export const USER_ROLES = {
  [UserRole.ADMIN]: {
    label: 'Administrador',
    description: 'Acesso total ao sistema',
    color: 'red',
    permissions: ['all'],
  },
  [UserRole.MANAGER]: {
    label: 'Gerente',
    description: 'Gerenciar serviços e clientes',
    color: 'blue',
    permissions: ['manage_services', 'manage_clients', 'view_reports'],
  },
  [UserRole.TECHNICIAN]: {
    label: 'Técnico',
    description: 'Executar serviços técnicos',
    color: 'green',
    permissions: ['execute_services', 'view_own_services'],
  },
  [UserRole.COMMERCIAL]: {
    label: 'Comercial',
    description: 'Gestão comercial e vendas',
    color: 'purple',
    permissions: ['manage_clients', 'view_reports'],
  },
} as const;

// Client status configuration (removed - not used in current implementation)

// Service status configuration
export const SERVICE_STATUS = {
  [ServiceStatus.PENDING]: {
    label: 'Pendente',
    color: 'yellow',
    description: 'Aguardando início',
  },
  [ServiceStatus.IN_PROGRESS]: {
    label: 'Em Andamento',
    color: 'blue',
    description: 'Serviço em execução',
  },
  [ServiceStatus.COMPLETED]: {
    label: 'Concluído',
    color: 'green',
    description: 'Serviço finalizado',
  },
  [ServiceStatus.CANCELLED]: {
    label: 'Cancelado',
    color: 'red',
    description: 'Serviço cancelado',
  },
  [ServiceStatus.ON_HOLD]: {
    label: 'Em Espera',
    color: 'orange',
    description: 'Serviço pausado',
  },
} as const;

// Service priority configuration
export const SERVICE_PRIORITY = {
  [ServicePriority.LOW]: {
    label: 'Baixa',
    color: 'gray',
    description: 'Prioridade baixa',
  },
  [ServicePriority.MEDIUM]: {
    label: 'Média',
    color: 'blue',
    description: 'Prioridade média',
  },
  [ServicePriority.HIGH]: {
    label: 'Alta',
    color: 'orange',
    description: 'Prioridade alta',
  },
  [ServicePriority.URGENT]: {
    label: 'Urgente',
    color: 'red',
    description: 'Prioridade urgente',
  },
} as const;

// Acquisition type configuration
export const ACQUISITION_TYPE = {
  [AcquisitionType.RENT]: {
    label: 'Alugada',
    color: 'blue',
    description: 'Máquina alugada',
  },
  [AcquisitionType.SOLD]: {
    label: 'Vendida',
    color: 'green',
    description: 'Máquina vendida',
  },
  [AcquisitionType.OWNED]: {
    label: 'Externa',
    color: 'gray',
    description: 'Máquina externa',
  },
} as const;

// Navigation configuration
export const NAVIGATION = {
  MAIN: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
      roles: ['all'],
    },
    {
      title: 'Clientes',
      href: '/clients',
      icon: 'users',
      roles: ['all'],
    },
    {
      title: 'Serviços',
      href: '/services',
      icon: 'wrench',
      roles: ['all'],
    },
    {
      title: 'Catálogo',
      href: '/catalog',
      icon: 'printer',
      roles: ['all'],
    },
  ],
  ADMIN: [
    {
      title: 'Usuários',
      href: '/admin/users',
      icon: 'user-cog',
      roles: ['admin'],
    },
    {
      title: 'Configurações',
      href: '/admin/settings',
      icon: 'settings',
      roles: ['admin'],
    },
  ],
} as const;

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
  GRAY: '#6b7280',
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  SAVED: 'Salvo com sucesso!',
  LOGGED_IN: 'Login realizado com sucesso!',
  LOGGED_OUT: 'Logout realizado com sucesso!',
} as const;

// Form validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  PHONE_PATTERN: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CPF_PATTERN: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
} as const;

// Service categories (default)
export const DEFAULT_SERVICE_CATEGORIES = [
  { name: 'Manutenção', color: '#3b82f6', description: 'Manutenção preventiva e corretiva' },
  { name: 'Instalação', color: '#10b981', description: 'Instalação de equipamentos' },
  { name: 'Suporte', color: '#f59e0b', description: 'Suporte técnico' },
  { name: 'Venda', color: '#8b5cf6', description: 'Venda de equipamentos' },
] as const;
