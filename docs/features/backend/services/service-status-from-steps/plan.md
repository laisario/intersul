# Feature: Service Status Auto-Update Based on Steps

## Feature summary

Derives the Service status automatically from the statuses of its Steps (Etapas). Whenever a Step is created, updated (especially status changes), or deleted, the system must recalculate and persist the parent Service status according to deterministic business rules. Logic must live in the backend (ServicesService.recalculateStatus), be triggered from StepService and ServicesService, and use transactional consistency when updating step and service together.

**Current behavior (as-is):** ServicesService.updateServiceStatus exists but implements partial logic: only updates Service to IN_PROGRESS when at least one Step is IN_PROGRESS; does not set Service to CONCLUDED when all Steps are concluded; does not set Service to PENDING when all Steps are pending; skips update when Service is CONCLUDED or CANCELLED. Called from startStep, concludeStep, cancelStep, and ServicesService.update. Not called from ServicesService.create or StepService.update (when status changes).

**New behavior (to-be):** Service status is fully derived from Step statuses. Recalculation runs on every Step create, update (status), and delete. Centralized in recalculateStatus. Transactional updates when Step and Service change together.

## User value

**What problem it solves:**
- Eliminates inconsistencies between Service status and Step statuses
- Ensures dashboards, filters, and reports show accurate service progress
- Removes need for manual status synchronization
- Provides a single source of truth derived from workflow steps

**Who benefits:**
- Service managers tracking workflow progress
- Administrators running reports and dashboards
- Field technicians and users who rely on accurate service status

## Scope

### In scope
- Automatic Service status recalculation when Steps change
- Centralized domain logic (ServicesService.recalculateStatus)
- Triggers on Step create, update (status), and delete
- Transactional safety when updating Step and Service together
- Business rules: all CONCLUDED → CONCLUDED; all PENDING → PENDING; mixed or any IN_PROGRESS → IN_PROGRESS; no steps → PENDING

### Out of scope
- Manual Service status override (to be decided separately)
- Frontend-driven status updates
- Historical status audit trail (separate feature)
- Real-time push notifications on status change

## User flow

1. User performs an action that creates, updates (status), or deletes a Step
2. System validates request and permissions (per existing step endpoints)
3. System persists Step change
4. System calls recalculateStatus(serviceId) to derive Service status from Steps
5. System applies business rules and updates Service.status if changed
6. System returns result (step or service as applicable)
7. **Error state**: Validation failure → 400 Bad Request
8. **Error state**: Not found → 404 Not Found
9. **Error state**: Permission denied → 403 Forbidden

## Acceptance criteria

- Service status is derived from Step statuses per business rules
- Recalculation runs when Step is created, updated (status), or deleted
- Logic is centralized in ServicesService (recalculateStatus)
- No frontend logic for status derivation
- Transactional safety when Step and Service updated together
- All steps CONCLUDED → Service CONCLUDED
- All steps PENDING → Service PENDING
- Mixed statuses or any IN_PROGRESS → Service IN_PROGRESS
- No steps → Service PENDING
- Migration script available to fix existing inconsistent data (if needed)

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- Step create (via ServicesService.create or ServicesService.update with new steps)
- Step update (PATCH /steps/:id when status changes)
- Step status transitions: PATCH /steps/:id/start, PATCH /steps/:id/conclude, PATCH /steps/:id/cancel
- Step delete (if implemented)

**Main rules/validations:**
- Requires JWT authentication (per existing endpoints)
- ServicesService.recalculateStatus(serviceId) must be called after Step changes
- Business rules: all Steps CONCLUDED → Service CONCLUDED; all PENDING → PENDING; mixed or any IN_PROGRESS → IN_PROGRESS; no steps → PENDING
- Logic must not be duplicated across controllers; must be in domain service
- Prefer wrapping Step save + recalculateStatus in transaction for atomicity
- Data consistency: logic must be backend-only (not frontend) to avoid race conditions and stale data

## Data & permissions

**Entities/tables/collections:**
- `Service`: Update operation (status field derived from Steps)
- `Step`: Create, Update, Delete operations (trigger recalculateStatus)

**Roles/permissions:**
- Requires JWT authentication (per existing step endpoints)
- Same permissions as underlying Step operations

## Edge cases & failures

**Edge cases:**
- Service has no Steps → Service.status = PENDING
- Removing last Step → After delete, recalculateStatus; no Steps → PENDING
- Reverting last Step from CONCLUDED to PENDING → Service was CONCLUDED → becomes PENDING or IN_PROGRESS
- All Steps CANCELLED → Define: CONCLUDED (workflow done) or PENDING (product decision)
- Service CANCELLED manually → Option: skip recalc to preserve manual cancel; or allow override
- Step without service_id → No recalculateStatus call (no-op)
- Concurrent Step updates → Last write wins; recalc uses current Step state

**Validation errors:**
- Invalid step/service ID: Returns 400/404 per existing endpoints

**Missing data:**
- Service not found: recalculateStatus should no-op (no throw)

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized (per existing endpoints)
- Insufficient permissions: Returns 403 Forbidden (per existing endpoints)

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Transaction rollback if Step save succeeds but Service update fails

## Observability

**Logs/events:**
- Service status recalculations can be logged
- Failed recalculations can be logged
- Status transitions can be logged for audit

**Metrics (optional):**
- Recalculations triggered per day
- Average time for recalculateStatus
- Success/failure rate of status derivation

## Open questions

- Should manual Service CANCELLED be preserved (skip recalc)?
- How to handle all Steps CANCELLED (Service CONCLUDED or PENDING)?
- Is there or will there be a DELETE /steps/:id endpoint?
- Does StepService.update allow status changes today?
- Should ServicesService.create call recalculateStatus after creating steps?
- Suggested tests: Unit tests for recalculateStatus (all rule combinations); integration tests for startStep, concludeStep, cancelStep, update with status; edge case: Service CANCELLED → recalc skipped
- Migration: Run recalculateStatus for all Services to fix existing inconsistent data?
