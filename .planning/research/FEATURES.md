# Service Management Platform Features Research

**Context:** Intersul — Service management platform for copy machine businesses  
**Research Date:** 2026-02-18  
**Purpose:** Define table stakes vs differentiating features to inform requirements

---

## Executive Summary

This research categorizes features common to service management platforms (specifically field service management / FSM) into three tiers: table stakes (must-have), differentiators (competitive advantage), and anti-features (deliberately exclude). For a copy machine service business like Intersul, the analysis considers the unique operational needs of equipment rental, maintenance, and supplies delivery.

**Key Insight:** The copy machine service industry has specific needs (equipment tracking, contract/SLA management, parts inventory) that differentiate it from general FSM. Intersul's current feature set covers most table stakes but has opportunity to differentiate in vertical-specific capabilities.

---

## Table Stakes (Must-Have)

*Features users expect and will leave if missing. No competitive advantage, but gaps cause churn.*

### 1. Client/Customer Management

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Client CRUD (create, read, update, delete) | Low | None |
| Contact information management | Low | None |
| Client search and filtering | Low | None |
| Client activity history | Low | Services module |

**Rationale:** Every service business needs to track who they're serving. Without this, nothing else matters.

**Status in Intersul:** ✅ Implemented

---

### 2. Service Request/Work Order Management

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Create service requests | Low | Client module |
| Work order lifecycle (open, in-progress, completed) | Low | None |
| Service description and details | Low | None |
| Priority levels | Low | None |
| Assignment to technicians | Medium | Employee/User module |

**Rationale:** Core to service delivery. Users need to create, track, and complete service jobs.

**Status in Intersul:** ✅ Implemented (service workflows with steps)

---

### 3. Scheduling & Dispatch

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Appointment scheduling | Medium | Client, Service modules |
| Calendar view of work orders | Medium | Service module |
| Technician assignment | Medium | User module |
| Basic dispatch (assigning jobs to techs) | Medium | User module |

**Rationale:** Critical for field service. Without scheduling, coordination breaks down.

**Note:** Current Intersul has employee assignment but not advanced scheduling/calendar features. This is a gap to address.

**Status in Intersul:** ⚠️ Partial (employee assignment exists, calendar/scheduling UI limited)

---

### 4. Equipment/Asset Management

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Track equipment at client locations | Low | Client module |
| Equipment inventory (sales/rentals) | Low | None |
| Equipment status (active, maintenance, retired) | Low | None |
| Equipment history/maintenance records | Medium | Service module |

**Rationale:** For copy machine businesses, knowing what equipment is where is fundamental.

**Status in Intersul:** ✅ Implemented (machine inventory for sales/rentals)

---

### 5. Basic Reporting/Analytics

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Dashboard with key metrics | Low | All modules |
| Service completion statistics | Low | Service module |
| Revenue/billing summaries | Low | Billing module |

**Rationale:** Managers need visibility into operations.

**Status in Intersul:** ✅ Implemented (dashboard stats)

---

### 6. User Management & Access Control

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| User authentication | Low | None |
| Role-based access (admin, technician, viewer) | Medium | None |
| User invitation system | Low | Auth module |

**Rationale:** Multiple people need access; not everyone should see everything.

**Status in Intersul:** ✅ Implemented (user invitations)

---

### 7. Billing & Invoicing (Basic)

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Generate invoices for services | Medium | Service, Client modules |
| Track payment status | Medium | None |
| Billing history | Low | None |

**Rationale:** Getting paid is essential. Even basic billing beats spreadsheets.

**Status in Intersul:** ✅ Implemented

---

## Differentiators (Competitive Advantage)

*Features that attract and retain customers by providing unique value. These are where Intersul can stand out.*

### 1. Advanced Scheduling & Optimization

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Drag-and-drop scheduling calendar | Medium | Service, User modules |
| Technician skill matching | High | Skill/certification data |
| Route optimization | High | Geolocation data |
| Auto-scheduling suggestions (AI/algorithmic) | Very High | Historical data, ML |
| Customer self-service booking portal | High | Public-facing app |

**Why Differentiation:** Most basic FSM tools have manual scheduling. Advanced optimization reduces costs and improves response times — highly valued by growing service businesses.

**Intersul Opportunity:** Add calendar view with drag-drop and skill-based assignment.

---

### 2. SLA/Contract Management

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Service level agreement tracking | Medium | Client, Service modules |
| Contract expiration alerts | Medium | Client module |
| Contract types (hourly, flat-rate, per-copy) | Medium | Billing module |
| Automated renewal notifications | Medium | Notification module |

**Why Differentiation:** Copy machine businesses often charge per copy or have maintenance contracts. This vertical-specific feature is rarely well-built in general-purpose FSM tools.

**Intersul Opportunity:** HIGH — This aligns directly with copy machine business model.

---

### 3. Parts/Inventory Management

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Parts inventory tracking | Medium | None |
| Parts consumption per job | Medium | Service module |
| Low stock alerts | Low | Notification module |
| Parts ordering from field | High | Supplier integration |
| Serial number tracking | Medium | Equipment module |

**Why Differentiation:** Technicians need parts to fix machines. Without inventory visibility, they make multiple trips (expensive). This is critical for efficiency.

**Intersul Opportunity:** MEDIUM — Currently not implemented. Key for professional service operations.

---

### 4. Mobile Technician Experience

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Mobile-friendly web app | Medium | Frontend responsiveness |
| Offline capability | High | Local storage, sync |
| Photo/video capture from field | Low | File upload |
| Customer signature capture | Low | None |
| Voice-to-text notes | Low | Third-party API |
| Real-time job updates | Medium | WebSocket/real-time |

**Why Differentiation:** Technicians are in the field. A poor mobile experience = low adoption = data gaps.

**Intersul Opportunity:** HIGH — Mobile use is critical for field service. Currently "native mobile apps" are out of scope per PROJECT.md, but responsive PWA could help.

---

### 5. Customer Communication/Engagement

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Automated appointment reminders (SMS/email) | High | Notification provider |
| Service completion notifications | Medium | Notification module |
| Customer portal for service history | Medium | Client-facing app |
| Quote/proposal generation | Medium | Template system |
| Customer feedback collection | Medium | Survey integration |

**Why Differentiation:** Proactive communication builds trust. Self-service portals reduce administrative overhead.

**Intersul Opportunity:** MEDIUM — Automated reminders especially valuable for appointment-based services.

---

### 6. Service Templates & Knowledge Base

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Pre-defined service checklists | Low | Service module |
| Standard operating procedures (SOPs) | Low | Knowledge base module |
| Troubleshooting guides | Medium | Knowledge base module |
| Recurring service templates | Medium | Scheduling, Service modules |

**Why Differentiation:** Consistency in service delivery. New technicians can follow proven processes.

**Intersul Opportunity:** MEDIUM — Service workflow steps already exist; templates would formalize this.

---

### 7. Multi-Location/Franchise Support

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Manage multiple branch locations | Medium | Organization module |
| Location-specific reporting | Medium | Reporting module |
| Cross-location inventory sharing | High | Inventory module |
| Centralized vs distributed access controls | Medium | Auth module |

**Why Differentiation:** Growing service companies often expand geographically. Platform must scale with them.

**Intersul Status:** ⚠️ Franchise management exists but limited.

---

### 8. Advanced Analytics & Business Intelligence

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Custom report builder | High | Reporting framework |
| Profit margin analysis by service type | Medium | Billing, Cost modules |
| Technician performance metrics | Medium | Service, User modules |
| Predictive maintenance alerts | Very High | ML, IoT data |
| Trend analysis (season) | Mediumal, growth | Historical data |

**Why Differentiation:** Helps owners make data-driven decisions. Beyond basic dashboards.

**Intersul Opportunity:** LOW-MEDIUM — Start with technician performance metrics.

---

### 9. Integrations

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Accounting software sync (QuickBooks, etc.) | High | API integration |
| Payment processor integration | High | Payment gateway |
| SMS/Email service provider | Medium | Third-party API |
| Calendar sync (Google, Outlook) | Medium | OAuth integration |

**Why Differentiation:** Customers hate double data entry. Integrations save time and reduce errors.

**Note:** PROJECT.md lists "Third-party integrations" as out of scope. Reconsider for differentiation.

---

## Anti-Features (Deliberately NOT Build)

*Features to avoid — either outside domain, too resource-intensive, or not valuable for target users.*

| Feature | Rationale for Exclusion |
|---------|------------------------|
| **Financial accounting (general ledger, AP/AR)** | Already in PROJECT.md scope. Use integrations instead. |
| **Point-of-sale integration** | Not relevant to service business model |
| **Hardware monitoring/diagnostics (IoT)** | Requires sensors on machines; too complex for current scope |
| **Marketing automation** | Not core to service delivery |
| **Native mobile apps** | High development cost; responsive PWA sufficient |
| **Employee HR/payroll** | Out of scope for service management |
| **Project management (beyond service orders)** | Different domain |
| **E-commerce/customer self-store** | Not a retail business |
| **Multi-tenant white-label** | Complexity not justified for single-company use |
| **Real-time GPS tracking** | Privacy concerns; not core need for copy machine service |

---

## Feature Dependency Map

```
Client Management
    ├── Service Orders → Scheduling → Dispatch
    ├── Billing → Invoicing
    └── Equipment → Parts Consumption
    
User Management → Role-Based Access
    └── Employee Assignment → Performance Metrics
    
Service Templates → Knowledge Base → Mobile App
    
SLA/Contracts → Renewal Alerts → Billing
    
Inventory/Parts → Low Stock Alerts → Purchasing
```

---

## Recommendations for Intersul

### Priority 1 — Fill Table Stakes Gaps
1. **Scheduling/Calendar UI** — Add visual calendar for work orders
2. **Mobile-responsive improvements** — Critical for field technicians

### Priority 2 — Build Differentiators
3. **SLA/Contract management** — Vertical-specific, high value
4. **Parts/inventory tracking** — Operational necessity
5. **Customer communication** (reminders, notifications)

### Priority 3 — Future Enhancements
6. **Technician skill matching** — As business grows
7. **Custom reporting** — When users request
8. **Integrations** — As budget allows

---

## Sources

- Gartner ITSM Platform Research
- ServiceNow Field Service Management Documentation
- FieldPulse, FieldBOSS, Skedulo Feature Comparisons
- Reddit r/fieldservicesoftwares community feedback
- Oracle Field Service Management Guides

---

*This document feeds into requirements definition for Intersul feature roadmap.*
