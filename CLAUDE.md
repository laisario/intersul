# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Intersul is a monorepo service management platform for copy machine businesses. It handles maintenance services, client management, inventory, employee workflows, and billing.

- **Frontend:** SvelteKit 2 + Svelte 5 + Tailwind CSS 4, deployed as static SPA to `intersulcopias.com` via FTP
- **Backend:** NestJS 10 + TypeORM + MySQL 8, with Redis/Bull for background jobs

## Development Commands

### Backend (`/backend`)

```bash
npm run start:dev         # Start with hot reload
npm run build             # Compile TypeScript
npm run lint              # ESLint with auto-fix
npm run test              # All Jest tests
npm run test:unit         # Only *.spec.ts
npm run test:integration  # Only *.integration.spec.ts
npm run test:e2e          # E2E tests
npm run test:cov          # With coverage

# Database
npm run migration:generate  # Generate migration from entity changes
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# Docker (MySQL + Redis)
npm run docker:up           # Start services
npm run docker:down         # Stop services
```

### Frontend (`/frontend`)

```bash
npm run dev           # Dev server at http://localhost:5173
npm run build         # Production static build → /frontend/build
npm run check         # Svelte type checking
npm run lint          # Prettier + ESLint check
npm run test:run      # Vitest (one-shot)
npm run test:ui       # Vitest with UI
```

## Architecture

### Backend (`/backend/src/`)

NestJS modules pattern. Each domain has controller, service, DTOs, and entities co-located:

```
modules/
├── auth/          # JWT, login, invitations, roles (ADMIN, MANAGER, EMPLOYEE)
├── clients/       # Customer management
├── copy-machines/ # Machine inventory and client relationships
├── services/      # Core service/maintenance management
├── dashboard/     # Analytics and statistics
├── billings/      # Invoicing
└── common/        # Shared decorators, enums, exception filters
config/            # database.config.ts, jwt.config.ts
migrations/        # TypeORM migrations (never use schema:sync in prod)
```

### Frontend (`/frontend/src/`)

SvelteKit file-based routing with protected/public layout groups:

```
routes/
├── (protected)/   # Authenticated pages (JWT required)
│   ├── dashboard, services, steps, clients, machines, categories, billings, franchises, admin
└── (public)/      # login, invitations
lib/
├── api/           # Axios client + endpoint modules
├── components/    # ui/, forms/, tables/, dialogs/, layout/
├── stores/        # auth, theme (Svelte stores)
├── config/        # env.ts, query-client.ts (TanStack Query)
└── hooks/         # Custom hooks
```

### Key Patterns

- **Auth:** JWT Bearer token stored in localStorage; Axios interceptors add it to headers. 401 responses redirect to login.
- **Data transformation:** Axios interceptors auto-convert camelCase ↔ snake_case between frontend and backend API.
- **Data fetching:** TanStack Query for all server state; Axios for HTTP.
- **Role guards:** Backend uses `@Roles(Role.ADMIN)` decorator + `RolesGuard`.
- **Database changes:** Always generate a migration (`npm run migration:generate`), apply with `npm run migration:run`. Never use `schema:sync` in production.
- **Coverage:** Backend Jest config enforces 100% coverage threshold.

## Environment Setup

**Backend** (`backend/.env`):
```
DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE
JWT_SECRET / JWT_EXPIRATION
REDIS_HOST / REDIS_PORT
NODE_ENV / PORT
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3000
```

Start the full dev environment: `npm run docker:up` in `/backend`, then `npm run start:dev` in `/backend`, then `npm run dev` in `/frontend`.

## Deployment

Frontend is built with `npm run build` and deployed via FTP to shared hosting. GitHub Actions workflow at `.github/workflows/deploy-frontend.yml` automates this using `VITE_API_URL` secret.
