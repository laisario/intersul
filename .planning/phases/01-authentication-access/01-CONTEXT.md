# Phase 1: Authentication & Access - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely access their accounts with email/password, session persistence, and admin user invitation. This phase delivers: signup, email verification, password reset (admin-mediated), session management, and user invitation system.

</domain>

<decisions>
## Implementation Decisions

### Email Verification
- Verification email sent on **first login attempt** (not at signup)
- Unverified users redirected to "check your email" page with resend option
- Verification token valid for **24 hours**
- Resend limit: **3 verification emails per day** per email

### Password Reset
- **Admin-mediated** — No self-service password reset
- Admin generates reset link, sends manually to user
- Reset link valid for **24 hours**
- Limit: **3 reset links per user per day**

### Session Policies
- Session token duration: **30 days**
- No "remember me" option (single session length)
- **Multiple concurrent sessions allowed** (users can be logged in on multiple devices)
- **No session management** for users (cannot view/revoke other sessions)

### User Invitation
- Admin enters email + role → System generates invitation link → Admin copies and sends manually
- Invitation link redirects to signup page with email pre-filled
- Invitation link valid for **48 hours**
- **No resends** — Must create new invitation if expired

</decisions>

<specifics>
## Specific Ideas

- No specific requirements — open to standard approaches
- Existing auth infrastructure in backend (NestJS) should be verified and completed
- Frontend has login/register/invite pages — verify flows match decisions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-authentication-access*
*Context gathered: 2026-02-18*
