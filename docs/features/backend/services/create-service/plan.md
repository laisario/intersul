# Feature: Create Service

## Feature summary

Creates a new service record in the system. Services represent work orders for copy machine maintenance, rentals, sales, or supplies. The service is associated with a client, category, and optionally a client copy machine. Service creation may automatically generate workflow steps based on the service category. **Payment-related fields and automatic payment/boleto steps apply only when the client sends `has_payment: true` for an external service (`is_internal = false`).** When `has_payment` is false or omitted without legacy payment hints, no payment step is created and payment columns are stored as empty/null.

## User value

**What problem it solves:**
- Enables service providers to create new work orders
- Establishes service records for tracking and workflow management
- Links services to clients and copy machines
- Initiates service workflow with automatic step creation when configured

**Who benefits:**
- Service managers creating new service orders
- Office administrators managing service requests
- Field technicians who will execute service steps

## Scope

### In scope
- Service creation with client, category, and optional copy machine
- Service price/value field when payment is enabled (optional)
- Automatic workflow step generation from category suggestions (frontend) and/or payload steps
- Service status initialization (typically PENDING)
- External vs internal service (`is_internal`)
- **Explicit payment flag:** `has_payment` (boolean) for external services
- When `has_payment` is true: optional `amount_to_receive`, `payment_method`, `is_invoiced`; automatic **"Realizar pagamento"** step; if method is boleto/bank slip, automatic **"Cobrança de boleto"** step
- **Legacy API compatibility:** if `has_payment` is omitted on create and the body still includes a positive `amount_to_receive` and/or a non-empty `payment_method`, payment behavior is treated as enabled (same as before for integrations that never sent the flag)

### Out of scope
- Service editing (same form component handles edit; dedicated doc may cover PATCH nuances)
- Service duplication
- Bulk service creation (except billing flows elsewhere)

## User flow

1. User fills out service creation form (client, category, copy machine, description, etc.).
2. User selects service type (internal or external).
3. If external: user may enable **“Serviço com pagamento”**.
4. Only if payment is enabled: user can fill payment fields and sees payment/boleto step previews.
5. System creates the service; payment columns are null when payment is disabled.
6. If external and payment enabled: system creates **"Realizar pagamento"** (and boleto step when applicable); if disabled, those steps are not auto-created.
7. **Error state**: Invalid client/category → 400; invalid amounts when provided → 400.

## Acceptance criteria

- External service with `has_payment: false` (and no legacy amount/method) is created **without** automatic payment or boleto steps; payment fields remain empty.
- External service with `has_payment: true` behaves like the previous “always payment” flow: payment step (+ boleto when method matches).
- Internal services never create payment steps and clear payment fields.
- Legacy: external create without `has_payment` but with amount or method still enables payment steps.
- `POST /services` documents `has_payment` in OpenAPI/Swagger.

## Backend behavior

**Endpoints:** `POST /services` (`CreateServiceDto`), `PATCH /services/:id` (`UpdateServiceDto` inherits fields).

**Rules:**
- `has_payment` optional boolean.
- **Create:** `has_payment === false` → no auto payment/boleto steps; `amount_to_receive`, `payment_method` cleared; `is_invoiced` false. `has_payment === true` → existing payment + step rules. **Omit** + external → legacy inference from `amount_to_receive` / `payment_method`.
- **Update:** `has_payment` false clears payment columns and removes existing steps named **"Realizar pagamento"** or **"Cobrança de boleto"** (and does not auto-create them). Omit uses legacy + existing service state for partial patches.
- Payload steps matching those auto names are ignored when `has_payment` is false.

## Data & permissions

- `Service` stores `amount_to_receive`, `payment_method`, `is_invoiced` (nullable / defaulted per rules above).
- `has_payment` is **not** a database column; it is request-only metadata.

## Edge cases

- Turning payment off after editing must not leave orphan **"Realizar pagamento"** steps on the service (cleanup on update).
- Concluding a **"Realizar pagamento"** step still sets `is_invoiced` on the service when that step exists (unchanged).

## Observability

- Service and step creation failures should be traceable via existing application logging.
