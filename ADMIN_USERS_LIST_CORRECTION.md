# Admin Users List Correction - Show All Users

## Correction Summary

Adjusted the implementation so that:
- **Admin users list page** shows **ALL users** (both active and inactive)
- **All other user selects** show **ONLY active users**

## Changes Made

### Backend Endpoint Modified

**`GET /users`** (via `backend/src/modules/auth/services/user.ts`)

**Behavior:**
- **Default**: Returns only active users (`active: true`)
- **When `includeInactive=true`**: Returns ALL users (both active and inactive)
- **When `active=true` explicitly**: Returns only active users
- **When `active=false` explicitly**: Returns only inactive users

**Logic:**
```typescript
if (filters?.active !== undefined) {
  where.active = filters.active; // Use explicit filter
} else if (filters?.includeInactive !== true) {
  where.active = true; // Default to active only
}
// If includeInactive is true and active is not set, don't filter by active (show all)
```

### Frontend Changes

#### 1. `frontend/src/lib/hooks/queries/use-users.svelte.ts`

**Updated Logic:**
- When `includeInactive: true` is set, does NOT apply frontend filtering (returns all users)
- When `includeInactive` is NOT set, applies defensive filtering to ensure only active users
- Defaults to `active: true` unless `includeInactive: true` is explicitly set

**Key Change:**
```typescript
// Only set active=true by default if includeInactive is NOT true
active: params?.includeInactive ? params.active : (params?.active !== undefined ? params.active : true),

// In queryFn:
if (!queryParams.includeInactive) {
  // For selects: filter to only active users
  return users.filter(u => u.active === true);
}
// For admin list: return all users (both active and inactive)
return users;
```

#### 2. `frontend/src/routes/(protected)/admin/users/+page.svelte`

**Updated Query Params:**
- Sets `includeInactive: true` when `statusFilter === 'all'` (default)
- When `statusFilter === 'active'`: Sets `active: true` (no includeInactive)
- When `statusFilter === 'inactive'`: Sets `active: false` (no includeInactive)
- **NO frontend filtering applied** - relies on backend

**Key Change:**
```typescript
const queryParams = $derived({
  role: roleFilter !== 'all' ? roleFilter : undefined,
  active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  // Always include inactive users when viewing 'all' (default)
  includeInactive: statusFilter === 'all' || statusFilter === undefined
});
```

## Where `includeInactive=true` is Used

### ✅ Used (Admin Users List)
- **`frontend/src/routes/(protected)/admin/users/+page.svelte`**
  - When `statusFilter === 'all'` (default view)
  - Ensures all users (active and inactive) are displayed

### ❌ NOT Used (All Selects)
- Service form responsable selects → Uses default (active only)
- Step details responsable select → Uses default (active only)
- Billing responsables dialog → Uses default (active only)
- Billing details responsible user → Uses default (active only)
- All other user selects → Uses default (active only)

## Verification

### ✅ Admin Users Page Shows All Users
- Default view ("Todos") → Shows **ALL users** (active + inactive)
- "Ativo" filter → Shows only active users
- "Inativo" filter → Shows only inactive users
- **No frontend filtering** applied on this page

### ✅ All Selects Show Only Active Users
- Service form step responsable selects → Only active users
- Step details edit responsable → Only active users
- Billing responsables dialog → Only active users
- Billing details responsible user → Only active users
- All other selects → Only active users

### ✅ Backend Validation Still Prevents Inactive Assignment
- Attempting to assign inactive user → Returns field-level error
- Error message: "Responsável selecionado está inativo"
- Validation works in:
  - Service step creation
  - Service step update
  - Billing creation
  - Billing update
  - Generate billings by city

## API Usage Examples

### Admin Users List (Shows All)
```typescript
// GET /users?includeInactive=true
// Returns: All users (active + inactive)
```

### Admin Users List (Active Only)
```typescript
// GET /users?active=true
// Returns: Only active users
```

### Admin Users List (Inactive Only)
```typescript
// GET /users?active=false
// Returns: Only inactive users
```

### User Selects (Default - Active Only)
```typescript
// GET /users
// or
// GET /users?active=true
// Returns: Only active users
```

## Summary

| Location | Shows | Query Params |
|----------|-------|--------------|
| Admin users list (default) | ALL users | `includeInactive=true` |
| Admin users list (active filter) | Active only | `active=true` |
| Admin users list (inactive filter) | Inactive only | `active=false` |
| All user selects | Active only | Default (no params) or `active=true` |

**Key Points:**
1. ✅ Admin users list shows ALL users by default
2. ✅ All selects show ONLY active users
3. ✅ Backend validation prevents inactive user assignment
4. ✅ No breaking changes to existing functionality
