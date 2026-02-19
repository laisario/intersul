# Codebase Concerns

**Analysis Date:** 2026-02-18

## Tech Debt

**Incomplete Type Definitions:**
- Issue: `status` field in `CopyMachineQueryParams` uses string type instead of proper enum
- Files: `frontend/src/lib/api/types/copy-machine.types.ts` (line 86)
- Impact: Type safety reduced, potential runtime errors
- Fix approach: Define `CopyMachineStatus` enum and replace string type

**Missing UI Features (TODO markers):**
- Issue: Incomplete UI components with TODO comments
- Files: 
  - `frontend/src/routes/(protected)/clients/[id]/+page.svelte` (line 395)
  - `frontend/src/lib/components/forms/service-form.svelte` (line 185)
- Impact: Incomplete user experience, dead code
- Fix approach: Implement the missing features or remove TODO comments if not planned

**Large Service Files:**
- Issue: Services have grown too large, making maintenance difficult
- Files: 
  - `backend/src/modules/billings/billings.service.ts` (608 lines)
  - `backend/src/modules/services/service/services.ts` (428 lines)
- Impact: Difficult to understand, test, and maintain
- Fix approach: Extract into smaller, focused services (e.g., BillingCalculationService, BillingGenerationService)

**Missing Barrel Exports:**
- Issue: No index.ts barrel files in modules
- Impact: Imports are verbose, refactoring is harder
- Fix approach: Add barrel exports in each module directory

## Security Considerations

**Hardcoded JWT Secret Default:**
- Risk: Application will run with insecure default secret if JWT_SECRET env var is not set
- Files: `backend/src/config/jwt.config.ts` (line 2)
- Current mitigation: None - falls back to 'your-secret-key-change-in-production'
- Recommendations: 
  - Throw error if JWT_SECRET is not set in production
  - Add .env.example documenting required variables

**Unprotected Registration Endpoint:**
- Risk: Anyone can register new users without invitation
- Files: `backend/src/modules/auth/controllers/auth.ts` (lines 27-33)
- Current mitigation: None
- Recommendations: 
  - Add @Public decorator to allow open registration during setup only
  - Implement proper invitation-only registration system
  - Add rate limiting on registration endpoint

**Unprotected Invitation Acceptance:**
- Risk: Anyone with a valid token can accept invitations
- Files: `backend/src/modules/auth/controllers/auth.ts` (lines 51-56)
- Current mitigation: None
- Recommendations: Add validation for token expiration and usage

**CORS Allowlist Contains Multiple Variants:**
- Risk: Configuration includes non-https variants which may be unexpected
- Files: `backend/src/main.ts` (lines 55-62)
- Current mitigation: None
- Recommendations: Review and restrict to production domains only

## Performance Bottlenecks

**N+1 Query Patterns in Billing Generation:**
- Problem: Loop queries database for each client/machine
- Files: `backend/src/modules/billings/billings.service.ts` (lines 501-599)
- Cause: Multiple individual queries inside for-loops instead of batch queries
- Improvement path: Use batch queries with IN clauses, consider pagination

**Multiple Similar Relations Loaded:**
- Problem: findOne methods load all relations even when not needed
- Files: 
  - `backend/src/modules/billings/billings.service.ts` (lines 82-104)
  - `backend/src/modules/services/service/services.ts` (lines 96-107)
- Cause: No option to specify which relations to load
- Improvement path: Add DTO options to specify relations, implement DataLoader pattern for batched loading

**Missing Database Indexes:**
- Problem: No explicit indexes defined for frequently queried fields
- Files: `backend/src/migrations/1765399057001-InitialSchema.ts`
- Impact: Queries on filtered fields may be slow as data grows
- Improvement path: Add indexes on: client_id, city_id, status, datetime_expiration

## Fragile Areas

**Billing Update Side Effects:**
- Why fragile: Multiple implicit side effects when updating billing counters
- Files: `backend/src/modules/billings/billings.service.ts` (lines 219-253)
- Safe modification: Add transactional wrapper, separate concerns into dedicated methods
- Test coverage: No dedicated tests for counter update logic

**Service Status Auto-Update Logic:**
- Why fragile: Complex status propagation with multiple conditions
- Files: `backend/src/modules/services/service/services.ts` (lines 261-290)
- Safe modification: Document state transitions, add explicit state machine
- Test coverage: No tests for updateServiceStatus method

**Manual Role Checks:**
- Why fragile: Role-based permissions checked inline instead of using RolesGuard decorator consistently
- Files: `backend/src/modules/billings/billings.service.ts` (lines 156-167)
- Safe modification: Apply @Roles decorator at controller level, remove manual checks from service

**Boleto Service Creation Logic:**
- Why fragile: Multiple conditions determine if/how service is created
- Files: `backend/src/modules/billings/billings.service.ts` (lines 305-411)
- Safe modification: Extract into dedicated BoletoBillingService
- Test coverage: No tests

## Scaling Limits

**In-Memory Authentication:**
- Current capacity: Single instance, no session sharing
- Limit: Cannot scale horizontally without external session store
- Scaling path: Implement Redis-based session/token storage

**Complex Join Queries:**
- Current capacity: Functional with current data volume
- Limit: Queries with 6+ LEFT JOINs will degrade with large datasets
- Scaling path: Add caching layer, consider read replicas

## Dependencies at Risk

**NestJS Passpot JWT:**
- Risk: Depends on older passport-jwt strategy
- Impact: Authentication breaks if package has breaking changes
- Migration plan: Consider migrating to @nestjs/jwt and JWT-based auth only

## Test Coverage Gaps

**Missing Unit Tests for Services:**
- What's not tested: 
  - BillingsService (no tests at all)
  - DashboardService
  - Most service layer classes
- Files: 
  - `backend/src/modules/billings/billings.service.ts`
  - `backend/src/modules/dashboard/dashboard.service.ts`
- Risk: Business logic changes could break silently
- Priority: High

**E2E Test Data Cleanup:**
- What's not tested: Proper test isolation between runs
- Files: `backend/test/*.e2e-spec.ts`
- Risk: Tests may fail due to stale data from previous runs
- Priority: Medium

**Frontend Test Coverage:**
- What's not tested: Most components and stores
- Files: `frontend/src/**/*.svelte`
- Risk: UI regressions not caught
- Priority: Medium

---

*Concerns audit: 2026-02-18*
