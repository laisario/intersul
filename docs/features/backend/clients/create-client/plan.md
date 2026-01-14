# Feature: Create Client

## Feature summary

Creates a new client record in the system with contact information, address details, and optional relationship data. Clients represent customers who receive copy machine services.

## User value

**What problem it solves:**
- Enables service providers to register new customers
- Establishes client records for service tracking and history
- Supports address management for service delivery
- Provides foundation for client-service relationships

**Who benefits:**
- Service managers creating new client records
- Office administrators managing client database
- Field technicians who need client information

## Scope

### In scope
- Client creation with name, contact information
- Address creation and association
- Optional client metadata (phone, email, etc.)
- Client active status (defaults to active)

### Out of scope
- Client copy machine assignment (separate feature)
- Service creation during client creation
- Bulk client import
- Client duplicate detection

## User flow

1. User fills out client creation form with required fields
2. System validates required fields (name, address details)
3. System processes location data (state, city, neighborhood)
4. System creates client record with address
5. System returns created client with full details
6. **Error state**: Missing required fields → 400 Bad Request
7. **Error state**: Invalid location data → 400 Bad Request

## Acceptance criteria

- Client with valid data is created successfully
- Address is properly associated with client
- Location hierarchy (state, city, neighborhood) is correctly linked
- Client is created with active status by default
- Response includes complete client data with relations
- Client can be immediately used for service creation

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /clients`: Accepts CreateClientDto, creates client and address, returns client

**Main rules/validations:**
- Requires JWT authentication
- Client name is required
- Address location data must be valid (state, city, neighborhood)
- Location processing may involve ViaCEP integration or location service

## Data & permissions

**Entities/tables/collections:**
- `Client`: Create operation
- `Address`: Create operation and association
- `Neighborhood`, `City`, `State`: Read operations for location validation

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can create clients (or specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- Missing client name: Returns 400 Bad Request
- Invalid address format: Returns 400 Bad Request
- Invalid location data: Returns 400 Bad Request

**Missing data:**
- Location not found: Returns 400 Bad Request or creates location if auto-create enabled

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Location service failure: Returns 500 error or handles gracefully

## Observability

**Logs/events:**
- Client creation should be logged
- Location processing failures can be logged

**Metrics (optional):**
- Clients created per day
- Average client creation time

## Open questions

- Which roles can create clients?
- Should duplicate client detection be implemented?
- Is location auto-creation enabled if location doesn't exist?
