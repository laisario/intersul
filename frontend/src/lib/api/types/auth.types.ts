/**
 * Authentication and user-related types
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  sector?: string;
  position?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  COMMERCIAL: 'COMMERCIAL'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  sector?: string;
  position?: string;
}

export interface AcceptInvitationPayload {
  token: string;
  name: string;
  email: string;
  password: string;
  position?: string;
}

export interface InvitationDetails {
  id: number;
  token: string;
  role: UserRole;
  position?: string | null;
  email?: string | null;
  expiresAt?: string | null;
  used: boolean;
  usedAt?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}