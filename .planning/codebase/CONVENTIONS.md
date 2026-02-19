# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

### Backend (NestJS)

**Files:**
- Controllers: kebab-case with `.controller.ts` suffix (e.g., `auth.controller.ts`)
- Services: kebab-case with `.service.ts` suffix (e.g., `auth.service.ts`)
- Entities: kebab-case with `.entity.ts` suffix (e.g., `user.entity.ts`)
- DTOs: kebab-case with `.dto.ts` suffix (e.g., `login.dto.ts`)
- Modules: kebab-case with `.module.ts` suffix (e.g., `auth.module.ts`)
- Filters/Guards: kebab-case (e.g., `http-exception.filter.ts`, `jwt-auth.guard.ts`)

**Functions:**
- camelCase (e.g., `validateUser`, `login`, `findById`)

**Variables:**
- camelCase (e.g., `mockUser`, `accessToken`, `userId`)
- Database columns use snake_case (e.g., `created_at`, `updated_at`)

**Types/Interfaces:**
- PascalCase (e.g., `LoginDto`, `User`, `AuthService`)

### Frontend (SvelteKit)

**Files:**
- Components: camelCase with `.svelte` suffix (e.g., `Button.svelte`)
- Stores: camelCase with `.svelte.ts` suffix (e.g., `auth.svelte.ts`)
- API clients: camelCase with `.ts` suffix (e.g., `client.ts`, `auth.ts`)
- Query hooks: camelCase with `.svelte.ts` suffix (e.g., `use-auth.svelte.ts`)

**Functions:**
- camelCase (e.g., `createAxiosInstance`, `login`, `getProfile`)

**Variables:**
- camelCase (e.g., `axios`, `authStore`, `user`)

## Code Style

### Backend Formatting

**Tool:** Prettier
**Config file:** `backend/.prettierrc`
```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

**Linting:** ESLint
**Config file:** `backend/.eslintrc.js`
- Uses `@typescript-eslint/parser`
- Extends `plugin:@typescript-eslint/recommended` and `plugin:prettier/recommended`
- Rules disabled: interface-name-prefix, explicit-function-return-type, explicit-module-boundary-types, no-explicit-any

### Frontend Formatting

**Tool:** Prettier
**Config file:** `frontend/.prettierrc`
```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100
}
```

**Linting:** ESLint (flat config)
**Config file:** `frontend/eslint.config.js`
- Uses `typescript-eslint` parser
- Includes `eslint-plugin-svelte`
- Uses `eslint-config-prettier`

## Import Organization

### Backend

Order (inferred from code):
1. NestJS imports (`@nestjs/common`, `@nestjs/core`, etc.)
2. TypeORM imports (`typeorm`, `@nestjs/typeorm`)
3. Third-party libraries (e.g., `bcrypt`, `passport`)
4. Internal modules (`../services/auth`, `../entities/user`)
5. Config imports (`../../../config/*`)

Example:
```typescript
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { jwtConfig } from '../../../config/jwt.config';
```

### Frontend

Order (inferred from code):
1. Third-party imports (e.g., `axios`, `humps`)
2. SvelteKit imports (`$app/*`)
3. Internal library imports (`$lib/*`)

Example:
```typescript
import _axios from 'axios';
import humps from 'humps';
import { env } from '$lib/config/env.js';
```

**Path Aliases:**
- Backend: Configured via tsconfig.json (`@/*` not commonly used)
- Frontend: `$lib/*` for internal library code

## Error Handling

### Backend

**Exception Filter:**
- Location: `backend/src/common/filters/http-exception.filter.ts`
- Catches `HttpException`
- Returns standardized error response with statusCode, timestamp, path, method, message

**Service-level Error Handling:**
- Uses NestJS built-in exceptions: `UnauthorizedException`, `ConflictException`, `NotFoundException`, etc.
- Throws with descriptive messages

Example:
```typescript
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('User with this email already exists');
```

### Frontend

**Axios Interceptor:**
- Location: `frontend/src/lib/api/client.ts`
- Handles 401 Unauthorized by clearing token and redirecting to login
- Transforms error responses with `humps.camelizeKeys`
- Provides network error messaging

Example:
```typescript
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
if (!error.response) {
  error.message = 'Network error. Please check your connection.';
}
```

## Logging

**Backend:**
- Console logging for errors: `console.error('HTTP Exception:', errorResponse)`
- No structured logging framework detected

**Frontend:**
- Browser console: `console.error('Failed to parse user from localStorage:', error)`
- No external logging service configured

## Comments

### When to Comment

**Backend:**
- JSDoc for DTOs with `@ApiProperty`, `@ApiOperation`, `@ApiResponse`
- Controller methods annotated with Swagger decorators

Example:
```typescript
@ApiProperty({
  example: 'user@example.com',
  description: 'User email address',
})
@IsEmail()
email: string;
```

**Frontend:**
- JSDoc for API functions and utilities
- Example in `client.ts`:
```typescript
/**
 * Centralized Axios client configuration
 */
```

## Function Design

### Backend

**Size:** Not strictly enforced, typical NestJS patterns

**Parameters:**
- DTOs for request bodies
- Path params as function arguments
- `@CurrentUser()` decorator for authenticated user data

**Return Values:**
- Promises for async operations
- Entities/DTOs/Response objects

### Frontend

**Size:** Not strictly enforced

**Parameters:**
- Typed interfaces for API payloads
- Store methods handle state updates

**Return Values:**
- Promises for API calls
- Store subscription patterns

## Module Design

### Backend (NestJS)

**Module Structure:**
- Controllers: Handle HTTP requests
- Services: Business logic
- Entities: TypeORM database models
- DTOs: Data transfer objects with validation
- Guards: Authentication/Authorization
- Decorators: Custom metadata

**Dependency Injection:**
- Constructor injection with `@InjectRepository()` for TypeORM
- Service injection via constructor

### Frontend (SvelteKit)

**Exports:**
- Named exports for API clients and stores
- Re-exported via `$lib/index.ts`

**Barrel Files:**
- Uses `$lib/api/types/*.types.ts` for type definitions
- Uses `$lib/api/endpoints/*.ts` for API endpoints

---

*Convention analysis: 2026-02-18*
