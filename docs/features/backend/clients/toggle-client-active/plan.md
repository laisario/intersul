# Feature: Toggle Client Active Status

## Feature summary

Toggles a client's active status between active and inactive. Allows soft-deletion of clients by deactivating them without removing their data or service history. Useful for managing client relationships without data loss.

## User value

**What problem it solves:**
- Enables soft-deletion of clients without data loss
- Preserves service history for inactive clients
- Allows reactivation of previously inactive clients
- Supports client relationship management

**Who benefits:**
- Service managers managing client relationships
- Administrators maintaining client database
- Users who need to temporarily disable client access

## Scope

### In scope
- Toggle client active status (true ↔ false)
- Preserve all client data and service history
- Return updated client with new status

### Out of scope
- Hard deletion of clients
- Bulk status changes
- Status change history/audit
- Automatic status changes based on conditions

## User flow

1. User requests client status toggle with client ID
2. System validates client exists
3. System toggles active status (true → false or false → true)
4. System saves updated client
5. System returns updated client
6. **Error state**: Client not found → 404 Not Found

## Acceptance criteria

- Valid client ID successfully toggles status
- Status changes from active to inactive or vice versa
- Client data and service history are preserved
- Invalid client ID returns 404 error
- Response includes updated client with new status

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `PATCH /clients/:id/toggle-active`: Toggles client active status, returns updated client

**Main rules/validations:**
- Requires JWT authentication
- Client ID must be valid integer
- Client must exist
- Status is toggled (not set to specific value)

## Data & permissions

**Entities/tables/collections:**
- `Client`: Update operation on active field

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can toggle client status (or specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid ID format: Returns 400 Bad Request or 404 Not Found

**Missing data:**
- Client not found: Returns 404 Not Found

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error

## Observability

**Logs/events:**
- Client status changes should be logged
- Failed toggle attempts can be logged

**Metrics (optional):**
- Client activation/deactivation frequency
- Number of inactive clients

## Open questions

- Which roles can toggle client status?
- Should inactive clients be excluded from client lists?
- Are there business rules preventing deactivation of clients with active services?
