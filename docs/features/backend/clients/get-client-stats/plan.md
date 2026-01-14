# Feature: Get Client Statistics

## Feature summary

Retrieves aggregated statistics about clients in the system, such as total client count, active/inactive distribution, and other relevant metrics. Provides insights for business intelligence and reporting.

## User value

**What problem it solves:**
- Provides overview of client base metrics
- Supports business intelligence and reporting
- Enables data-driven decision making
- Helps track client growth and trends

**Who benefits:**
- Business owners viewing client metrics
- Administrators monitoring client base
- Managers analyzing business performance

## Scope

### In scope
- Aggregate client statistics (total count, active/inactive counts)
- Client distribution metrics
- Return formatted statistics data

### Out of scope
- Historical statistics over time
- Client segmentation statistics
- Geographic distribution statistics
- Client value metrics

## User flow

1. User requests client statistics
2. System queries client database for aggregates
3. System calculates statistics (counts, distributions)
4. System returns statistics data
5. **Empty state**: No clients exist → Returns zero statistics

## Acceptance criteria

- Statistics are calculated correctly from client data
- Response includes total client count
- Response includes active/inactive distribution
- Empty database returns zero statistics (not error)
- Statistics are returned in structured format

## Backend/Frontend behavior

### Backend behavior

**Endpoints/actions involved:**
- `GET /clients/stats`: Returns client statistics object

**Main rules/validations:**
- Requires JWT authentication
- Statistics are calculated from current client data
- May include caching for performance

## Data & permissions

**Entities/tables/collections:**
- `Client`: Aggregate read operations (COUNT, GROUP BY)

**Roles/permissions:**
- Requires JWT authentication
- All authenticated users can view statistics (or specific roles - needs confirmation)

## Edge cases & failures

**Validation errors:**
- N/A (no input parameters)

**Missing data:**
- No clients exist: Returns statistics with zero values

**Permission denied:**
- Missing authentication: Returns 401 Unauthorized

**Network / integration failure cases:**
- Database connection failure: Returns 500 error

## Observability

**Logs/events:**
- Statistics access can be logged

**Metrics (optional):**
- Statistics calculation time
- Statistics endpoint usage frequency

## Open questions

- What specific statistics are included (total, active, inactive, by city, etc.)?
- Should statistics be cached for performance?
- Are there time-based statistics (clients created this month)?
