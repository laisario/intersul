# Feature: Create Service

Provides form interface for creating new services. Includes client selection, category selection, copy machine selection, service price, and service details. For external services (is_internal = false), includes payment fields (amount_to_receive, payment_method, is_invoiced) that are required.

## User value

**What problem it solves:**
- Provides user interface for services functionality
- Enables users to interact with services data
- Supports operational workflows through intuitive UI

**Who benefits:**
- Users managing services data
- Administrators maintaining system information
- Field technicians accessing services details

## Scope

### In scope
- Core create service user interface
- Service price/value input field
- Service type selection (internal/external)
- Payment fields for external services (amount_to_receive, payment_method, is_invoiced)
- Form validation and error handling
- API integration and data fetching
- Loading and error states
- Navigation and routing

### Out of scope
- Advanced filtering and search (if not implemented)
- Bulk operations
- Export functionality
- Print functionality

## User flow

1. User navigates to /services (create action)
2. System fetches required data from API
3. System displays create service interface
4. User selects service type (internal or external)
5. User fills service details including optional price field
6. If external service (is_internal = false):
   - System displays payment fields: amount_to_receive, payment_method, is_invoiced
   - Payment fields are marked as required
   - User must fill all payment fields before submission
7. User submits form
8. System validates form data (including payment fields for external services)
9. System handles user actions and API calls
10. System updates UI based on results
11. **Loading state**: Data fetching → Show loading indicators
12. **Error state**: API failure → Display error message
13. **Error state**: Missing payment fields for external service → Show validation error
14. **Empty state**: No data → Display empty state message

## Acceptance criteria

- create service interface is displayed correctly
- Service price field is displayed and can be filled (optional)
- Service type selector (internal/external) works correctly
- Payment fields are displayed when external service is selected
- Payment fields are required for external services
- Data is fetched and displayed from API
- User interactions work as expected
- Form validation prevents invalid submissions
- Payment field validation works for external services
- Loading states are shown during operations
- Error states are handled gracefully
- Navigation works correctly

## Backend/Frontend behavior

### Frontend behavior

**Screens/components involved:**
- `/services (create action)` route page component
- Service form component with price field
- Service type selector (internal/external)
- Payment fields component (amount_to_receive, payment_method, is_invoiced) - shown conditionally for external services
- Form components (if applicable)
- List/table components (if applicable)
- Detail view components (if applicable)
- Loading skeleton components
- Error message components

**Key states:**
- Loading: Skeleton or spinner shown
- Success: Data displayed correctly
- Error: Error message with retry option
- Empty: Empty state message shown

**Validations:**
- Form fields validated before submission
- Service price field validated (must be positive number if provided)
- For external services: amount_to_receive, payment_method, and is_invoiced are required
- Payment method must be a valid option
- Amount to receive must be a positive number
- API responses validated before display
- User input sanitized and validated

## Data & permissions

**Entities/tables/collections:**
- `Services`: Data from API
- `AuthStore`: User authentication for API calls
- Related entities as needed

**Roles/permissions:**
- Requires authentication (unless public route)
- Role-based UI elements and actions
- Permission checks before API calls

## Edge cases & failures

**Validation errors:**
- Invalid form data: Show validation messages, prevent submission
- Missing payment fields for external service: Show validation error, prevent submission
- Invalid price format: Show validation error
- Invalid amount_to_receive (negative or zero): Show validation error
- Invalid payment method: Show validation error
- Invalid API response: Display error message

**Missing data:**
- No data available: Display empty state message
- Resource not found: Display 404 or error message

**Permission denied:**
- Unauthenticated: Redirect to login
- Insufficient permissions: Hide actions or show error

**Network / integration failure cases:**
- API unavailable: Display error message with retry
- Timeout: Display timeout error
- Invalid response: Display generic error

## Observability

**Logs/events:**
- create service interactions can be logged
- API errors should be logged
- Navigation can be tracked

**Metrics (optional):**
- create service view frequency
- Average load time
- Error rate
- User interaction patterns

## Open questions

- What are the specific role requirements for this feature?
- Are there any UI/UX improvements needed?
- Should there be keyboard shortcuts for power users?
