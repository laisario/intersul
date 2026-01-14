# Feature: Create User Invitation

## Feature summary

Allows administrators and managers to create invitation tokens for new users. Invitations are sent via email and contain a secure token that enables user registration. Tracks who created the invitation.

## User value

**What problem it solves:**
- Enables controlled user onboarding through invitation system
- Provides secure token-based registration flow
- Tracks invitation creation for audit purposes
- Prevents unauthorized account creation

**Who benefits:**
- Administrators and managers who need to onboard new team members
- New users who receive secure registration links

## Scope

### In scope
- Generate secure invitation token
- Create invitation record with email and inviter information
- Role assignment for invited user
- Invitation expiration tracking
- Return invitation details (including token for email sending)

### Out of scope
- Email sending (handled by external service or frontend)
- Invitation resend functionality
- Bulk invitation creation
- Invitation cancellation

## User flow

1. Administrator/Manager submits invitation form with email and role
2. System generates unique secure token
3. System creates invitation record with email, token, role, and creator ID
4. System returns invitation details including token
5. Frontend or external service sends email with registration link containing token
6. **Error state**: Invalid role → 400 Bad Request
7. **Error state**: Missing email → 400 Bad Request

## Acceptance criteria

- Invitation with valid email and role is created successfully
- Unique token is generated for each invitation
- Invitation record includes creator user ID
- Invitation includes assigned role for future user
- Response includes token for email sending
- Only ADMIN and MANAGER roles can create invitations

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `POST /users/invitations`: Accepts CreateInvitationDto, creates invitation, returns invitation with token

**Main rules/validations:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role (RolesGuard)
- Email must be provided
- Role must be valid UserRole enum value
- Token must be unique
- Creator ID extracted from current authenticated user

## Data & permissions

**Entities/tables/collections:**
- `UserInvitation`: Create operation with token, email, role, creator_id

**Roles/permissions:**
- Requires JWT authentication
- Requires ADMIN or MANAGER role
- Regular users cannot create invitations

## Edge cases & failures

**Validation errors:**
- Missing email: Returns 400 Bad Request
- Invalid role: Returns 400 Bad Request
- Invalid email format: Handled by DTO validation

**Missing data:**
- N/A (creation operation)

**Permission denied:**
- Non-admin/manager user: Returns 403 Forbidden
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error
- Token generation failure: Returns 500 error

## Observability

**Logs/events:**
- Invitation creation should be logged with creator and invitee email
- Failed invitation attempts (permission denied) can be logged

**Metrics (optional):**
- Invitations created per day
- Invitation acceptance rate

## Open questions

- Do invitations have expiration dates?
- Can the same email receive multiple invitations?
- Is there a limit on pending invitations per user?
