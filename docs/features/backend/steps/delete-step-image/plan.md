# Feature: Delete Step Image

## Feature summary

Deletes an image from a step. Removes both the database record and the file from storage. Only the step responsable can delete images.

## User value

**What problem it solves:**
- Provides functionality for managing steps data
- Supports operational workflows and data management
- Enables users to interact with steps information

**Who benefits:**
- Users managing steps data
- Administrators maintaining system information
- Field technicians accessing steps details

## Scope

### In scope
- Core delete step image functionality
- Data validation and error handling
- Authentication and authorization checks

### Out of scope
- Advanced filtering and search (if not implemented)
- Bulk operations
- Export functionality
- Advanced reporting

## User flow

1. User initiates delete step image action
2. System validates request and permissions
3. System processes delete step image operation
4. System returns result or confirmation
5. **Error state**: Validation failure → 400 Bad Request
6. **Error state**: Not found → 404 Not Found
7. **Error state**: Permission denied → 403 Forbidden

## Acceptance criteria

- Valid request successfully completes delete step image operation
- Invalid data returns appropriate error response
- Permission checks are enforced
- Response includes expected data structure

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `DELETE /steps/:id/images/:imageId`: Handles delete step image operation

**Main rules/validations:**
- Requires JWT authentication (unless public endpoint)
- Input validation through DTOs
- Business rule validation
- Permission checks based on user role

## Data & permissions

**Entities/tables/collections:**
- `Steps`: Primary entity operations
- Related entities as needed

**Roles/permissions:**
- Requires JWT authentication
- Role-based access control (specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid input data: Returns 400 Bad Request
- Missing required fields: Returns 400 Bad Request

**Missing data:**
- Resource not found: Returns 404 Not Found

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized
- Insufficient permissions: Returns 403 Forbidden

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- External service failure: Returns 500 error (if applicable)

## Observability

**Logs/events:**
- delete step image operations should be logged
- Failed attempts can be logged
- Error conditions should be logged

**Metrics (optional):**
- delete step image operation frequency
- Average response time
- Success/failure rates

## Open questions

- What are the specific role requirements for this operation?
- Are there any business rules that need clarification?
- Should there be rate limiting on this endpoint?
