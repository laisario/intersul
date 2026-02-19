# Intersul

## What This Is

Intersul is a comprehensive service management platform designed specifically for businesses that provide copy machine services. The platform enables service providers to manage their entire operation—from client relationships and service delivery to inventory tracking and workflow automation—through a unified web-based dashboard.

## Core Value

Service providers can manage all service types (maintenance, rentals, sales, and supplies) through a unified platform with automated workflow tracking, centralized client management, and real-time inventory visibility.

## Requirements

### Validated

- ✓ User authentication with email/password — existing
- ✓ JWT session persistence — existing
- ✓ Client management (CRUD) — existing
- ✓ Copy machine inventory management — existing
- ✓ Service management with workflow steps — existing
- ✓ Employee assignment to service steps — existing
- ✓ Dashboard and statistics — existing
- ✓ User invitation system — existing
- ✓ Billing management — existing
- ✓ Category management — existing

### Active

- [ ] Feature enhancement or bug fixes based on user feedback
- [ ] Additional integrations or capabilities as needed

### Out of Scope

- Financial accounting (general ledger, AP/AR)
- Point-of-sale integration
- Hardware monitoring/diagnostics
- Marketing automation
- Third-party integrations
- Native mobile applications

## Context

**Technical Environment:**
- Backend: NestJS 10 with TypeORM, MySQL database
- Frontend: SvelteKit 2 with TanStack Query, Tailwind CSS
- Authentication: JWT with Passport.js
- File Storage: Cloudflare R2

**Existing Codebase:**
- Full-stack TypeScript application (backend + frontend)
- RESTful API with Swagger documentation
- Monorepo structure with backend/frontend directories
- Comprehensive feature modules: Auth, Clients, CopyMachines, Services, Dashboard, Billings, Common

**Prior Work:**
- Core platform fully implemented
- Database schema with entities for all major features
- Frontend UI components and pages for CRUD operations

## Constraints

- **Tech Stack**: NestJS + SvelteKit + MySQL — established, no changes planned
- **Deployment**: FTP for frontend, Node.js for backend — established
- **Scope**: Service management for copy machine industry — focused domain

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NestJS + SvelteKit stack | Full-stack TypeScript, strong typing | ✓ Good |
| TypeORM for database | MySQL with TypeORM provides good abstraction | ✓ Good |
| JWT authentication | Stateless, suitable for web dashboards | ✓ Good |
| Monorepo structure | Backend and frontend in one repo | ✓ Good |

---

*Last updated: 2026-02-18 after project initialization*
