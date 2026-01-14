# Feature: Delete Client

## Feature summary

Permanently deletes a client record from the system. This is a hard deletion that removes the client and may cascade to related records depending on database constraints. Use with caution as it cannot be undone.

## User value

**What problem it solves:**
- Enables removal of duplicate or erroneous client records
- Supports data cleanup and maintenance
- Allows permanent deletion when soft-delete (toggle active) is not sufficient

**Who benefits:**
- Administrators managing data quality
- Users correcting data entry mistakes
- System administrators performing data cleanup

## Scope

### In scope
- Permanent deletion of client record
- Cascade deletion behavior (depends on database constraints)
- Client existence validation before deletion

### Out of scope
- Soft deletion (use toggle-active feature instead)
- Bulk deletion
- Deletion confirmation workflow
- Deletion history/audit trail

## User flow

1. User requests client deletion with client ID
2. System validates client exists
3. System deletes client record (and related records if cascading)
4. System returns success response
5. **Error state**: Client not found → 404 Not Found
6. **Error state**: Client has active services → 400 Bad Request (if constraint exists)

## Acceptance criteria

- Valid client ID successfully deletes client
- Client is permanently removed from database
- Related records are handled according to cascade rules
- Invalid client ID returns 404 error
- Deletion returns success response (200 or 204)

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `DELETE /clients/:id`: Deletes client by ID, returns success

**Main rules/validations:**
- Requires JWT authentication
- Client ID must be valid integer
- Client must exist
- Cascade behavior depends on database foreign key constraints

## Data & permissions

**Entities/tables/collections:**
- `Client`: Delete operation
- Related entities: May be deleted or set to null depending on cascade rules

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can delete clients (or specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid ID format: Returns 400 Bad Request or 404 Not Found

**Missing data:**
- Client not found: Returns 404 Not Found

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Foreign key constraint violation: Returns 400 Bad Request or 500 error
- Client has active services: May return 400 Bad Request (if validation exists)

## Observability

**Logs/events:**
- Client deletions should be logged (critical operation)
- Failed deletion attempts can be logged
- Cascade deletions should be logged

**Metrics (optional):**
- Client deletion frequency
- Deletion failure rate

## Open questions

- Which roles can delete clients?
- Should deletion be prevented if client has active services?
- What is the cascade behavior for related records (services, addresses, copy machines)?
- Should there be a confirmation step or soft-delete preferred?
