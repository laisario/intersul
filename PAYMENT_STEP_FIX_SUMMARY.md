# Payment Step Creation & Boleto Validation Fix - Implementation Summary

## Update (conditional payment)

External services no longer always get a payment step. The API accepts **`has_payment`** (boolean). The main UI (`service-form-dialog.svelte`) defaults payment off and sends payment fields only when **“Serviço com pagamento”** is checked. If **`has_payment` is omitted** on create but the body still has a positive **`amount_to_receive`** and/or non-empty **`payment_method`**, payment steps are still created (**legacy** for older clients). See `docs/features/backend/services/create-service/plan.md`.

---

## Overview (historical)
Previously fixed the Create Service flow so payment steps could be generated for external services even without `amount_to_receive`, with responsable optional for boleto steps. Field-level error handling was improved.

## Files Changed

### Backend (2 files)

1. **`backend/src/modules/services/service/services.ts`**
   - Added auto-generation of payment step for external services (always, regardless of amount)
   - Added auto-generation of boleto step when payment method is Boleto
   - Made responsable optional for all steps (especially boleto)
   - Improved error messages to include field paths

2. **`backend/src/common/filters/http-exception.filter.ts`**
   - Updated to preserve field-level errors from ValidationPipe
   - Now returns `errors` array in response for field-specific validation failures

### Frontend (1 file)

1. **`frontend/src/lib/components/service-form-dialog.svelte`**
   - Changed `shouldShowPaymentPreview` to always be true for external services (not dependent on amount)
   - Removed validation requiring responsable for payment and boleto steps
   - Updated payment step generation to always include it in payload (even without responsable)
   - Updated boleto step generation to always include it in payload (even without responsable)
   - Added error mapping from backend response to form fields
   - Updated payment step description to handle null amount case

## New Step Generation Logic

### Backend Auto-Generation

The backend now automatically generates payment steps for external services:

1. **Payment Step** (always for external services):
   - Name: "Realizar pagamento"
   - Description:
     - If `amount_to_receive` is provided: `"Realizar pagamento. Consulte o valor informado no serviço: R$ {amount}."`
     - If `amount_to_receive` is null/undefined: `"Realizar pagamento. O valor será definido posteriormente na etapa de pagamento."`
   - Responsable: Optional (can be null)
   - Status: PENDING
   - Amount: Stored in service `amount_to_receive` field (can be null)

2. **Boleto Step** (only if payment method is Boleto):
   - Name: "Cobrança de boleto"
   - Description: "Gerar/realizar cobrança via boleto para o serviço."
   - Responsable: Optional (can be null) - **This is the key fix**
   - Status: PENDING
   - Category: Auto-created "Cobrança de Boleto" category if it doesn't exist

### Pending Amount Representation

When `amount_to_receive` is not provided:
- Service entity: `amount_to_receive = null`
- Payment step description: Indicates amount will be set later
- Billing entity: `amount_to_receive = null` (when billing is created from step)
- Step details page: User can set amount later via billing update endpoint

## Example Request Payloads

### 1. External Service with Amount Provided

```json
{
  "isInternal": false,
  "clientId": 1,
  "categoryId": 2,
  "amountToReceive": 150.00,
  "paymentMethod": "PIX",
  "isInvoiced": false,
  "steps": [
    {
      "name": "Realizar pagamento",
      "description": "Realizar pagamento. Consulte o valor informado no serviço: R$ 150.00.",
      "responsableId": 3,
      "datetimeExpiration": "2025-03-15T23:59:59.999Z"
    }
  ]
}
```

**Backend Behavior:**
- Creates service with `amount_to_receive = 150.00`
- Creates payment step with description including amount
- If payment step already in payload, uses it; otherwise auto-generates

### 2. External Service without Amount

```json
{
  "isInternal": false,
  "clientId": 1,
  "categoryId": 2,
  "paymentMethod": "Cash",
  "isInvoiced": false,
  "steps": [
    {
      "name": "Realizar pagamento",
      "description": "Realizar pagamento. O valor será definido posteriormente na etapa de pagamento.",
      "responsableId": null,
      "datetimeExpiration": null
    }
  ]
}
```

**Backend Behavior:**
- Creates service with `amount_to_receive = null`
- Creates payment step with "pending amount" description
- Payment step can be created without responsable
- Amount can be set later in step details page

### 3. External Service with Boleto (No Responsable)

```json
{
  "isInternal": false,
  "clientId": 1,
  "categoryId": 2,
  "paymentMethod": "Bank Slip",
  "isInvoiced": false,
  "steps": [
    {
      "name": "Realizar pagamento",
      "description": "Realizar pagamento. O valor será definido posteriormente na etapa de pagamento.",
      "responsableId": null
    },
    {
      "name": "Cobrança de boleto",
      "description": "Gerar/realizar cobrança via boleto para o serviço.",
      "responsableId": null
    }
  ]
}
```

**Backend Behavior:**
- Creates service with payment method "Bank Slip"
- Creates payment step (without responsable - OK)
- Creates boleto step (without responsable - OK) - **This was previously failing**
- Both steps can have responsable set later

### 4. External Service - Backend Auto-Generates Steps

```json
{
  "isInternal": false,
  "clientId": 1,
  "categoryId": 2,
  "amountToReceive": null,
  "paymentMethod": "Fiado",
  "isInvoiced": false,
  "steps": []
}
```

**Backend Behavior:**
- Creates service
- **Auto-generates payment step** even though not in payload
- Payment step has null responsable and "pending amount" description
- No boleto step (payment method is not Boleto)

## Example Error Response Structure

### Field-Level Validation Error

```json
{
  "statusCode": 400,
  "timestamp": "2025-03-03T13:00:00.000Z",
  "path": "/services",
  "method": "POST",
  "message": "Validation failed",
  "errors": [
    {
      "field": "steps[0].responsable_id",
      "message": "User with ID 999 not found",
      "value": 999,
      "constraints": {}
    },
    {
      "field": "client_id",
      "message": "client_id must be a number",
      "value": "invalid",
      "constraints": {
        "isNumber": "client_id must be a number"
      }
    }
  ]
}
```

### Generic Domain Error

```json
{
  "statusCode": 400,
  "timestamp": "2025-03-03T13:00:00.000Z",
  "path": "/services",
  "method": "POST",
  "message": "Cliente com id 999 não encontrado"
}
```

## Frontend Error Mapping

The frontend now maps backend errors to form fields:

- `amount_to_receive` → `errors.amountToReceive`
- `payment_method` → `errors.paymentMethod`
- `steps[0].responsable_id` → `errors.steps.0.responsableId`
- `client_id` → `errors.clientId`
- `category_id` → `errors.categoryId`

Errors are displayed:
1. Field-specific errors near the relevant input
2. General error toast with summary message

## Testing Checklist

### ✅ Create Service without Amount
- [x] Create external service with no `amountToReceive`
- [x] Verify service is created successfully
- [x] Verify payment step is auto-generated
- [x] Verify payment step description says "valor será definido posteriormente"
- [x] Verify payment step can be created without responsable

### ✅ Create Service with Amount
- [x] Create external service with `amountToReceive = 150.00`
- [x] Verify service is created with amount
- [x] Verify payment step includes amount in description
- [x] Verify payment step can be created without responsable

### ✅ Create Service with Boleto (No Responsable)
- [x] Create external service with `paymentMethod = "Bank Slip"`
- [x] Do NOT set responsable for boleto step
- [x] Verify service is created successfully
- [x] Verify boleto step is created without responsable
- [x] Verify no validation error about missing responsable

### ✅ Error Handling
- [x] Create service with invalid `clientId` (e.g., 999)
- [x] Verify error message shows field-specific error: `errors.clientId`
- [x] Verify error is displayed near client select field
- [x] Verify generic error toast also appears

### ✅ Step Details - Set Amount Later
- [x] Create service without amount
- [x] Navigate to payment step details page
- [x] Verify amount field is editable (null/empty)
- [x] Set amount via billing update
- [x] Verify amount is saved correctly

## Breaking Changes

**None** - All changes are backwards compatible:
- Existing services with amount continue to work
- Existing services with responsable continue to work
- New services can now be created without amount or responsable (for boleto)

## Migration Notes

No database migrations required - all changes are in application logic.

## Key Improvements

1. **Payment step always generated**: External services always get a payment step, even without amount
2. **Boleto without responsable**: Boleto steps can be created without responsable (can be set later)
3. **Better error messages**: Field-level errors are now properly mapped and displayed
4. **Pending amount handling**: Clear indication when amount will be set later
5. **Backend auto-generation**: Backend ensures payment steps exist even if frontend doesn't send them
