# Phase 3: Business Operations - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage billing, categories, view dashboards, and process location data for complete business operations. This phase delivers: billing management (create, view, edit, delete, generate by city), category management (create, view, edit, delete), dashboard statistics (overview, by month, history), and location data (countries, states, cities, neighborhoods).

</domain>

<decisions>
## Implementation Decisions

### Billing Workflow
- **Creation:** Manual — Admin creates billing records manually
- **Required fields:** Client, machine franchise, payment method
- **Status values:** Pending, Paid, Overdue
- **Overdue logic:** Automatic — System checks due date and marks overdue automatically
- **Partial payments:** No — Full payment only

### Location Data
- **Population:** Pre-seeded — Data loaded from a seed/script on setup
- **Initial countries:** Brazil only
- **Hierarchy:** 4 levels — Country → State → City → Neighborhood
- **User additions:** Users can add missing locations (not limited to pre-seeded)

### Dashboard Metrics
- No discussion — Claude's discretion for stats shown and visualization

### Category Hierarchy
- No discussion — Claude's discretion for structure and presentation

</decisions>

<specifics>
## Specific Ideas

- Existing frontend pages: billings list, billings detail, categories list, dashboard
- Backend services exist for billings, categories, dashboard, location — verify and complete
- Location module already has address handling — check existing implementation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-business-operations*
*Context gathered: 2026-02-18*
