# Project Research Summary

**Project:** Intersul — Service Management Platform  
**Domain:** Field Service Management (FSM) for Copy Machine Businesses  
**Researched:** 2026-02-18  
**Confidence:** HIGH

## Executive Summary

Intersul is a service management platform designed specifically for copy machine businesses, combining equipment sales/rentals with maintenance services, SLA-based contracts, and billing. The platform uses a modular monolith architecture with NestJS backend and SvelteKit frontend — a well-established pattern for enterprise service management applications in 2026.

**Research Conclusion:** The existing stack is solid and aligned with current best practices. Key recommendations are to: (1) gradually migrate from TypeORM to Prisma for better DX, (2) add Superforms + Zod for type-safe form handling, and (3) prioritize SLA/Contract management as the primary differentiator since it aligns directly with the copy machine business model (click charges, meter reads, maintenance contracts).

**Key Risks:** The most critical risk is over-engineering before product-market fit — the current feature set covers core needs but scheduling/calendar UI and mobile responsiveness have gaps. These should be filled before investing in advanced features like AI dispatch or predictive maintenance. Data quality and field-friendly UX are also critical success factors that must be prioritized early.

## Key Findings

### Recommended Stack

The current technology choices are sound for 2026. NestJS + SvelteKit + TanStack Query + Tailwind is a well-proven combination for service management platforms. The primary recommendations are incremental improvements rather than wholesale changes.

**Core technologies:**
- **NestJS 11** — Enterprise Node.js framework, excellent for modular monoliths
- **SvelteKit 2.x** — Top-tier 2026 frontend framework with Svelte 5 support
- **TanStack Query** — Industry standard for server state management
- **Tailwind CSS 4** — Continues to dominate styling
- **MySQL 8.0** — Appropriate for relational service data

**Recommended additions:**
- **Prisma or Drizzle** — Consider for new modules instead of TypeORM (better maintenance, type-safety)
- **Superforms** — For type-safe SvelteKit form handling with Zod validation
- **shadcn-svelte** — Replace bits-ui for better Svelte 5/Tailwind v4 compatibility
- **Zod** — End-to-end API validation (frontend ↔ backend)
- **Pino** — Structured logging (built into NestJS)
- **Socket.io** — For real-time technician dashboards

### Expected Features

The platform has most table stakes implemented. The main gaps are in scheduling UI and mobile responsiveness.

**Must have (table stakes):**
- Client/Customer management — ✅ Implemented
- Service request/work order management — ✅ Implemented
- Equipment/Asset tracking (machines) — ✅ Implemented
- Basic reporting/dashboard — ✅ Implemented
- User management & RBAC — ✅ Implemented
- Basic billing/invoicing — ✅ Implemented
- **Scheduling & Calendar UI** — ⚠️ **GAP** (employee assignment exists, but no visual calendar)
- **Mobile-responsive experience** — ⚠️ **GAP** (critical for field technicians)

**Should have (competitive differentiators):**
- **SLA/Contract management** — HIGH priority: aligns with copy machine business model (click charges, meter reads, per-copy billing)
- **Parts/Inventory management** — MEDIUM priority: operational necessity for service efficiency
- Customer communication (automated reminders, notifications)
- Service templates & knowledge base

**Defer (v2+):**
- AI-powered auto-scheduling
- Predictive maintenance
- Advanced BI/custom report builder
- Native mobile apps (responsive PWA is sufficient)
- GPS tracking
- Multi-tenant white-label

### Architecture Approach

The platform follows a modular monolith pattern with clear boundaries between layers:

- **Presentation Layer:** SvelteKit + TanStack Query
- **API Layer:** NestJS (Controllers → Services → Modules)
- **Data Layer:** TypeORM + MySQL

**Major components:**
1. **Auth Module** — JWT authentication, user invitations
2. **Clients Module** — Customer management with addresses
3. **CopyMachines Module** — Machine inventory, client assignments
4. **Services Module** — Service tickets, workflows, templates
5. **Billings Module** — Invoice generation, payment tracking
6. **Dashboard Module** — Statistics and aggregations

### Critical Pitfalls

1. **Over-engineering before product-market fit** — Build minimal viable feature set first; validate with real users before expanding to AI, predictive maintenance, etc.

2. **Ignoring copier-specific complexity** — Meter reads, click charges, contract SLA tiers, technician certifications by machine brand — these are essential domain features that generic FSM tools miss.

3. **Designing for office, not field** — Mobile interface must be optimized for on-site technicians: offline-first, minimal taps, quick data entry.

4. **Data quality underestimation** — Asset records missing serial numbers, contract terms in free-text fields, duplicate records — breaks scheduling, dispatch, and billing logic.

5. **Weak SLA and escalation management** — Without automatic SLA tracking and escalation, response times degrade silently and customers lose confidence.

## Implications for Roadmap

Based on research, the recommended phase structure prioritizes filling core gaps before adding advanced features:

### Phase 1: Foundation & Quick Wins
**Rationale:** Low-cost, high-impact improvements that strengthen the existing foundation
**Delivers:** Type-safe forms, structured logging, API validation, rate limiting
**Uses:** Superforms, Zod, Pino, @nestjs/throttler
**Avoids:** Pitfall #11 (Security gaps), Pitfall #9 (Over-engineering — by keeping scope small)

### Phase 2: Core Feature Gaps
**Rationale:** Fill table stakes gaps that cause churn; scheduling UI and mobile responsiveness are critical for field service adoption
**Delivers:** Visual scheduling calendar, mobile-responsive enhancements
**Avoids:** Pitfall #3 (Designing for office, not field), Pitfall #2 (Data quality issues)

### Phase 3: Vertical Differentiation
**Rationale:** SLA/Contract management is the primary differentiator for copy machine businesses — build this before competitors do
**Delivers:** SLA tier tracking, contract renewal alerts, meter read tracking, click-charge billing
**Avoids:** Pitfall #4 (Ignoring copier complexity), Pitfall #8 (Weak SLA management)

### Phase 4: Operational Efficiency
**Rationale:** Parts/inventory management directly impacts technician efficiency — reduces multiple trips
**Delivers:** Parts inventory, low-stock alerts, parts consumption per job tracking
**Avoids:** Pitfall #5 (Siloed operations — integrates service with inventory)

### Phase 5: Platform Features
**Rationale:** Real-time updates and background jobs enhance but aren't essential for launch
**Delivers:** Socket.io for live technician dashboards, Bull queue for maintenance reminders
**Avoids:** Pitfall #9 (Over-engineering — defer to after core validated)

### Phase 6: Advanced (Future)
**Rationale:** AI features, predictive maintenance — only after core product-market fit is proven
**Delivers:** Ticket classification, knowledge base search, predictive maintenance alerts
**Avoids:** Pitfall #9 (Over-engineering)

### Phase Ordering Rationale

- **Phase 1-2 before 3:** Foundation and core gaps must be solid before differentiation
- **Phase 3 before 4:** Contracts define what inventory is needed; don't build inventory without contract model
- **Phase 5 after core:** Real-time features are enhancements, not table stakes
- **Phase 6 last:** AI/predictive features require data volume and proven core — too risky early

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (SLA/Contract Management):** Complex domain modeling — meter reads, click charges, SLA tiers, renewal logic. Consider domain expert interview.
- **Phase 4 (Inventory):** Parts compatibility with machine models, supplier integrations.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented libraries (Superforms, Zod, Pino)
- **Phase 2:** Standard calendar UI patterns, responsive design is well-established

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Current stack verified against 2026 best practices; recommendations from official docs and community |
| Features | HIGH | Table stakes and differentiators based on FSM industry research; gaps identified from feature parity analysis |
| Architecture | HIGH | Modular monolith pattern well-established; module boundaries clearly defined in existing codebase |
| Pitfalls | HIGH | Based on industry research specific to field service and copy machine service businesses |

**Overall confidence:** HIGH

### Gaps to Address

- **Mobile offline scenarios:** Not explicitly addressed in current roadmap phases. Need to prioritize offline-first mobile design when Phase 2 is planned.
- **Change management:** Not a technical gap but critical for adoption. Include training and rollout planning in implementation phases.
- **Integration architecture:** Third-party integrations (QuickBooks, payment processors) noted as out of scope in PROJECT.md but should be flagged if business needs change.

## Sources

### Primary (HIGH confidence)
- NestJS 11 Documentation — Backend framework patterns
- Svelte/SvelteKit Official Docs — Frontend framework
- ServiceNow Field Service Management Documentation — FSM industry reference

### Secondary (MEDIUM confidence)
- Gartner ITSM Platform Research — Feature categorization
- Stack Overflow Developer Surveys 2025-2026 — Technology trends
- FieldPulse, Skedulo, ServiceTitan Feature Comparisons — Competitive landscape

### Tertiary (LOW confidence)
- Reddit r/fieldservicesoftwares community feedback — User perspectives, needs validation
- Gartner AI in ITSM predictions — Forward-looking, needs validation with actual adoption

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
