# Requirements: Intersul

**Defined:** 2026-02-18
**Core Value:** Service providers can manage all service types (maintenance, rentals, sales, and supplies) through a unified platform with automated workflow tracking, centralized client management, and real-time inventory visibility.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: User can log out from any page
- [ ] **AUTH-06**: Administrator can invite new users via email

### Clients

- [ ] **CLNT-01**: User can create client profiles with contact information
- [ ] **CLNT-02**: User can view list of all clients
- [ ] **CLNT-03**: User can edit client details
- [ ] **CLNT-04**: User can view client service history
- [ ] **CLNT-05**: User can toggle client active status

### Services

- [ ] **SERV-01**: User can create service orders (maintenance, rental, sale, supplies)
- [ ] **SERV-02**: User can view list of all services
- [ ] **SERV-03**: User can track service progress through workflow steps
- [ ] **SERV-04**: User can assign employees to service steps
- [ ] **SERV-05**: User can update step status and add documentation
- [ ] **SERV-06**: User can complete services and maintain history

### Machines

- [ ] **MACH-01**: User can manage copy machine catalog (add, edit, delete)
- [ ] **MACH-02**: User can view available machines for rental/sale
- [ ] **MACH-03**: User can assign machines to clients
- [ ] **MACH-04**: User can manage machine status

### Billing

- [ ] **BILL-01**: User can create billing records
- [ ] **BILL-02**: User can view list of billings
- [ ] **BILL-03**: User can edit billing details
- [ ] **BILL-04**: User can delete billing records
- [ ] **BILL-05**: User can generate billings by city

### Categories

- [ ] **CAT-01**: User can create service categories
- [ ] **CAT-02**: User can view list of categories
- [ ] **CAT-03**: User can edit category details
- [ ] **CAT-04**: User can delete categories

### Dashboard

- [ ] **DASH-01**: User can view dashboard statistics
- [ ] **DASH-02**: User can view stats by month
- [ ] **DASH-03**: User can view stats history

### Location

- [ ] **LOC-01**: User can view countries
- [ ] **LOC-02**: User can view states by country
- [ ] **LOC-03**: User can view cities by state
- [ ] **LOC-04**: User can view neighborhoods by city
- [ ] **LOC-05**: System can process location data

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Scheduling

- **SCHD-01**: Visual calendar for scheduling services
- **SCHD-02**: Drag-and-drop appointment management
- **SCHD-03**: Recurring service scheduling

### SLA/Contracts

- **SLA-01**: Contract management for service agreements
- **SLA-02**: Meter read tracking
- **SLA-03**: Click-charge billing calculations

### Parts Inventory

- **PART-01**: Parts inventory management
- **PART-02**: Parts compatibility tracking
- **PART-03**: Low stock alerts

### Real-time Features

- **REAL-01**: Real-time service updates
- **REAL-02**: Live technician dashboards

## Out of Scope

| Feature | Reason |
|---------|--------|
| Financial accounting (GL, AP/AR) | Outside core service management scope |
| Point-of-sale integration | Not core to service operations |
| Hardware monitoring/diagnostics | Requires IoT infrastructure |
| Marketing automation | CRM beyond operational needs |
| Third-party integrations | Adds complexity, defer to future |
| Native mobile apps | Web-based access is sufficient |
| Advanced BI/Analytics | Basic reporting covered in v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| CLNT-01 | Phase 1 | Pending |
| CLNT-02 | Phase 1 | Pending |
| CLNT-03 | Phase 1 | Pending |
| CLNT-04 | Phase 1 | Pending |
| CLNT-05 | Phase 1 | Pending |
| SERV-01 | Phase 1 | Pending |
| SERV-02 | Phase 1 | Pending |
| SERV-03 | Phase 1 | Pending |
| SERV-04 | Phase 1 | Pending |
| SERV-05 | Phase 1 | Pending |
| SERV-06 | Phase 1 | Pending |
| MACH-01 | Phase 1 | Pending |
| MACH-02 | Phase 1 | Pending |
| MACH-03 | Phase 1 | Pending |
| MACH-04 | Phase 1 | Pending |
| BILL-01 | Phase 1 | Pending |
| BILL-02 | Phase 1 | Pending |
| BILL-03 | Phase 1 | Pending |
| BILL-04 | Phase 1 | Pending |
| BILL-05 | Phase 1 | Pending |
| CAT-01 | Phase 1 | Pending |
| CAT-02 | Phase 1 | Pending |
| CAT-03 | Phase 1 | Pending |
| CAT-04 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| DASH-03 | Phase 1 | Pending |
| LOC-01 | Phase 1 | Pending |
| LOC-02 | Phase 1 | Pending |
| LOC-03 | Phase 1 | Pending |
| LOC-04 | Phase 1 | Pending |
| LOC-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
