# Feature: User Registration

## Feature summary

Creates a new user account in the system with email, password, and basic user information. Password is hashed before storage. Registration may be used for invitation-based onboarding or direct registration.

## User value

**What problem it solves:**
- Enables new users to create accounts and access the platform
- Supports invitation-based onboarding workflow
- Provides secure password storage through hashing

**Who benefits:**
- New employees or team members being onboarded
- Administrators managing user accounts

## Scope

### In scope
- User account creation with email, password, name
- Password hashing using bcrypt
- Email uniqueness validation
- User role assignment
- Active status default (typically true for new registrations)

### Out of scope
- Email verification
- Password strength requirements enforcement (may be in DTO)
- Profile completion workflow
- Account activation via email link

## User flow

1. User submits registration form with email, password, name, and other required fields
2. System validates email uniqueness
3. System hashes password using bcrypt
4. System creates user record with provided information
5. System returns created user data (password excluded)
6. **Error state**: Duplicate email → 409 Conflict
7. **Error state**: Invalid input → 400 Bad Request

## Acceptance criteria

- User with unique email and valid data is created successfully
- Password is hashed before storage (never stored in plain text)
- Duplicate email registration returns 409 error
- Created user has default active status
- Response excludes password field
- User can immediately use credentials to log in

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /auth/register`: Accepts RegisterDto, creates user, returns user data

**Main rules/validations:**
- Email must be unique in database
- Password must be provided and will be hashed
- Required fields must be present (name, email, password)
- User role may be set during registration or default to specific role

## Data & permissions

**Entities/tables/collections:**
- `User`: Create operation with hashed password

**Roles/permissions:**
- No authentication required (public endpoint)
- Typically used in conjunction with invitation acceptance

## Edge cases & failures

**Validation errors:**
- Missing required fields: Returns 400 Bad Request
- Invalid email format: Handled by DTO validation
- Weak password: May be validated by DTO (if rules exist)

**Missing data:**
- N/A (creation operation)

**Permission denied:**
- N/A (public endpoint, though may be restricted in production)

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Duplicate email constraint violation: Returns 409 Conflict
- Bcrypt hashing failure: Returns 500 error

## Observability

**Logs/events:**
- New user registration should be logged
- Failed registration attempts (duplicate email) can be logged

**Metrics (optional):**
- Registration success rate
- Average registration response time

## Open questions

- Is registration always public or only via invitation acceptance?
- What is the default role for new registrations?
- Are there password strength requirements?
