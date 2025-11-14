import type { UserRole } from './auth.types.js';

export interface CreateUserPayload {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	sector?: string;
	position?: string;
}

export interface UpdateUserPayload {
	name?: string;
	email?: string;
	role?: UserRole;
	sector?: string;
	position?: string;
	active?: boolean;
	avatar?: string;
	phone?: string;
}

export interface UserQueryParams {
	search?: string;
	role?: UserRole;
	active?: boolean;
	page?: number;
	limit?: number;
}

export interface UserStats {
	total: number;
	active: number;
	inactive: number;
	byRole: Record<UserRole, number>;
	newThisMonth: number;
}

export interface CreateUserInvitationPayload {
	role: UserRole;
	position?: string;
	email?: string;
	expiresInHours?: number;
	note?: string;
}

export interface UserInvitation {
	id: number;
	token: string;
	role: UserRole;
	position?: string | null;
	email?: string | null;
	expiresAt?: string | null;
	used: boolean;
	usedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	createdBy?: {
		id: number;
		name: string;
		email: string;
	};
}
