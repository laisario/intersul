/**
 * Zod validation schemas for forms
 */

import { z } from 'zod';
import { UserRole } from '$lib/api/types/auth.types.js';
import { ServiceStatus, ServicePriority } from '$lib/api/types/service.types.js';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Invalid phone format (XX) XXXXX-XXXX').optional();

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole).optional(),
  phone: phoneSchema,
  position: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Client schemas
export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export const createClientSchema = clientSchema;
export const updateClientSchema = clientSchema.partial().extend({
  id: z.number(),
});

// Service schemas
export const serviceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.number().min(1, 'Category is required'),
  clientId: z.number().min(1, 'Client is required'),
  assignedToId: z.number().optional(),
  clientCopyMachineId: z.number().optional(),
  scheduledDate: z.string().optional(),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  notes: z.string().optional(),
  priority: z.nativeEnum(ServicePriority).optional(),
});

export const createServiceSchema = serviceSchema;
export const updateServiceSchema = serviceSchema.partial().extend({
  id: z.number(),
  status: z.nativeEnum(ServiceStatus).optional(),
  actualDuration: z.number().optional(),
  completedDate: z.string().optional(),
});

// Service category schemas
export const serviceCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// Copy machine schemas
export const copyMachineCatalogSchema = z.object({
  model: z.string().min(2, 'Model must be at least 2 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  description: z.string().optional(),
  specifications: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  features: z.array(z.string()).optional(),
});

export const clientCopyMachineSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  catalogId: z.number().min(1, 'Catalog machine is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const franchiseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  features: z.array(z.string()).optional(),
  maxCopies: z.number().min(0).optional(),
  colorCopies: z.number().min(0).optional(),
  blackWhiteCopies: z.number().min(0).optional(),
});

// User management schemas (admin only)
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  role: z.nativeEnum(UserRole),
  phone: phoneSchema,
  position: z.string().optional(),
  active: z.boolean().optional(),
});

export const createUserSchema = userSchema.extend({
  password: passwordSchema,
});

export const updateUserSchema = userSchema.partial().extend({
  id: z.number(),
});

// Query parameter schemas
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const serviceQuerySchema = z.object({
  categoryId: z.number().optional(),
  clientId: z.number().optional(),
  clientCopyMachineId: z.number().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  priority: z.nativeEnum(ServicePriority).optional(),
  assignedToId: z.number().optional(),
  scheduledDateFrom: z.string().optional(),
  scheduledDateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Utility functions
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    throw error;
  }
}

export function getFieldError(errors: Record<string, string>, field: string): string | undefined {
  return errors[field];
}
