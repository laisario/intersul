import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock TanStack Query
vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  createMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  })),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock toast
vi.mock('$lib/utils/toast', () => ({
  successToast: {
    created: vi.fn(),
    updated: vi.fn(),
    deleted: vi.fn(),
  },
  errorToast: {
    unknown: vi.fn(),
  },
  showError: vi.fn(),
}));
