# Feature: Service List

Displays a paginated, filterable list of all services in the system. Shows service information including client, category, status, price, and creation date. Supports filtering by category, client, city, and acquisition type. Enables navigation to service detail pages and service creation.

## User value

**What problem it solves:**
- Provides overview of all services in the system
- Enables service filtering and search
- Supports service management workflows
- Displays service status for quick reference

**Who benefits:**
- Service managers viewing service list
- Office administrators managing services
- Field technicians checking assigned services
- All users tracking service progress

## Scope

### In scope
- Display service list with pagination
- Filter services by category, client, city, acquisition type
- Show service details (client, category, status, price, date)
- Display service price in list (if available)
- Display payment information for external services (if applicable)
- Navigate to service detail page
- Create new service action
- Loading and error states

### Out of scope
- Service editing from list
- Bulk service operations
- Service export functionality
- Advanced search with full-text

## User flow

1. User navigates to services page
2. System fetches service list from API (with optional filters)
3. User can apply filters (category, client, etc.)
4. System displays filtered services in table/list
5. User can click service to view details
6. User can navigate pages if pagination exists
7. **Empty state**: No services → Display empty state message
8. **Error state**: API failure → Display error message

## Acceptance criteria

- Service list is displayed with pagination
- Service price is displayed in list (if available)
- Payment information is displayed for external services (if applicable)
- Filters work correctly (category, client, city, acquisition type)
- Service information is correctly formatted
- Clicking service navigates to detail page
- Loading state is shown during data fetch
- Empty state is displayed when no services match filters
- Error state is displayed on API failure

## Backend/Frontend behavior

### Frontend behavior

**Screens/components involved:**
- `/services` route page component
- Service table/list component
- Filter controls component
- Pagination controls component
- Loading skeleton component
- Empty state component

**Key states:**
- Loading: Skeleton or spinner shown
- Success: Service list displayed with filters
- Empty: Empty state message shown
- Error: Error message with retry option

**Validations:**
- Filter values are validated before API call
- Pagination parameters are validated

## Data & permissions

**Entities/tables/collections:**
- `Service`: List of service records from API
- `Category`: For filter dropdown
- `Client`: For filter dropdown
- `AuthStore`: User authentication for API calls

**Roles/permissions:**
- Requires authentication
- All authenticated users can view service list
- Only ADMIN/MANAGER can create services (if create button shown)

## Edge cases & failures

**Validation errors:**
- Invalid filter values: Prevent API call or show validation message

**Missing data:**
- No services: Display empty state
- No services match filters: Display "no results" message

**Permission denied:**
- Unauthenticated: Redirect to login
- Insufficient permissions: Hide create button or show error

**Network / integration failure cases:**
- API unavailable: Display error message with retry
- Timeout: Display timeout error
- Invalid response: Display generic error

## Observability

**Logs/events:**
- Service list view can be logged
- Filter usage can be tracked
- API errors should be logged

**Metrics (optional):**
- Service list view frequency
- Filter usage patterns
- Average load time

## Open questions

- Should filters persist in URL for bookmarking?
- Is there a default filter (e.g., active services only)?
- Should service list show step status summary?
