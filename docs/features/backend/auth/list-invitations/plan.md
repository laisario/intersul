# Feature: List User Invitations

## Feature summary

Retrieves all user invitations in the system, allowing administrators and managers to view pending invitations, track invitation status, and manage the onboarding process.

## User value

**What problem it solves:**
- Provides visibility into pending user invitations
- Enables tracking of invitation status (pending, accepted, expired)
- Helps administrators manage onboarding workflow
- Supports audit and compliance needs

**Who benefits:**
- Administrators and managers managing user onboarding
- System administrators tracking invitation activity

## Scope

### In scope
- Retrieve all invitation records
- Return invitation details including email, role, creator, status
- Filter by invitation status (if supported)
- Pagination support (if implemented)

### Out of scope
- Invitation editing
- Invitation cancellation
- Bulk operations
- Advanced filtering and search

## User flow

1. Administrator/Manager requests list of invitations
2. System retrieves all invitation records from database
3. System returns list of invitations with details
4. Frontend displays invitations in table or list view
5. **Empty state**: No invitations exist → Returns empty array

## Acceptance criteria

- All invitations are returned for authorized users
- Response includes invitation email, role, creator, creation date, status
- Only ADMIN and MANAGER roles can list invitations
- Empty list returns empty array (not error)

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /users/invitations`: Returns array of all invitations

**Main rules/validations:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role (RolesGuard)
- Returns all invitations regardless of status

## Data & permissions

**Entities/tables/collections:**
- `UserInvitation`: Read operation to retrieve all records

**Roles/permissions:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role
- Regular users cannot list invitations

## Edge cases & failures

**Validation errors:**
- N/A (no input parameters)

**Missing data:**
- No invitations exist: Returns empty array []

**Permission denied:**
- Non-admin/manager user: Returns 403 Forbidden
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error

## Observability

**Logs/events:**
- Invitation list access can be logged for audit purposes

**Metrics (optional):**
- Number of pending invitations
- Average time to invitation acceptance

## Open questions

- Should invitations be filtered by status (pending, accepted, expired)?
- Is pagination needed for large invitation lists?
- Should expired invitations be automatically cleaned up?
