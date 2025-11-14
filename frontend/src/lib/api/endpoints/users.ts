import { axios } from '../client.js';
import type { User } from '../types/auth.types.js';
import type {
	CreateUserPayload,
	UserInvitation,
	UserQueryParams,
	UserStats,
	CreateUserInvitationPayload
} from '../types/users.types.js';

export const usersApi = {
  getAll: (params?: UserQueryParams): Promise<User[]> =>
    axios.get('/users', { params }).then(res => res.data),

  getById: (id: number): Promise<User> =>
    axios.get(`/users/${id}`).then(res => res.data),

  create: (data: CreateUserPayload): Promise<User> =>
    axios.post('/users', data).then(res => res.data),

  delete: (id: number): Promise<void> =>
    axios.delete(`/users/${id}`).then(() => undefined),

  toggleActive: (id: number): Promise<User> =>
    axios.patch(`/users/${id}/toggle-active`).then(res => res.data),

  getStats: (): Promise<UserStats> =>
    axios.get('/users/stats').then(res => res.data),

  createInvitation: (data: CreateUserInvitationPayload): Promise<UserInvitation> =>
    axios.post('/users/invitations', data).then(res => res.data),

  getInvitations: (): Promise<UserInvitation[]> =>
    axios.get('/users/invitations').then(res => res.data),
};
