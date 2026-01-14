# Feature: List Clients

## Feature summary

Retrieves all client records from the system, ordered by creation date (newest first). Returns complete client information including address and relationship data.

## User value

**What problem it solves:**
- Provides overview of all clients in the system
- Enables client search and selection for service creation
- Supports client management workflows
- Displays client information for quick reference

**Who benefits:**
- Service managers viewing client list
- Office administrators managing client database
- All users who need to select clients for services

## Scope

### In scope
- Retrieve all client records
- Include address and location information
- Order by creation date (descending)
- Return complete client data

### Out of scope
- Client filtering (by status, city, etc.)
- Client search functionality
- Pagination
- Client statistics aggregation

## User flow

1. User requests client list
2. System retrieves all clients from database
3. System includes related address and location data
4. System orders results by creation date
5. System returns client list
6. **Empty state**: No clients exist → Returns empty array

## Acceptance criteria

- All clients are returned in response
- Clients are ordered by creation date (newest first)
- Response includes client address and location information
- Empty list returns empty array (not error)
- Response excludes sensitive data if any

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /clients`: Returns array of all clients with relations

**Main rules/validations:**
- Requires JWT authentication
- Returns all clients regardless of active status (or filters by active - needs confirmation)
- Includes address and location relations in response

## Data & permissions

**Entities/tables/collections:**
- `Client`: Read operation with relations (address, services if included)

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can list clients

## Edge cases & failures

**Validation errors:**
- N/A (no input parameters)

**Missing data:**
- No clients exist: Returns empty array []

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error

## Observability

**Logs/events:**
- Client list access can be logged for audit purposes

**Metrics (optional):**
- Number of clients in system
- Average response time for client list

## Open questions

- Should inactive clients be filtered out?
- Is pagination needed for large client lists?
- Should client list include service count or other statistics?
