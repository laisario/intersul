# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
intersul/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── main.ts         # Application entry point
│   │   ├── app.module.ts  # Root module
│   │   ├── config/        # Configuration (DB, JWT)
│   │   ├── common/        # Shared (filters, decorators, enums)
│   │   ├── modules/       # Feature modules
│   │   ├── migrations/    # Database migrations
│   │   └── scripts/       # Utility scripts
│   ├── test/              # E2E tests
│   ├── uploads/           # File uploads (images)
│   └── coverage/          # Test coverage reports
├── frontend/              # SvelteKit SPA
│   ├── src/
│   │   ├── routes/        # SvelteKit routes
│   │   ├── lib/           # Shared code
│   │   │   ├── api/       # API client, endpoints, types
│   │   │   ├── components/# Reusable components
│   │   │   ├── stores/    # Svelte stores
│   │   │   ├── config/    # Configuration
│   │   │   └── utils/     # Utility functions
│   │   └── app.css       # Global styles
│   ├── build/            # Production build output
│   └── static/           # Static assets
├── docs/                  # Project documentation
│   ├── pdd/              # Product Design Documents
│   └── features/         # Feature planning
├── .github/              # GitHub workflows
└── .planning/            # GSD planning docs
```

## Directory Purposes

### Backend

**`backend/src/modules/`:**
- Purpose: Feature modules (each is a subdirectory)
- Contains: Controllers, services, entities, DTOs, guards, strategies
- Key modules:
  - `auth/` - Authentication and user management
  - `clients/` - Client business management
  - `copy-machines/` - Machine catalog and franchises
  - `services/` - Service orders and steps
  - `dashboard/` - Statistics
  - `billings/` - Billing management
  - `common/` - Shared functionality

**`backend/src/common/`:**
- Purpose: Cross-cutting concerns
- Contains:
  - `filters/` - Exception filters
  - `decorators/` - Custom decorators (CurrentUser, Roles)
  - `enums/` - TypeScript enums

**`backend/src/config/`:**
- Purpose: Configuration files
- Key files:
  - `database.config.ts` - TypeORM config
  - `jwt.config.ts` - JWT settings

**`backend/src/migrations/`:**
- Purpose: Database migrations
- Pattern: `*.ts` files with sequential timestamps

### Frontend

**`frontend/src/routes/`:**
- Purpose: SvelteKit pages and layouts
- Structure:
  - `(public)/` - Unauthenticated routes (login, register, invite)
  - `(protected)/` - Authenticated routes (dashboard, clients, machines, etc.)
  - `+layout.svelte` - Root layout
  - `+page.svelte` - Page components

**`frontend/src/lib/api/`:**
- Purpose: API client layer
- Structure:
  - `client.ts` - Axios instance with interceptors
  - `endpoints/` - API call functions organized by domain
  - `types/` - TypeScript type definitions

**`frontend/src/lib/components/`:**
- Purpose: Reusable UI components
- Structure:
  - `ui/` - Base UI components (card, button, etc.)
  - `forms/` - Form components
  - `tables/` - Table components
  - `dialogs/` - Dialog components
  - `machines/` - Machine-related components

**`frontend/src/lib/stores/`:**
- Purpose: Svelte stores for state management
- Contains: `auth.svelte.ts`, `theme.svelte.ts`

**`frontend/src/lib/utils/`:**
- Purpose: Utility functions
- Contains: Formatting, validation, constants

## Key File Locations

### Backend Entry Points

- `backend/src/main.ts`: Application bootstrap
- `backend/src/app.module.ts`: Root module registration
- `backend/data-source.ts`: TypeORM data source for migrations

### Backend Configuration

- `backend/src/config/database.config.ts`: Database connection
- `backend/src/config/jwt.config.ts`: JWT secret and expiration
- `backend/.env`: Environment variables (never committed)

### Backend Feature Modules

Each module follows this pattern:
```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── dto/
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
└── entities/
    └── *.entity.ts
```

### Frontend Routes

- `frontend/src/routes/+layout.svelte`: Root layout with QueryClientProvider
- `frontend/src/routes/(protected)/+layout.svelte`: Protected layout with auth guard
- `frontend/src/routes/(public)/login/+page.svelte`: Login page

### Frontend API

- `frontend/src/lib/api/client.ts`: Axios instance
- `frontend/src/lib/api/endpoints/clients.ts`: Client API calls
- `frontend/src/lib/api/types/client.types.ts`: Client type definitions

## Naming Conventions

### Backend Files

- **Modules:** kebab-case (e.g., `clients.module.ts`)
- **Controllers:** kebab-case with `.controller` suffix (e.g., `clients.controller.ts`)
- **Services:** kebab-case with `.service` suffix (e.g., `clients.service.ts`)
- **Entities:** kebab-case with `.entity` suffix (e.g., `client.entity.ts`)
- **DTOs:** kebab-case with `.dto` suffix (e.g., `create-client.dto.ts`)
- **Guards:** kebab-case with `.guard` suffix (e.g., `jwt-auth.guard.ts`)

### Frontend Files

- **Routes:** kebab-case with `+page.svelte` suffix
- **Components:** kebab-case `.svelte` files
- **Types:** camelCase `.types.ts` files
- **Endpoints:** camelCase `.ts` files in `endpoints/`
- **Stores:** camelCase `.svelte.ts` files

### Database Entities

- **Table names:** Plural snake_case (e.g., `clients`, `users`)
- **Columns:** snake_case
- **Relations:** Descriptive (e.g., `client`, `services`)

## Where to Add New Code

### New Backend Feature Module

1. Create directory: `backend/src/modules/<feature-name>/`
2. Create files following pattern:
   - `<feature-name>.module.ts`
   - `<feature-name>.controller.ts`
   - `<feature-name>.service.ts`
   - `entities/<entity-name>.entity.ts`
   - `dto/create-<entity-name>.dto.ts`
   - `dto/update-<entity-name>.dto.ts`
3. Import module in `backend/src/app.module.ts`

### New Backend API Endpoint

1. Find or create controller in appropriate module
2. Add route method with decorators
3. Add corresponding service method
4. Add DTO if input validation needed

### New Frontend Route

1. Create directory: `frontend/src/routes/<path>/`
2. Create `+page.svelte` file
3. Add `+page.ts` for data loading if needed
4. Add to sidebar navigation in `app-sidebar.svelte`

### New Frontend API Endpoint

1. Add types in `frontend/src/lib/api/types/<domain>.types.ts`
2. Add endpoint functions in `frontend/src/lib/api/endpoints/<domain>.ts`

### New UI Component

1. Create in appropriate subdirectory of `frontend/src/lib/components/`
2. Follow existing component patterns

## Special Directories

**`backend/uploads/`:**
- Purpose: Uploaded images and files
- Generated: Yes (runtime)
- Committed: No (in .gitignore)

**`frontend/build/`:**
- Purpose: Production build output
- Generated: Yes (build process)
- Committed: No

**`backend/coverage/`:**
- Purpose: Test coverage reports
- Generated: Yes (test run)
- Committed: No

**`docs/`:**
- Purpose: Project documentation
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-18*
