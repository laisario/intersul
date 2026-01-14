# Feature: Accept User Invitation

## Feature summary

Allows a user to complete registration using a valid invitation token. Validates the token, creates the user account with the role specified in the invitation, and marks the invitation as accepted. This is the final step in the invitation-based onboarding flow.

## User value

**What problem it solves:**
- Enables secure, controlled user registration through invitation tokens
- Links user creation to invitation system
- Ensures users are created with correct roles from invitations
- Prevents unauthorized account creation

**Who benefits:**
- New users receiving invitation emails
- Administrators managing controlled onboarding

## Scope

### In scope
- Validate invitation token
- Verify invitation is not already accepted or expired
- Create user account with invitation's role
- Mark invitation as accepted
- Return user data and authentication token

### Out of scope
- Email verification beyond invitation token
- Profile completion workflow
- Invitation resend if expired
- Multiple invitation acceptance attempts

## User flow

1. User clicks invitation link with token
2. Frontend calls endpoint with token and registration data (password, name, etc.)
3. System validates token exists and is not accepted/expired
4. System creates user account with invitation's role
5. System marks invitation as accepted
6. System returns user data and JWT token
7. **Error state**: Invalid token → 404 Not Found
8. **Error state**: Already accepted → 400 Bad Request
9. **Error state**: Expired token → 400 Bad Request

## Acceptance criteria

- Valid invitation token creates user with correct role
- User account is created with provided registration data
- Invitation is marked as accepted
- Duplicate token acceptance is prevented
- Expired invitations cannot be accepted
- Response includes user data and JWT token for immediate login

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /auth/invitations/accept`: Accepts AcceptInvitationDto with token and user data, creates user, marks invitation accepted

**Main rules/validations:**
- Token must exist in database
- Token must not be already accepted
- Token must not be expired (if expiration is implemented)
- User email must match invitation email (if validation exists)
- Password must be provided and will be hashed
- User role comes from invitation, not request

## Data & permissions

**Entities/tables/collections:**
- `UserInvitation`: Read to validate token, Update to mark as accepted
- `User`: Create operation with invitation's role

**Roles/permissions:**
- No authentication required (public endpoint)
- Token validation provides security

## Edge cases & failures

**Validation errors:**
- Missing token: Returns 400 Bad Request
- Missing required user data: Returns 400 Bad Request
- Invalid email format: Handled by DTO validation

**Missing data:**
- Invitation not found: Returns 404 Not Found
- Token already accepted: Returns 400 Bad Request
- Token expired: Returns 400 Bad Request (if expiration implemented)

**Permission denied:**
- N/A (public endpoint with token validation)

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Duplicate email (if email validation exists): Returns 409 Conflict
- Bcrypt hashing failure: Returns 500 error

## Observability

**Logs/events:**
- Invitation acceptance should be logged
- Failed acceptance attempts (invalid token) can be logged
- User creation from invitation should be logged

**Metrics (optional):**
- Invitation acceptance rate
- Time from invitation creation to acceptance
- Failed acceptance attempts

## Open questions

- Do invitations have expiration dates? If so, what is the expiration period?
- Can the same email be invited multiple times?
- Should email in registration match invitation email exactly?
