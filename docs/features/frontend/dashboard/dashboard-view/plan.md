# Feature: Dashboard View

## Feature summary

Displays a comprehensive dashboard with business statistics, key metrics, and user-specific information. Shows dashboard statistics (for admins), user's assigned steps, and quick access to common actions. Provides overview of system status and user workload.

## User value

**What problem it solves:**
- Provides at-a-glance view of business metrics
- Shows user's assigned tasks and steps
- Enables quick access to important information
- Supports data-driven decision making

**Who benefits:**
- Administrators viewing business statistics
- Service managers monitoring operations
- Field technicians viewing assigned steps
- All users accessing dashboard overview

## Scope

### In scope
- Display dashboard statistics (admin view)
- Show user's assigned steps with filters
- Display key metrics cards
- Quick action buttons/links
- Loading states for data fetching
- Error handling for API failures
- Role-based content display

### Out of scope
- Customizable dashboard widgets
- Dashboard configuration
- Historical trend charts
- Export dashboard data

## User flow

1. User navigates to dashboard (home page)
2. System fetches dashboard statistics (if admin)
3. System fetches user's assigned steps (if not admin)
4. System displays statistics cards and step list
5. User can filter steps (created_today, expires_today, expired)
6. User can click steps to view details
7. User can access quick actions
8. **Loading state**: Data fetching → Show loading indicators
9. **Error state**: API failure → Display error message

## Acceptance criteria

- Dashboard displays appropriate content based on user role
- Statistics are correctly calculated and displayed
- User's steps are shown with correct filters
- Loading states are shown during data fetch
- Error states are handled gracefully
- Quick actions are accessible
- Step navigation works correctly

## Backend/Frontend behavior

### Frontend behavior

**Screens/components involved:**
- `/` (home) route page component
- Dashboard statistics cards component
- Steps table component
- Filter controls component
- Loading skeleton components
- Error message component

**Key states:**
- Loading: Skeleton or spinner shown for each section
- Success: Statistics and steps displayed
- Error: Error message with retry option
- Empty: Empty state for steps (if no assigned steps)

**Validations:**
- User role determines dashboard content
- Filter values are validated before API call

## Data & permissions

**Entities/tables/collections:**
- `DashboardStats`: Statistics data (admin only)
- `Step`: User's assigned steps
- `AuthStore`: User authentication and role

**Roles/permissions:**
- Requires authentication
- Admin users see dashboard statistics
- Regular users see their assigned steps
- All users can access dashboard

## Edge cases & failures

**Validation errors:**
- Invalid filter values: Prevent API call

**Missing data:**
- No assigned steps: Display empty state message
- Statistics unavailable: Display error or hide section

**Permission denied:**
- Unauthenticated: Redirect to login
- Insufficient permissions: Hide admin sections

**Network / integration failure cases:**
- API unavailable: Display error message with retry
- Timeout: Display timeout error
- Partial data failure: Show available data, error for failed sections

## Observability

**Logs/events:**
- Dashboard view can be logged
- Statistics access can be tracked
- API errors should be logged

**Metrics (optional):**
- Dashboard view frequency
- Average load time
- Statistics calculation time
- Step filter usage

## Open questions

- Should dashboard statistics be cached on frontend?
- Should there be auto-refresh for dashboard data?
- Are there specific metrics that should be prioritized?
