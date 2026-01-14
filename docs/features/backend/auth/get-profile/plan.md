# Feature: Get Current User Profile

## Feature summary

Retrieves the authenticated user's profile information including their details, role, and account status. Requires valid JWT authentication token.

## User value

**What problem it solves:**
- Allows users to view their own account information
- Enables frontend to display user-specific data
- Provides user context for personalized experiences

**Who benefits:**
- All authenticated users who need to view their profile

## Scope

### In scope
- Retrieve current user's profile data
- JWT token validation
- Return user information (excluding sensitive data like password)

### Out of scope
- Profile editing (separate feature)
- Password change
- Profile picture upload
- Activity history

## User flow

1. User makes authenticated request with JWT token
2. System extracts user ID from JWT token
3. System retrieves user record from database
4. System returns user profile data
5. **Error state**: Invalid/missing token → 401 Unauthorized
6. **Error state**: User not found → 401 Unauthorized

## Acceptance criteria

- Authenticated user receives their profile information
- Response excludes password field
- Invalid token returns 401 error
- Missing token returns 401 error
- User ID from token matches existing active user

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /auth/profile`: Returns current user's profile (requires JWT authentication)

**Main rules/validations:**
- JWT token must be valid and not expired
- User must exist and be active
- User ID extracted from token's `sub` claim

## Data & permissions

**Entities/tables/collections:**
- `User`: Read operation by ID from JWT token

**Roles/permissions:**
- Requires JWT authentication (JwtAuthGuard)
- All authenticated users can access their own profile

## Edge cases & failures

**Validation errors:**
- N/A (no input validation needed)

**Missing data:**
- User not found: Returns 401 Unauthorized
- Inactive user: Returns 401 Unauthorized (if validation checks active status)

**Permission denied:**
- Missing JWT token: Returns 401 Unauthorized
- Invalid/expired token: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- JWT validation failure: Returns 401 Unauthorized

## Observability

**Logs/events:**
- Failed authentication attempts can be logged
- Profile access can be logged for audit purposes

**Metrics (optional):**
- Profile access frequency
- Average response time

## Open questions

- Should profile include additional computed fields (e.g., service count, step assignments)?
- Is there rate limiting on profile endpoint?
