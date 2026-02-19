# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**File Storage:**
- Cloudflare R2 (S3-compatible)
  - SDK: `@aws-sdk/client-s3` 3.968.0
  - Implementation: `backend/src/modules/common/services/storage.service.ts`
  - Env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `ENDPOINT_FOR_S3_CLIENTS`, `R2_PUBLIC_URL`, `ACCOUNT_ID`
  - Used for: Storing uploaded images, documents for services and copy machines

**Address Lookup:**
- ViaCEP API (Brazilian postal code service)
  - Endpoint: `https://viacep.com.br/ws`
  - Implementation: `frontend/src/lib/services/viacep.service.ts`
  - Used for: Auto-filling address fields from Brazilian CEP

## Data Storage

**Databases:**
- MySQL 8.0
  - Connection: Environment variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`)
  - ORM: TypeORM 0.3.0
  - Config: `backend/src/config/database.config.ts`
  - Docker container: `db_intersul` / `db_intersul_prod`

**Caching:**
- Redis 7 (Alpine)
  - Connection: Environment variables (`REDIS_HOST`, `REDIS_PORT`)
  - Client: `ioredis` 5.3.0 / `redis` 4.6.0
  - Used for: Session storage, Bull queue backend (disabled)
  - Docker container: `intersul_redis` / `intersul_redis_prod`

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
  - See "File Storage" above
  - Buckets: `intersul`

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: Passport JWT strategy
  - Module: `backend/src/modules/auth/`
  - Guards: `JwtAuthGuard`, `RolesGuard`
  - Decorators: `@CurrentUser`, `@Roles`
  - Roles: `UserRole` enum (`ADMIN`, `EMPLOYEE`, `CLIENT`)
  - Token expiry: Configurable via `JWT_EXPIRATION` (default 7d)

**User Invitation System:**
- Token-based invitation flow
  - Invitation entity: `backend/src/modules/auth/entities/user-invitation.entity.ts`
  - Service: `backend/src/modules/auth/services/invitation.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Bugsnag, or similar)

**Logs:**
- Console logging (default Node.js)
- Swagger documentation at `/api` endpoint for API testing

## CI/CD & Deployment

**Hosting:**
- Frontend: Traditional FTP hosting
  - Deployed via GitHub Actions to `public_html/`
  - Config: `.github/workflows/deploy-frontend.yml`

**Backend:**
- Not deployed via CI/CD
- Docker Compose for development/production
- `backend/docker-compose.yml` (dev), `backend/docker-compose.prod.yml` (prod)

**CI Pipeline:**
- GitHub Actions
  - Trigger: Push to `main` branch, changes to frontend
  - Steps: Build Node.js, create .env, install deps, build Vite, FTP deploy
  - Secrets: `VITE_API_URL`, `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`

## Environment Configuration

**Required env vars:**

Backend Development:
```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=intersul_user
DB_PASSWORD=intersul_password
DB_DATABASE=intersul
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d
REDIS_HOST=localhost
REDIS_PORT=6379
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
ENDPOINT_FOR_S3_CLIENTS=...
R2_PUBLIC_URL=...
ACCOUNT_ID=...
PORT=3000
```

Frontend Development:
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Intersul
```

**Secrets location:**
- GitHub Secrets for CI/CD
- `.env` files (not committed to git)

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints)

**Outgoing:**
- None detected (no outbound webhooks)

---

*Integration audit: 2026-02-18*
