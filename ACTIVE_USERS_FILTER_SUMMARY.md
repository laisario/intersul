# Active Users Filter Implementation Summary

## Overview
Implemented a global rule to only show active users (`active === true`) in all user/employee selects across the application. **Exception**: Admin users list page shows ALL users (both active and inactive). Removed hard delete option from user details page, keeping only soft delete (deactivate).

## Files Changed

### Backend (4 files)

1. **`backend/src/modules/auth/services/user.ts`**
   - Updated `findAll()` to default to `active: true` unless `includeInactive: true` is set
   - Added `findActiveUsers()` convenience method
   - Default behavior: returns only active users

2. **`backend/src/modules/auth/controllers/user.ts`**
   - Added `includeInactive` query parameter for admin list views
   - Updated API documentation

3. **`backend/src/modules/services/service/services.ts`**
   - Added validation to reject inactive users as responsable in step creation
   - Added validation to reject inactive users in service update steps
   - Error messages include field paths for better frontend mapping

4. **`backend/src/modules/services/service/step.ts`**
   - Added validation to reject inactive users when updating step responsable
   - Error messages include field paths

5. **`backend/src/modules/billings/billings.service.ts`**
   - Added validation to reject inactive users as responsible_user_id in billing creation
   - Added validation to reject inactive users in billing updates
   - Added validation in generateByCity for responsible users

### Frontend (9 files)

1. **`frontend/src/lib/hooks/queries/use-users.svelte.ts`**
   - Updated `useUsers()` to default to `active: true`
   - Added defensive filtering to ensure only active users are returned for selects
   - Supports `includeInactive` parameter for admin views

2. **`frontend/src/lib/api/types/users.types.ts`**
   - Added `includeInactive?: boolean` to `UserQueryParams`

3. **`frontend/src/lib/api/endpoints/users.ts`**
   - Updated `getAll()` to handle `includeInactive` query parameter

4. **`frontend/src/lib/components/service-form-dialog.svelte`**
   - Added defensive filtering: `users.filter(u => u.active === true)`
   - All responsable selects now only show active users

5. **`frontend/src/lib/components/billing-responsables-dialog.svelte`**
   - Already had filtering: `users.filter((u) => u.active)`
   - No changes needed (already correct)

6. **`frontend/src/routes/(protected)/steps/[id]/+page.svelte`**
   - Added defensive filtering: `users.filter(u => u.active === true)`
   - Edit responsable dialog now only shows active users

7. **`frontend/src/routes/(protected)/billings/[id]/+page.svelte`**
   - Already had filtering: `users.filter((u) => u.active)`
   - No changes needed (already correct)

8. **`frontend/src/lib/components/forms/step-form.svelte`**
   - Added filtering: `(users?.data || []).filter(u => u.active === true)`

9. **`frontend/src/lib/components/forms/category-form.svelte`**
   - Updated to filter active users

10. **`frontend/src/routes/(protected)/admin/users/[id]/+page.svelte`**
    - **Removed delete button** and all related code:
      - Removed `useDeleteUser` import
      - Removed `Trash2` icon import
      - Removed `showDeleteConfirmation` state
      - Removed `requestDeleteUser()`, `closeDeleteDialog()`, `confirmDeleteUser()` functions
      - Removed delete menu item from dropdown
      - Removed delete confirmation dialog
    - Kept only "Desativar/Ativar funcionário" option

11. **`frontend/src/routes/(protected)/admin/users/+page.svelte`**
    - **Updated to show ALL users** (both active and inactive) by default
    - Sets `includeInactive: true` when statusFilter is 'all' (default)
    - When statusFilter is 'active', shows only active users
    - When statusFilter is 'inactive', shows only inactive users
    - **NO frontend filtering applied** - relies on backend filtering

## New Query Parameters

### Backend API

**GET /users**
- `includeInactive` (boolean, optional): When `true`, includes inactive users in results. Default behavior (when not set) returns only active users.
- `active` (boolean, optional): Explicitly filter by active status. If not set and `includeInactive` is not `true`, defaults to `active: true`.

**Usage:**
- **For selects**: Don't set `includeInactive` (defaults to active only)
- **For admin list view**: Set `includeInactive: true` to see all users

## Backend Validation

### Error Response Format

When attempting to assign an inactive user as responsable:

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
      "message": "Responsável selecionado está inativo"
    }
  ]
}
```

### Validation Points

1. **Service Step Creation**: Validates responsable_id is active
2. **Service Step Update**: Validates responsable_id is active
3. **Service Update Steps**: Validates all step responsable_ids are active
4. **Billing Creation**: Validates responsible_user_id is active
5. **Billing Update**: Validates responsible_user_id is active
6. **Generate Billings by City**: Validates all responsible_user_ids are active

## Frontend Filtering Strategy

### Two-Layer Protection

1. **Backend Default**: API defaults to `active: true` unless `includeInactive: true`
2. **Frontend Defensive**: All selects (except admin list) apply `.filter(u => u.active === true)` as additional safety
3. **Admin List Exception**: Admin users page uses `includeInactive: true` and does NOT apply frontend filtering

### Select Components Updated

- ✅ Service form: Step responsable selects
- ✅ Service form: Payment step responsable select
- ✅ Service form: Boleto step responsable select
- ✅ Step details: Edit responsable dialog
- ✅ Billing responsables dialog: User selects
- ✅ Billing details: Responsible user select
- ✅ Category form: User selects (if any)
- ✅ Step form: Assigned user select

## Delete Employee Removal

### Removed from User Details Page

- ❌ "Excluir funcionário" button removed
- ❌ Delete confirmation dialog removed
- ❌ `useDeleteUser` hook import removed
- ❌ All delete-related state and functions removed

### Kept

- ✅ "Desativar/Ativar funcionário" option (soft delete via `active` flag)
- ✅ Toggle active functionality intact

### Backend DELETE Endpoint

- The `DELETE /users/:id` endpoint still exists in backend (for potential admin-only use)
- Frontend no longer calls it
- Consider restricting to super-admin only in future if needed

## Testing Checklist

### ✅ User Selects Show Only Active Users
- [ ] Create Service: Step responsable dropdown shows only active users
- [ ] Create Service: Payment step responsable shows only active users
- [ ] Create Service: Boleto step responsable shows only active users
- [ ] Step Details: Edit responsable dialog shows only active users
- [ ] Billing Responsables: User selects show only active users
- [ ] Billing Details: Responsible user select shows only active users

### ✅ Inactive User Assignment Rejected
- [ ] Try to assign inactive user as step responsable → Backend returns field-level error
- [ ] Try to assign inactive user as billing responsible → Backend returns field-level error
- [ ] Error message displays correctly in frontend form

### ✅ Existing Records with Inactive Responsable
- [ ] View service with step assigned to now-inactive user → Shows user name (read-only)
- [ ] Try to change responsable → Only active users appear in dropdown
- [ ] Inactive user name still displays for existing assignments

### ✅ Admin User List (Shows ALL Users)
- [ ] Admin users page: Default view ("Todos") shows **ALL users** (both active and inactive)
- [ ] Admin users page: "Ativo" filter shows only active users
- [ ] Admin users page: "Inativo" filter shows only inactive users
- [ ] Admin users page: **NO frontend filtering** - all users displayed when appropriate

### ✅ User Details Page
- [ ] User details page: No "Excluir funcionário" button exists
- [ ] User details page: "Desativar/Ativar funcionário" option works correctly
- [ ] Deactivated user: `active` flag set to `false`, user still exists in database

## Backwards Compatibility

- ✅ Existing services/steps with inactive responsables: Still display correctly (read-only)
- ✅ Admin can still view inactive users in admin list (with `includeInactive: true`)
- ✅ Soft delete (toggle active) continues to work
- ✅ No breaking changes to API contracts

## Edge Cases Handled

1. **User becomes inactive after assignment**: 
   - Existing assignments remain valid (display-only)
   - Cannot assign inactive user to new steps
   - Cannot change existing assignment to inactive user

2. **Admin viewing all users**:
   - Uses `includeInactive: true` to see both active and inactive
   - Selects still filter to active only

3. **Multiple selects on same page**:
   - All use the same filtered user list
   - Consistent behavior across all selects
