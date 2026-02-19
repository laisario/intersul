# Phase 2: Core Operations - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage clients, service orders, and copy machines as the operational core of the business. This phase delivers: client management (create, view, edit, toggle active), service workflow management (create orders, track progress, assign employees, documentation), and machine management (catalog, rental/sale, client assignments, status).

</domain>

<decisions>
## Implementation Decisions

### Service Workflow
- **Step creation:** Predefined steps based on service type (optional), users can create custom steps
- **Step progression:** Manual completion (user clicks "complete step" to advance)
- **Step completion:** Only assigned employees can complete steps
- **Documentation:** Both images and text notes can be added to steps
- **Collaboration:** Multiple employees can collaborate on a single step
- **Reassignment:** Only admins can reassign steps to different employees
- **Due dates:** Optional due date per step; if not provided, calculated based on SLA
- **Skip:** Steps can be skipped with reason required

### Service History
- **Location:** Visible on both service detail page AND client detail page
- **Simple view:** Shows status, dates, service type, notes
- **Detailed view:** Includes everything (all timestamps, all documentation, all employees)
- **Ordering:** Most recent first by completion date
- **Filtering:** No filters (chronological list only)

### Machine Assignment
- **Flow:** Assign machines from client detail page
- **Required fields:** Machine selection, franchise, start date
- **Assignment logic:** Machine model from catalog becomes client machine with serial number + franchise when assigned
- **Concurrent assignments:** Same model can be assigned to multiple clients (each becomes unique client machine)
- **Ending assignment:** Status changes to inactive, can be re-assigned manually later

### Client List View
- No discussion — Claude's discretion for layout and filtering

</decisions>

<specifics>
## Specific Ideas

- Existing frontend pages: clients list, client detail, machines list, services list, service detail
- Verify existing implementations match these decisions
- Backend services exist for clients, services, machines — verify and complete

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-operations*
*Context gathered: 2026-02-18*
