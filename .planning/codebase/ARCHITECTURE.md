# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Modular Monolithic Architecture with Clear Layer Separation

**Key Characteristics:**
- NestJS backend with TypeORM for database abstraction
- SvelteKit frontend with TanStack Query for data fetching
- RESTful API with JWT authentication
- Monorepo structure with separate backend and frontend directories

## Layers

### Backend (NestJS)

**Entry Layer:**
- Location: `backend/src/main.ts`
- Purpose: Application bootstrap, middleware setup, global pipes
- Responsibilities: Initialize NestFactory, configure CORS, set up ValidationPipe, serve static uploads

**Module Layer:**
- Location: `backend/src/app.module.ts`
- Purpose: Root module composition
- Contains: All feature modules (Auth, Clients, CopyMachines, Services, Dashboard, Billings, Common)
- Depends on: NestJS core modules (ConfigModule, TypeOrmModule)

**Feature Modules:**
Each module follows consistent pattern with controller/service/entity/DTO structure:

- `AuthModule` (`backend/src/modules/auth/`)
  - Purpose: Authentication, authorization, user management
  - Contains: Controllers (`auth.ts`, `user.ts`, `invitation.ts`), Services (`auth.ts`, `user.ts`, `invitation.ts`), Entities, Guards, Strategies
  - Depends on: Passport, JWT, TypeORM

- `ClientsModule` (`backend/src/modules/clients/`)
  - Purpose: Client management (businesses that receive services)
  - Contains: Controller, Service, Entity (`client.entity.ts`), DTOs
  - Depends on: TypeORM

- `CopyMachinesModule` (`backend/src/modules/copy-machines/`)
  - Purpose: Machine catalog, franchises, client machine assignments
  - Contains: Controller, Service, Entities (Franchise, ClientCopyMachine, CopyMachineCatalog)
  - Depends on: TypeORM

- `ServicesModule` (`backend/src/modules/services/`)
  - Purpose: Service orders, steps, categories
  - Contains: Controllers, Services, Entities (Service, Step, Category)
  - Depends on: ClientsModule, CopyMachinesModule, CommonModule

- `DashboardModule` (`backend/src/modules/dashboard/`)
  - Purpose: Statistics and aggregated data
  - Contains: Controller, Service, Entity

- `BillingsModule` (`backend/src/modules/billings/`)
  - Purpose: Billing management
  - Contains: Controller, Service, Entity, DTOs

- `CommonModule` (`backend/src/modules/common/`)
  - Purpose: Shared functionality (addresses, locations, images, storage)
  - Contains: Services (Storage, Image, Location), Controllers (Address), Entities

**Data Access Layer:**
- Location: `backend/src/config/database.config.ts`
- TypeORM with MySQL
- Entities: `backend/src/modules/*/entities/*.entity.ts`
- Migrations: `backend/src/migrations/`

### Frontend (SvelteKit)

**Route Layer:**
- Location: `frontend/src/routes/`
- Structure: `(public)/` and `(protected)/` route groups
- Entry: `frontend/src/routes/+layout.svelte`

**Component Layer:**
- Location: `frontend/src/lib/components/`
- Reusable UI components organized by type

**API Layer:**
- Location: `frontend/src/lib/api/`
- Structure: `client.ts` (axios instance), `endpoints/` (API calls), `types/` (TypeScript types)

## Data Flow

**API Request Flow:**

1. Client (Svelte component) calls endpoint function from `frontend/src/lib/api/endpoints/*.ts`
2. Endpoint uses axios instance (`frontend/src/lib/api/client.ts`) which:
   - Adds JWT token from localStorage
   - Decamelizes request data (humps)
   - Sends to backend
3. Backend receives request in Controller (`backend/src/modules/*/controllers/*.ts`)
4. Controller validates input (DTOs with class-validator), calls Service
5. Service executes business logic, interacts with TypeORM Repository
6. TypeORM queries MySQL database
7. Response flows back through Service → Controller → Client
8. Client axios interceptor camelizes response data

**Authentication Flow:**

1. User submits login credentials to `/auth/login`
2. AuthService validates credentials, generates JWT
3. Frontend stores token in localStorage
4. Subsequent requests include `Authorization: Bearer <token>`
5. JwtStrategy validates token on each protected route
6. JwtAuthGuard protects endpoints

## Key Abstractions

**Controllers:**
- Purpose: Handle HTTP requests/responses, validate input
- Examples: `backend/src/modules/clients/clients.controller.ts`
- Pattern: Route decorators + service injection

**Services:**
- Purpose: Business logic, data manipulation
- Examples: `backend/src/modules/clients/clients.service.ts`
- Pattern: Repository injection, CRUD operations

**Entities:**
- Purpose: Database table mapping with TypeORM
- Examples: `backend/src/modules/clients/entities/client.entity.ts`
- Pattern: Decorators define columns, relations

**DTOs:**
- Purpose: Data transfer objects for validation
- Location: `backend/src/modules/*/dto/*.dto.ts`
- Pattern: class-validator decorators

**Guards:**
- Purpose: Route protection
- Examples: `backend/src/modules/auth/guards/jwt-auth.guard.ts`, `roles.guard.ts`

## Entry Points

**Backend:**
- `backend/src/main.ts`: Application bootstrap, Express/Nest setup
- Port: Configurable via `PORT` env (default 3000)

**Frontend:**
- `frontend/src/routes/+layout.svelte`: Root layout, providers
- `frontend/src/routes/(protected)/+layout.svelte`: Protected layout with auth guard
- `frontend/src/routes/(public)/+layout.svelte`: Public layout

**Database:**
- MySQL via TypeORM
- Config: `backend/src/config/database.config.ts`
- Entities auto-loaded from `backend/src/modules/**/*.entity{.ts,.js}`

## Error Handling

**Backend:**
- Global exception filter: `backend/src/common/filters/http-exception.filter.ts`
- Validation errors: Custom BadRequestException with detailed field errors
- NestJS built-in exceptions (NotFoundException, UnauthorizedException, etc.)

**Frontend:**
- Axios interceptor handles 401 (redirects to login)
- Network errors transformed
- TypeScript types for error responses

## Cross-Cutting Concerns

**Logging:**
- Console logging via `console.error` in exception filter
- No structured logging framework currently

**Validation:**
- Backend: class-validator with whitelist, transform, custom exception factory
- Frontend: Custom validation utilities

**Authentication:**
- JWT with Passport.js
- Token stored in localStorage (frontend)
- Secret and expiration from config

**API Documentation:**
- Swagger/OpenAPI via `@nestjs/swagger`
- Endpoint: `/api` (when running)

---

*Architecture analysis: 2026-02-18*
