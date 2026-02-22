# Feature: List Franchises

Retrieves franchise plans in the system with optional filtering. Returns franchises with pricing and feature details. Supports filtering by period, color (colorida), and paper type (tipo de papel).

## User value

**What problem it solves:**
- Provides functionality for managing copy machines data
- Supports operational workflows and data management
- Enables users to interact with copy machines information

**Who benefits:**
- Users managing copy machines data
- Administrators maintaining system information
- Field technicians accessing copy machines details

## Scope

### In scope
- Core list franchises functionality
- Filtering by period (period field - string match)
- Filtering by color (color field - boolean)
- Filtering by paper type (paper_type field - string match)
- Data validation and error handling
- Authentication and authorization checks

### Out of scope
- Advanced filtering and search beyond period, color, and paper type
- Bulk operations
- Export functionality
- Advanced reporting

## User flow

1. User initiates list franchises action with optional query parameters
2. User can provide filter parameters: period, color, paper_type
3. System validates request and permissions
4. System validates filter parameters (period and paper_type as strings, color as boolean)
5. System applies filters to query (if provided)
6. System processes list franchises operation with applied filters
7. System returns filtered result or all franchises if no filters provided
8. **Error state**: Validation failure → 400 Bad Request
9. **Error state**: Not found → 404 Not Found
10. **Error state**: Permission denied → 403 Forbidden

## Acceptance criteria

- Valid request successfully completes list franchises operation
- Filtering by period returns only franchises matching the period string
- Filtering by color (true/false) returns only franchises with matching color value
- Filtering by paper_type returns only franchises matching the paper type string
- Multiple filters can be combined (AND logic)
- Invalid filter data returns appropriate error response
- Permission checks are enforced
- Response includes expected data structure with filtered results

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /copy-machines/franchise`: Handles list franchises operation with optional query parameters

**Query parameters:**
- `period` (optional, string): Filters franchises by period field (exact or partial match)
- `color` (optional, boolean): Filters franchises by color field (true for colorida, false for non-colorida)
- `paper_type` (optional, string): Filters franchises by paper_type field (exact or partial match)

**Main rules/validations:**
- Requires JWT authentication (unless public endpoint)
- Filter parameters are optional - if not provided, returns all franchises
- Period filter: Applied as string match on franchise.period field
- Color filter: Applied as boolean match on franchise.color field (true = colorida, false = não colorida)
- Paper type filter: Applied as string match on franchise.paper_type field
- Multiple filters are combined with AND logic
- Input validation through DTOs or query parameter validation
- Business rule validation
- Permission checks based on user role

## Data & permissions

**Entities/tables/collections:**
- `Franchise`: Read operations with filtering on period, color, and paper_type fields
- Related entities as needed

**Roles/permissions:**
- Requires JWT authentication
- Role-based access control (specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Invalid input data: Returns 400 Bad Request
- Invalid color filter (not boolean): Returns 400 Bad Request
- Invalid period filter format: Returns 400 Bad Request
- Invalid paper_type filter format: Returns 400 Bad Request

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
- list franchises operations should be logged
- Failed attempts can be logged
- Error conditions should be logged

**Metrics (optional):**
- list franchises operation frequency
- Average response time
- Success/failure rates

## Open questions

- What are the specific role requirements for this operation?
- Are there any business rules that need clarification?
- Should there be rate limiting on this endpoint?
