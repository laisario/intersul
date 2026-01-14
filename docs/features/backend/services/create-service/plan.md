# Feature: Create Service

## Feature summary

Creates a new service record in the system. Services represent work orders for copy machine maintenance, rentals, sales, or supplies. The service is associated with a client, category, and optionally a client copy machine. Service creation may automatically generate workflow steps based on the service category.

## User value

**What problem it solves:**
- Enables service providers to create new work orders
- Establishes service records for tracking and workflow management
- Links services to clients and copy machines
- Initiates service workflow with automatic step creation

**Who benefits:**
- Service managers creating new service orders
- Office administrators managing service requests
- Field technicians who will execute service steps

## Scope

### In scope
- Service creation with client, category, and optional copy machine
- Automatic workflow step generation based on category
- Service status initialization (typically PENDING)
- Service type assignment (maintenance, rental, sale, supplies)

### Out of scope
- Service editing (separate feature)
- Manual step creation during service creation
- Service duplication
- Bulk service creation

## User flow

1. User fills out service creation form (client, category, copy machine, etc.)
2. System validates required fields (client, category)
3. System creates service record
4. System generates workflow steps based on category template
5. System assigns steps to users (if assignment rules exist)
6. System returns created service with steps
7. **Error state**: Missing required fields → 400 Bad Request
8. **Error state**: Invalid client/category → 400 Bad Request

## Acceptance criteria

- Service with valid data is created successfully
- Workflow steps are automatically generated from category template
- Service is associated with correct client and category
- Service status is initialized appropriately
- Response includes service with generated steps
- Only ADMIN and MANAGER roles can create services

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /services`: Accepts CreateServiceDto, creates service and steps, returns service

**Main rules/validations:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role
- Client must exist
- Category must exist
- Client copy machine must exist (if provided)
- Steps are generated from category's step templates

## Data & permissions

**Entities/tables/collections:**
- `Service`: Create operation
- `Step`: Create operations for workflow steps
- `Category`: Read operation for step templates
- `Client`: Read operation for validation
- `ClientCopyMachine`: Read operation for validation

**Roles/permissions:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role
- Regular users cannot create services

## Edge cases & failures

**Validation errors:**
- Missing client: Returns 400 Bad Request
- Missing category: Returns 400 Bad Request
- Invalid client ID: Returns 400 Bad Request
- Invalid category ID: Returns 400 Bad Request

**Missing data:**
- Client not found: Returns 400 Bad Request or 404 Not Found
- Category not found: Returns 400 Bad Request or 404 Not Found
- Category has no step templates: Service created without steps (or error - needs confirmation)

**Permission denied:**
- Non-admin/manager user: Returns 403 Forbidden
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Step generation failure: Returns 500 error or partial creation

## Observability

**Logs/events:**
- Service creation should be logged
- Step generation should be logged
- Failed service creation attempts can be logged

**Metrics (optional):**
- Services created per day
- Average service creation time
- Step generation success rate

## Open questions

- What happens if category has no step templates?
- Are steps automatically assigned to users during creation?
- Can services be created without copy machines?
- What is the default service status?
