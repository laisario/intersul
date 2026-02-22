# Feature: Conclude Step

Changes a step's status from IN_PROGRESS to CONCLUDED, indicating work completion. Only the assigned responsable can conclude their steps. When concluding a "Realizar pagamento" step from an external service, automatically updates the service's is_invoiced field to true.

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
- Core conclude step functionality
- Automatic is_invoiced update for external service payment steps
- Data validation and error handling
- Authentication and authorization checks

### Out of scope
- Advanced filtering and search (if not implemented)
- Bulk operations
- Export functionality
- Advanced reporting

## User flow

1. User initiates conclude step action
2. System validates request and permissions
3. System processes conclude step operation
4. System checks if step is "Realizar pagamento" step from external service
5. If step is payment step from external service:
   - System updates service's is_invoiced field to true
   - System ensures consistency (only updates if step is being concluded)
6. System returns result or confirmation
7. **Error state**: Validation failure → 400 Bad Request
8. **Error state**: Not found → 404 Not Found
9. **Error state**: Permission denied → 403 Forbidden

## Acceptance criteria

- Valid request successfully completes conclude step operation
- When "Realizar pagamento" step from external service is concluded, service's is_invoiced is automatically set to true
- is_invoiced update only occurs when step status changes to CONCLUDED
- If step is reopened (status changed back from CONCLUDED), is_invoiced remains true (not reverted)
- Invalid data returns appropriate error response
- Permission checks are enforced
- Response includes expected data structure

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `PATCH /steps/:id/conclude`: Handles conclude step operation

**Main rules/validations:**
- Requires JWT authentication (unless public endpoint)
- Input validation through DTOs
- Business rule validation
- Permission checks based on user role
- When step is concluded:
  - Check if step name is "Realizar pagamento"
  - Check if step belongs to a service (service_id exists)
  - Check if service is external (is_internal = false)
  - If all conditions met, update service's is_invoiced field to true
- is_invoiced update is atomic with step conclusion (transaction)
- If step is reopened (status changed from CONCLUDED), is_invoiced field is NOT reverted to false (remains true for consistency)

## Data & permissions

**Entities/tables/collections:**
- `Step`: Update operation (status change to CONCLUDED)
- `Service`: Update operation (is_invoiced field when payment step is concluded)
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
- Service update failure after step conclusion: Returns 500 error (transaction should rollback)
- External service failure: Returns 500 error (if applicable)

## Observability

**Logs/events:**
- conclude step operations should be logged
- Failed attempts can be logged
- Error conditions should be logged

**Metrics (optional):**
- conclude step operation frequency
- Average response time
- Success/failure rates

## Open questions

- What are the specific role requirements for this operation?
- Are there any business rules that need clarification?
- Should there be rate limiting on this endpoint?
- Should is_invoiced be reverted if step is cancelled after being concluded?
- Should there be a log/audit trail when is_invoiced is automatically updated?