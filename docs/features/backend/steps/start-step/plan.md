# Feature: Start Step

## Feature summary

Changes a step's status from PENDING to IN_PROGRESS, indicating that work on the step has begun. Only the assigned responsable (user) can start their assigned steps. This action initiates the active work phase of a service step.

## User value

**What problem it solves:**
- Enables field technicians to mark steps as in progress
- Provides workflow status tracking for service management
- Indicates when work has actually begun on a step
- Supports time tracking and progress monitoring

**Who benefits:**
- Field technicians executing service steps
- Service managers tracking step progress
- Administrators monitoring workflow status

## Scope

### In scope
- Status transition from PENDING to IN_PROGRESS
- Validation that step is assigned to current user
- Validation that step is in PENDING status
- Return updated step with new status

### Out of scope
- Automatic step assignment
- Step reassignment
- Time tracking integration
- Step notes or comments

## User flow

1. User (responsable) requests to start a step by ID
2. System validates step exists
3. System validates step is assigned to current user
4. System validates step status is PENDING
5. System updates step status to IN_PROGRESS
6. System saves updated step
7. System returns updated step
8. **Error state**: Step not found → 404 Not Found
9. **Error state**: Step not assigned to user → 400 Bad Request
10. **Error state**: Step not in PENDING status → 400 Bad Request

## Acceptance criteria

- Step assigned to current user and in PENDING status is started successfully
- Step status changes to IN_PROGRESS
- Only assigned responsable can start the step
- Step must be in PENDING status to be started
- Invalid step ID returns 404 error
- Unauthorized user returns 400 error

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `PATCH /steps/:id/start`: Updates step status to IN_PROGRESS, returns updated step

**Main rules/validations:**
- Requires JWT authentication
- Step must exist
- Step must be assigned to current user (responsable)
- Step status must be PENDING
- Status is updated to IN_PROGRESS

## Data & permissions

**Entities/tables/collections:**
- `Step`: Read to validate, Update to change status

**Roles/permissions:**
- Requires JWT authentication
- Only the assigned responsable (user) can start their steps
- Admins/managers may have override permissions (needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid step ID: Returns 404 Not Found
- Step not assigned to user: Returns 400 Bad Request
- Step already in progress: Returns 400 Bad Request
- Step already concluded: Returns 400 Bad Request

**Missing data:**
- Step not found: Returns 404 Not Found

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized
- Step assigned to different user: Returns 400 Bad Request

**Network / integration failure cases:**
- Database connection failure: Returns 500 error

## Observability

**Logs/events:**
- Step start actions should be logged
- Failed start attempts can be logged
- Status transitions should be logged for audit

**Metrics (optional):**
- Steps started per day
- Average time from step creation to start
- Step start failure rate

## Open questions

- Can admins/managers start steps assigned to other users?
- Should step start trigger notifications?
- Is there a time limit for starting steps after creation?
