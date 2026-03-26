# Feature: List Services

Retrieves a **paginated** list of services with optional filters (category, client, copy machine, city, acquisition type), **optional client name search**, and **sorting** by priority, status, or creation date. List items include **steps** and each step’s **responsible user** (`responsable`) loaded in a second query to avoid N+1 and broken pagination. Response includes payment-related fields for external services where applicable.

## Query parameters (`GET /services`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `category_id` | number | Filter by category |
| `client_id` | number | Filter by client |
| `client_copy_machine_id` | number | Filter by client copy machine |
| `city_id` | number | Filter by client city |
| `acquisition_type` | enum | Filter by machine acquisition type |
| `search` | string | Substring match on `client.name`. When set, results are ordered by **`client.name` ASC**, then **`service.created_at` DESC** (TypeORM-safe; raw `CASE WHEN client.name …` in `ORDER BY` is not used because TypeORM mis-parses expressions that contain `client.name`). **`sort_by` / `sort_order` are ignored** while `search` is present. |
| `sort_by` | `priority` \| `status` \| `created_at` | Sort field (only when `search` is empty). Invalid values fall back to `created_at`. |
| `sort_order` | `asc` \| `desc` | Sort direction (default `desc` for `created_at`; use `asc`/`desc` for priority/status). |
| `page` | number | Page (1-based) |
| `limit` | number | Page size (max 100) |

## Response shape

Paginated envelope: `{ data, total, page, limit, totalPages }`. Each service includes relations needed for the list UI: `client` (with address → neighborhood → city → state), `category`, `clientCopyMachine` (+ catalog), **`steps`** sorted by `id`, each step with **`responsable`** (user name for assignee).

## User value

**What problem it solves:**
- Provides functionality for managing services data
- Supports operational workflows and data management
- Enables users to interact with services information

**Who benefits:**
- Users managing services data
- Administrators maintaining system information
- Field technicians accessing services details

## Scope

### In scope
- Core list services functionality
- Data validation and error handling
- Authentication and authorization checks

### Out of scope
- Full-text / fuzzy search beyond client name `LIKE`
- Bulk operations
- Export functionality
- Advanced reporting

## User flow

1. User initiates list services action
2. System validates request and permissions
3. System processes list services operation
4. System returns result or confirmation
5. **Error state**: Validation failure → 400 Bad Request
6. **Error state**: Not found → 404 Not Found
7. **Error state**: Permission denied → 403 Forbidden

## Acceptance criteria

- Valid request successfully completes list services operation
- Response includes service price field for each service (if set)
- Response includes payment fields (amount_to_receive, payment_method, is_invoiced) for external services
- Invalid data returns appropriate error response
- Permission checks are enforced
- Response includes expected data structure

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /services`: Handles list services operation

**Main rules/validations:**
- Requires JWT authentication (unless public endpoint)
- Input validation through DTOs
- Business rule validation
- Permission checks based on user role

## Data & permissions

**Entities/tables/collections:**
- `Services`: Primary entity operations
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
- list services operations should be logged
- Failed attempts can be logged
- Error conditions should be logged

**Metrics (optional):**
- list services operation frequency
- Average response time
- Success/failure rates

## Open questions

- What are the specific role requirements for this operation?
- Are there any business rules that need clarification?
- Should there be rate limiting on this endpoint?
