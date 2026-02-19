# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5.1.3 (backend), TypeScript 5.9.2 (frontend) - Full-stack type safety

**Secondary:**
- JavaScript (Svelte components)

## Runtime

**Environment:**
- Node.js 20 (as per GitHub Actions workflow)

**Package Manager:**
- npm (npm ci for CI, npm install for dev)
- Lockfiles: `package-lock.json` (backend), `package-lock.json` (frontend)

## Frameworks

**Backend:**
- NestJS 10.0.0 - Progressive Node.js framework
  - TypeORM 0.3.0 - Database ORM
  - Passport JWT - Authentication strategy
  - Swagger/OpenAPI 7.0.0 - API documentation

**Frontend:**
- SvelteKit 2.43.2 - Full-stack web framework
- Svelte 5.39.5 - UI component framework

**Testing:**
- Backend: Jest 29.5.0 with ts-jest
- Frontend: Vitest 4.0.4

**Build/Dev:**
- Backend: ts-node (dev), Node.js production build
- Frontend: Vite 7.1.7

## Key Dependencies

**Critical (Backend):**
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` - Core NestJS
- `@nestjs/typeorm` 10.0.0 - TypeORM integration
- `mysql2` 3.6.0 - MySQL driver
- `typeorm` 0.3.0 - Database ORM
- `@nestjs/jwt` 10.0.0 - JWT authentication
- `passport-jwt` 4.0.1 - JWT passport strategy
- `bcrypt` 5.1.0 - Password hashing

**Storage & Queue:**
- `@aws-sdk/client-s3` 3.968.0 - S3/R2 storage client
- `bull` 4.11.0 - Job queue (disabled for MVP)
- `ioredis` 5.3.0, `redis` 4.6.0 - Redis clients

**Validation:**
- `class-validator` 0.14.0 - DTO validation
- `class-transformer` 0.5.1 - DTO transformation

**Critical (Frontend):**
- `@tanstack/svelte-query` 6.0.3 - Server state management
- `axios` 1.12.2 - HTTP client
- `humps` 2.0.1 - snake_case ↔ camelCase conversion
- `tailwindcss` 4.1.13 - CSS framework
- `bits-ui` 2.14.1 - UI component library
- `layerchart` 2.0.0-next.27 - Svelte chart components

## Configuration

**Environment Variables:**

Backend (`backend/src/config/`):
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - MySQL connection
- `JWT_SECRET`, `JWT_EXPIRATION` - JWT configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `ENDPOINT_FOR_S3_CLIENTS`, `R2_PUBLIC_URL` - Cloudflare R2
- `PORT` - Server port (default 3000)

Frontend (`frontend/src/lib/config/env.ts`):
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

**Build Configs:**
- `backend/tsconfig.json`, `frontend/tsconfig.json`
- `backend/nest-cli.json` (implicit from @nestjs/cli)
- `frontend/vite.config.ts`, `frontend/svelte.config.js`

## Platform Requirements

**Development:**
- Node.js 20
- MySQL 8.0 (via Docker Compose)
- Redis 7 (via Docker Compose)

**Production:**
- Node.js production build
- MySQL 8.0
- Redis 7
- Cloudflare R2 for file storage
- FTP hosting for frontend

---

*Stack analysis: 2026-02-18*
