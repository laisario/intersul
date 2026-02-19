# Roadmap: Intersul

## Overview

This roadmap delivers a complete service management platform for copy machine businesses. Phase 1 establishes secure authentication. Phase 2 enables core business operations (clients, services, machines). Phase 3 adds business support features (billing, categories, dashboard, location).

## Phases

- [ ] **Phase 1: Authentication & Access** - Secure user authentication and session management
- [ ] **Phase 2: Core Operations** - Manage clients, services, and machines
- [ ] **Phase 3: Business Operations** - Billing, categories, dashboard, and location data

## Phase Details

### Phase 1: Authentication & Access
**Goal**: Users can securely access their accounts with email/password, session persistence, and admin user invitation
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password
  2. User receives email verification after signup
  3. User can reset password via email link
  4. User session persists across browser refresh
  5. User can log out from any page
  6. Administrator can invite new users via email
**Plans**: TBD

### Phase 2: Core Operations
**Goal**: Users can manage clients, service orders, and copy machines as the operational core of the business
**Depends on**: Phase 1
**Requirements**: CLNT-01, CLNT-02, CLNT-03, CLNT-04, CLNT-05, SERV-01, SERV-02, SERV-03, SERV-04, SERV-05, SERV-06, MACH-01, MACH-02, MACH-03, MACH-04
**Success Criteria** (what must be TRUE):
  1. User can create client profiles with contact information and view all clients
  2. User can edit client details and toggle active status
  3. User can view client service history
  4. User can create service orders across all types (maintenance, rental, sale, supplies)
  5. User can track service progress through workflow steps
  6. User can assign employees to service steps and update step status with documentation
  7. User can complete services and maintain history
  8. User can manage copy machine catalog (add, edit, delete)
  9. User can view available machines for rental/sale and assign machines to clients
  10. User can manage machine status
**Plans**: TBD

### Phase 3: Business Operations
**Goal**: Users can manage billing, categories, view dashboards, and process location data for complete business operations
**Depends on**: Phase 2
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, CAT-01, CAT-02, CAT-03, CAT-04, DASH-01, DASH-02, DASH-03, LOC-01, LOC-02, LOC-03, LOC-04, LOC-05
**Success Criteria** (what must be TRUE):
  1. User can create, view, edit, and delete billing records
  2. User can generate billings by city
  3. User can create, view, edit, and delete service categories
  4. User can view dashboard statistics
  5. User can view stats by month
  6. User can view stats history
  7. User can view countries, states by country, cities by state, and neighborhoods by city
  8. System correctly processes and stores location data
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication & Access | 0/TBD | Not started | - |
| 2. Core Operations | 0/TBD | Not started | - |
| 3. Business Operations | 0/TBD | Not started | - |

---

*Created: 2026-02-18*
*Depth: quick (3 phases)*
