# Feature: Create Service

## Feature summary

Creates a new service record in the system. Services represent work orders for copy machine maintenance, rentals, sales, or supplies. The service is associated with a client, category, and optionally a client copy machine. Service creation may automatically generate workflow steps based on the service category. Services can include a price/value field. External services (is_internal = false) require payment fields (amount_to_receive, payment_method, is_invoiced) and automatically create payment-related steps.

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
- Service price/value field (optional)
- Automatic workflow step generation based on category
- Service status initialization (typically PENDING)
- Service type assignment (maintenance, rental, sale, supplies)
- External service payment fields (amount_to_receive, payment_method, is_invoiced) - required when is_internal = false
- Automatic step creation for external services: "Realizar pagamento" step
- Automatic step creation for boleto payment method: "Cobrança de boleto" step

### Out of scope
- Service editing (separate feature)
- Manual step creation during service creation
- Service duplication
- Bulk service creation

## User flow

1. User fills out service creation form (client, category, copy machine, price, etc.)
2. User selects service type (internal or external)
3. If external service (is_internal = false):
   - User must fill payment fields: amount_to_receive, payment_method, is_invoiced
   - System validates payment fields are provided
4. System validates required fields (client, category)
5. System validates external service payment fields if is_internal = false
6. System creates service record
7. System generates workflow steps based on category template
8. If external service:
   - System automatically creates "Realizar pagamento" step
   - If payment_method is BOLETO, system creates additional "Cobrança de boleto" step
9. System assigns steps to users (if assignment rules exist)
10. System returns created service with steps
11. **Error state**: Missing required fields → 400 Bad Request
12. **Error state**: Invalid client/category → 400 Bad Request
13. **Error state**: External service missing payment fields → 400 Bad Request

## Acceptance criteria

- Service with valid data is created successfully
- Service price field can be set (optional)
- Workflow steps are automatically generated from category template
- Service is associated with correct client and category
- Service status is initialized appropriately
- Response includes service with generated steps
- Only ADMIN and MANAGER roles can create services
- External services (is_internal = false) require amount_to_receive, payment_method, and is_invoiced fields
- External services automatically create "Realizar pagamento" step
- External services with BOLETO payment method automatically create "Cobrança de boleto" step

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
- Service price field is optional
- If is_internal = false (external service):
  - amount_to_receive is required (must be a positive number)
  - payment_method is required (must be a valid payment method string)
  - is_invoiced is required (boolean, defaults to false)
- Steps are generated from category's step templates
- External services automatically create "Realizar pagamento" step with:
  - Name: "Realizar pagamento"
  - Description: Instructions to check the amount_to_receive value from the service
  - Allows responsable user selection
  - Inherits all default step properties
- If payment_method is "BOLETO" or "Bank Slip", automatically creates additional step:
  - Category: "Cobrança de boleto"
  - Created at the same time as "Realizar pagamento" step

## Data & permissions

**Entities/tables/collections:**
- `Service`: Create operation (includes price field, payment fields for external services)
- `Step`: Create operations for workflow steps (including automatic payment steps)
- `Category`: Read operation for step templates and "Cobrança de boleto" category
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
- External service missing amount_to_receive: Returns 400 Bad Request
- External service missing payment_method: Returns 400 Bad Request
- External service missing is_invoiced: Returns 400 Bad Request
- Invalid amount_to_receive (negative or zero): Returns 400 Bad Request
- Invalid payment_method: Returns 400 Bad Request

**Missing data:**
- Client not found: Returns 400 Bad Request or 404 Not Found
- Category not found: Returns 400 Bad Request or 404 Not Found
- Category has no step templates: Service created without steps (or error - needs confirmation)
- "Cobrança de boleto" category not found when creating boleto step: Returns 500 error or creates category automatically

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
- How does service price impact billing calculations?
- Should service price be included in reports and dashboards?