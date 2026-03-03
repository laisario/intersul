# Step Dependencies Implementation Summary

## Overview
Implemented sequential workflow dependencies for Service steps. Each step (except the first) must depend on the previous step being concluded before it can be started.

## Files Changed

### Backend (4 files)

1. **`backend/src/modules/services/entities/step.entity.ts`**
   - Added `depends_on_step_id` column (nullable integer)
   - Added `dependsOn` relation (ManyToOne self-reference)
   - Added `dependentSteps` relation (OneToMany)

2. **`backend/src/migrations/1772550132803-AddDependsOnStepIdToSteps.ts`**
   - Adds `depends_on_step_id` column to `steps` table
   - Creates foreign key constraint to `steps.id` with `SET NULL` on delete
   - Creates index for query performance
   - **Backward compatibility**: Migrates existing steps by setting dependencies based on creation order within each service

3. **`backend/src/modules/services/service/services.ts`**
   - Updated `create()` method to set step dependencies based on payload order
   - Uses transaction to ensure atomicity when creating steps and setting dependencies
   - Logic: `step[0].depends_on_step_id = null`, `step[i].depends_on_step_id = step[i-1].id`

4. **`backend/src/modules/services/service/step.ts`**
   - Updated `startStep()` to validate dependency before allowing status transition
   - If `depends_on_step_id` is set, checks that the previous step status is `CONCLUDED`
   - Returns structured error with field and message if validation fails
   - Updated `findOne()` to include `dependsOn` relation and compute `canStart` flag
   - Adds computed properties `canStart` and `blockReason` to API response

### Frontend (2 files)

1. **`frontend/src/lib/api/types/service.types.ts`**
   - Added `dependsOnStepId?: number | null` to `Step` interface
   - Added `dependsOn?: Step` to `Step` interface
   - Added `canStart?: boolean` computed property
   - Added `blockReason?: string` computed property

2. **`frontend/src/routes/(protected)/steps/[id]/+page.svelte`**
   - Updated "Começar Etapa" button to be disabled when previous step is not concluded
   - Shows clear blocking reason message when button is disabled
   - Enhanced error handling to display backend error messages
   - Uses `canStart` flag and `blockReason` from API response

## Migration Details

**File**: `1772550132803-AddDependsOnStepIdToSteps.ts`

**What it does:**
1. Adds `depends_on_step_id` column (nullable integer)
2. Creates foreign key constraint: `steps.depends_on_step_id` → `steps.id`
3. Creates index for performance
4. **Backward compatibility**: Sets dependencies for existing steps based on creation order within each service

**Backward Compatibility Approach:**
- **Option A (Implemented)**: Migrate existing steps by setting `depends_on_step_id` based on `created_at` and `id` order within each service
- This ensures all existing services have a dependency chain
- First step (by creation order) gets `depends_on_step_id = null`
- Subsequent steps depend on the previous step in creation order

## API Changes

### Step Details Response

**Before:**
```json
{
  "id": 1,
  "name": "Step 2",
  "status": "PENDING",
  ...
}
```

**After:**
```json
{
  "id": 1,
  "name": "Step 2",
  "status": "PENDING",
  "depends_on_step_id": 5,
  "dependsOn": {
    "id": 5,
    "name": "Step 1",
    "status": "CONCLUDED"
  },
  "canStart": true,
  "blockReason": null,
  ...
}
```

### Error Response (When Starting Step with Unconcluded Dependency)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Não é possível iniciar esta etapa porque a etapa anterior ainda não foi concluída.",
      "dependsOnStepId": 5
    }
  ]
}
```

## Example Payloads

### Create Service with Steps (Order Matters)

**Request:**
```json
{
  "client_id": 1,
  "category_id": 1,
  "description": "Service with sequential steps",
  "steps": [
    {
      "name": "Step 1",
      "description": "First step",
      "responsable_id": 1
    },
    {
      "name": "Step 2",
      "description": "Second step",
      "responsable_id": 2
    },
    {
      "name": "Step 3",
      "description": "Third step",
      "responsable_id": 3
    }
  ]
}
```

**Result:**
- `step1.depends_on_step_id = null` (first step)
- `step2.depends_on_step_id = step1.id` (depends on step 1)
- `step3.depends_on_step_id = step2.id` (depends on step 2)

## Frontend Behavior

### Step Details Page

**When Step Can Start:**
- Button "Começar Etapa" is **enabled**
- No blocking message shown

**When Step Cannot Start:**
- Button "Começar Etapa" is **disabled**
- Shows message: "Você precisa concluir a etapa anterior antes de iniciar esta."
- Message is styled in red

**Error Handling:**
- If user somehow triggers start (edge case), backend error is displayed
- Error message from backend is shown to user

## Validation Rules

1. **Step Creation:**
   - Dependencies are set automatically based on payload order
   - First step always has `depends_on_step_id = null`
   - Subsequent steps depend on previous step in array

2. **Step Start:**
   - Step must be in `PENDING` status
   - If `depends_on_step_id` is `null`, can start immediately
   - If `depends_on_step_id` is set, previous step must be `CONCLUDED`
   - Only the assigned responsable can start the step

3. **Backward Compatibility:**
   - Existing steps without dependencies are migrated
   - Migration sets dependencies based on creation order
   - All existing services will have sequential dependencies after migration

## Testing Checklist

### Backend Tests
- [ ] Creating service with 3 steps results in correct dependency chain
- [ ] Trying to start step2 while step1 is PENDING → 400 error
- [ ] Conclude step1, then start step2 → success
- [ ] Migration sets dependencies for existing steps correctly

### Frontend Manual Tests
- [ ] Step 1 start button enabled initially
- [ ] Step 2 start button disabled until step 1 concluded
- [ ] Step 3 start button disabled until step 2 concluded
- [ ] Blocking message displays correctly
- [ ] After concluding step 1, step 2 button becomes enabled
- [ ] Error message displays if backend validation fails

## Notes

- **Transaction Safety**: Step creation and dependency setting happen atomically in a transaction
- **Performance**: Index on `depends_on_step_id` ensures fast lookups
- **Cascade Behavior**: If a step is deleted, dependent steps have `depends_on_step_id` set to `NULL` (via FK constraint)
- **Order Preservation**: Dependencies follow the exact order of steps in the creation payload
- **Auto-generated Steps**: Payment and boleto steps also follow dependency chain (they are added after payload steps)
