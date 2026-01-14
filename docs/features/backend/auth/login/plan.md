# Feature: User Login

## Feature summary

Authenticates users with email and password credentials, validates their account status, and returns a JWT access token for subsequent API requests. Only active users can log in.

## User value

**What problem it solves:**
- Enables secure access to the platform for authenticated users
- Provides session management through JWT tokens
- Prevents inactive users from accessing the system

**Who benefits:**
- All users (employees, managers, administrators) who need to access the platform

## Scope

### In scope
- Email and password authentication
- JWT token generation and return
- Active user validation
- Password verification using bcrypt
- Error handling for invalid credentials

### Out of scope
- Password reset functionality
- Multi-factor authentication
- Social login (OAuth)
- Remember me functionality
- Session management beyond token generation

## User flow

1. User submits login form with email and password
2. System validates email exists and user is active
3. System verifies password against stored hash
4. System generates JWT token with user payload (email, id, role)
5. System returns token and user information
6. **Error state**: Invalid credentials → 401 Unauthorized
7. **Error state**: Inactive user → 401 Unauthorized

## Acceptance criteria

- User with valid credentials and active status receives JWT token
- User with invalid password receives 401 error
- User with non-existent email receives 401 error
- Inactive user cannot log in even with correct credentials
- JWT token contains user email, id, and role
- Token expiration follows configured JWT settings

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /auth/login`: Accepts LoginDto, returns JWT token and user data

**Main rules/validations:**
- Email must exist in database
- User must have `active: true` status
- Password must match stored bcrypt hash
- JWT token includes: email, sub (user id), role
- Token expiration set by JWT configuration

## Data & permissions

**Entities/tables/collections:**
- `User`: Read operation to find user by email and validate active status

**Roles/permissions:**
- No authentication required (public endpoint)
- All user roles can use this endpoint

## Edge cases & failures

**Validation errors:**
- Invalid email format: Handled by DTO validation
- Missing email/password: Handled by DTO validation

**Missing data:**
- User not found: Returns 401 Unauthorized with "Invalid credentials" message
- Inactive user: Returns 401 Unauthorized with "Invalid credentials" message

**Permission denied:**
- N/A (public endpoint)

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- JWT service failure: Returns 500 error

## Observability

**Logs/events:**
- Failed login attempts should be logged (security monitoring)
- Successful login can be logged for audit purposes

**Metrics (optional):**
- Login success rate
- Failed login attempts count
- Average login response time

## Open questions

- Should there be rate limiting on login attempts?
- Should failed login attempts be tracked per IP/email?
