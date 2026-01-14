# Feature: Update Client

## Feature summary

Updates an existing client record with new information. Allows modification of client details, contact information, and address data. Validates input and ensures client exists before updating.

## User value

**What problem it solves:**
- Enables correction of client information errors
- Supports client data maintenance and updates
- Allows address changes when clients relocate
- Maintains data accuracy over time

**Who benefits:**
- Service managers updating client information
- Office administrators maintaining client database
- Users correcting data entry errors

## Scope

### In scope
- Update client fields (name, contact info, etc.)
- Update address information
- Partial updates (only provided fields)
- Client existence validation

### Out of scope
- Client status changes (separate toggle feature)
- Bulk client updates
- Client merge functionality
- Update history/audit trail

## User flow

1. User requests client update with ID and update data
2. System validates client exists
3. System validates update data
4. System updates client record with provided fields
5. System returns updated client data
6. **Error state**: Client not found → 404 Not Found
7. **Error state**: Invalid update data → 400 Bad Request

## Acceptance criteria

- Valid client ID and update data successfully updates client
- Partial updates only modify provided fields
- Address updates are properly processed
- Invalid client ID returns 404 error
- Invalid update data returns 400 error
- Response includes updated client with relations

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `PATCH /clients/:id`: Accepts UpdateClientDto, updates client, returns updated client

**Main rules/validations:**
- Requires JWT authentication
- Client ID must be valid integer
- Client must exist
- Update data is validated by DTO
- Partial updates supported (only provided fields updated)

## Data & permissions

**Entities/tables/collections:**
- `Client`: Update operation
- `Address`: Update operation if address fields provided

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can update clients (or specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid ID format: Returns 400 Bad Request or 404 Not Found
- Invalid update data: Returns 400 Bad Request
- Invalid address format: Returns 400 Bad Request

**Missing data:**
- Client not found: Returns 404 Not Found

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Constraint violation: Returns 400 Bad Request or 500 error

## Observability

**Logs/events:**
- Client updates should be logged
- Failed update attempts can be logged

**Metrics (optional):**
- Client update frequency
- Average update response time

## Open questions

- Which roles can update clients?
- Should address updates trigger location reprocessing?
- Is there an audit trail for client updates?
