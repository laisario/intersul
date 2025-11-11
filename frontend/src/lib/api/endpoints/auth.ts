/**
 * Authentication API endpoints
 */

import { axios } from '../client.js';
import type {
  LoginCredentials,
  RegisterPayload,
  LoginResponse,
  User,
  PasswordChangeRequest,
  AcceptInvitationPayload,
  InvitationDetails
} from '../types/auth.types.js';

export const authApi = {
  /**
   * Login user
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    axios.post('/auth/login', credentials).then(res => res.data),

  /**
   * Register new user
   */
  register: (userData: RegisterPayload): Promise<LoginResponse> =>
    axios.post('/auth/register', userData).then(res => res.data),

  /**
   * Get current user profile
   */
  getProfile: (): Promise<User> =>
    axios.get('/auth/profile').then(res => res.data),

  /**
   * Change user password
   */
  changePassword: (data: PasswordChangeRequest): Promise<{ message: string }> =>
    axios.post('/auth/change-password', data).then(res => res.data),

  /**
   * Logout user (client-side only)
   */
  logout: (): Promise<void> => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },

  /**
   * Refresh token (if implemented in backend)
   */
  refreshToken: (): Promise<{ access_token: string }> =>
    axios.post('/auth/refresh').then(res => res.data),

  /**
   * Retrieve invitation details by token
   */
  getInvitation: (token: string): Promise<InvitationDetails> =>
    axios.get(`/auth/invitations/${token}`).then(res => res.data),

  /**
   * Complete user registration via invitation
   */
  acceptInvitation: (payload: AcceptInvitationPayload): Promise<LoginResponse> =>
    axios.post('/auth/invitations/accept', payload).then(res => res.data),
};
