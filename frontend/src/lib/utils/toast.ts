/**
 * Toast notification utilities
 */

import { toast } from 'svelte-sonner';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants.js';

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: { duration?: number }) {
  return toast.success(message, {
    duration: options?.duration || 4000,
  });
}

/**
 * Show error toast
 */
export function showError(message: string, options?: { duration?: number }) {
  return toast.error(message, {
    duration: options?.duration || 6000,
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: { duration?: number }) {
  return toast.info(message, {
    duration: options?.duration || 4000,
  });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: { duration?: number }) {
  return toast.warning(message, {
    duration: options?.duration || 5000,
  });
}

/**
 * Show loading toast
 */
export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Update toast (for loading states)
 */
export function updateToast(id: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
  toast[type](message, { id });
}

/**
 * Dismiss toast
 */
export function dismissToast(id: string) {
  toast.dismiss(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Resolves a user-facing message from axios/API errors (response may be camelCased by the client interceptor).
 * Prefer backend `message`, then HTTP status, then network hints.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string | string[] } };
    message?: string;
  };
  const raw = err.response?.data?.message;
  if (raw !== undefined && raw !== null) {
    const text = Array.isArray(raw) ? raw.join(' ') : String(raw);
    if (text.trim()) {
      return text.trim();
    }
  }
  const status = err.response?.status;
  if (status === 401) {
    return 'Sessão expirada ou inválida. Faça login novamente.';
  }
  if (status === 403) {
    return 'Você não tem permissão para esta ação.';
  }
  if (status === 404) {
    return 'Registro não encontrado.';
  }
  if (status === 400 || status === 422) {
    return 'Dados inválidos ou requisição não permitida.';
  }
  if (status !== undefined && status >= 500) {
    return 'Erro no servidor. Tente novamente mais tarde.';
  }
  if (!err.response) {
    const m = err.message?.toLowerCase() ?? '';
    if (m.includes('network') || m.includes('timeout') || m.includes('network error')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    return 'Erro de conexão. Verifique sua internet.';
  }
  return fallback;
}

// Predefined success messages
export const successToast = {
  created: (item: string) => showSuccess(`${item} criado com sucesso!`),
  updated: (item: string) => showSuccess(`${item} atualizado com sucesso!`),
  deleted: (item: string) => showSuccess(`${item} excluído com sucesso!`),
  saved: (item: string) => showSuccess(`${item} salvo com sucesso!`),
  loggedIn: () => showSuccess('Login realizado com sucesso!'),
  loggedOut: () => showSuccess('Logout realizado com sucesso!'),
};

// Predefined error messages
export const errorToast = {
  network: () => showError('Erro de conexão. Verifique sua internet.'),
  unauthorized: () => showError('Sessão expirada. Faça login novamente.'),
  forbidden: () => showError('Você não tem permissão para esta ação.'),
  notFound: () => showError('Recurso não encontrado.'),
  validation: () => showError('Dados inválidos. Verifique os campos.'),
  server: () => showError('Erro interno do servidor. Tente novamente.'),
  unknown: () => showError('Erro desconhecido. Tente novamente.'),
  create: (item: string) => showError(`Erro ao criar ${item}. Tente novamente.`),
  update: (item: string) => showError(`Erro ao atualizar ${item}. Tente novamente.`),
  delete: (item: string) => showError(`Erro ao excluir ${item}. Tente novamente.`),
  fetch: (item: string) => showError(`Erro ao carregar ${item}. Tente novamente.`),
};
