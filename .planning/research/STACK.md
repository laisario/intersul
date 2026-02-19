# Service Management Platform Stack Research

**Research Date:** 2026-02-18  
**Context:** Intersul - Service management platform for copy machine businesses

---

## 1. Executive Summary

Your existing stack (NestJS + TypeORM + MySQL / SvelteKit + TanStack Query + Tailwind) is well-aligned with 2026 best practices for service management platforms. This research identifies complementary additions, modern best practices you may be missing, and what to avoid.

---

## 2. What's Working Well

Your current choices are solid:

| Component | Current | 2026 Verdict |
|-----------|---------|--------------|
| **Backend** | NestJS 10 | ✅ Good - NestJS is a top choice for enterprise Node.js |
| **ORM** | TypeORM 0.3 | ⚠️ Consider alternatives (see below) |
| **Database** | MySQL | ✅ Good - Appropriate for relational service data |
| **Frontend** | SvelteKit + Svelte 5 | ✅ Excellent - SvelteKit is a top 2026 framework |
| **State** | TanStack Query | ✅ Good - Industry standard for server state |
| **Styling** | Tailwind CSS 4 | ✅ Good - Continues to dominate |
| **Auth** | Passport JWT | ✅ Good - Reliable, though consider newer options |

---

## 3. Recommended Additions

### 3.1 Backend: Consider Prisma or Drizzle Instead of TypeORM

**Why:** TypeORM's maintenance has slowed. In 2026, **Prisma** and **Drizzle ORM** are preferred for TypeScript projects.

| ORM | Pros | Cons |
|-----|------|------|
| **Prisma** | Excellent DX, type-safe, great migration system, active development | Slightly heavier runtime |
| **Drizzle ORM** | Lightweight, SQL-like syntax, very fast, full type safety | Smaller ecosystem |

**Recommendation:** For new features, consider Prisma for its developer experience and migration tooling. Migration path from TypeORM is incremental—you can run both ORMs in parallel during transition.

### 3.2 Add Superforms for SvelteKit Forms

**Why:** Superforms is the 2026 standard for SvelteKit form handling with:
- Full type safety with Zod validation
- Server + client validation unified
- Works seamlessly with TanStack Query

```bash
npm install sveltekit-superforms zod
```

**Alternative:** Felte (lighter weight) if you want minimal dependencies.

### 3.3 Replace bits-ui with shadcn-svelte

**Why:** shadcn-svelte provides:
- Copy-to-own component philosophy (full control)
- Better maintenance and community
- Svelte 5 support, Tailwind CSS v4 compatibility
- New chart components via LayerChart integration

**Migration:** Components are copied into your project, giving you full ownership.

```bash
npx shadcn-svelte@latest init
```

### 3.4 Charts: Unovis or LayerChart

**Why:** LayerChart is already in your stack (v2.0.0-next.27). For production:
- **Unovis** - Modular, minimalist, great for dashboards
- **LayerChart** - Native Svelte, D3-based, works well with Tailwind

Your existing LayerChart choice is sound. Ensure you're using the stable release, not beta.

### 3.5 API Validation: Use Zod End-to-End

**Why:** Zod provides runtime validation with TypeScript inference:
- Validate API inputs (DTOs) with same schema on frontend/backend
- Eliminates duplicated validation logic

```bash
npm install zod
```

Use with class-validator via `zod-class` or migrate DTOs to Zod-only validation.

### 3.6 Observability: Add Structured Logging

**Why:** Production service management platforms need structured logs for debugging.

| Tool | Use Case |
|------|----------|
| **Winston** | Traditional structured logging |
| **Pino** | Faster, simpler, used by Fastify/NestJS |
| **Datadog/CLS** | APM + distributed tracing |

**Recommendation:** Start with Pino (built into NestJS). Add Datadog for full APM as you scale.

```bash
npm install pino pino-pretty
```

---

## 4. Service Management Platform-Specific Features

### 4.1 AI Integration (2026 Priority)

Gartner predicts 40% of enterprise apps will have AI agents by end of 2026. For service management:

| Feature | Implementation Approach |
|---------|------------------------|
| **Ticket Classification** | LLM API (OpenAI, Anthropic) for auto-categorization |
| **Knowledge Base Search** | Vector search with pgvector or embedded summaries |
| **AI Copilot** | eesel AI, Moveworks (external) or custom LLM integration |
| **Predictive Maintenance** | ML models for machine failure prediction (your copy machine domain) |

**Recommendation:** Start with ticket triage/classification using LLM APIs. Don't build custom ML infrastructure yet—use managed services.

### 4.2 Workflow Automation

| Capability | Tool | Notes |
|------------|------|-------|
| **Visual Workflows** | BPMN.js, Workflow.js | For service process automation |
| **Scheduled Tasks** | Bull (already in stack) | Enable for maintenance reminders |
| **Webhooks** | @nestjs/platform-express | Already available |

**Your Current Setup:** Bull is already included (disabled for MVP). Consider enabling for:
- Automated service reminder notifications
- Periodic maintenance schedule checks
- Report generation jobs

### 4.3 Real-Time Features

For live updates (technician status, ticket updates):

| Tool | Use Case |
|------|----------|
| **Socket.io** | Real-time bidirectional communication |
| **Server-Sent Events** | Simpler one-way updates |
| **Pusher** | Managed real-time service |

**Recommendation:** Add Socket.io via `@nestjs/websockets` for live technician dashboards.

### 4.4 CMDB (Configuration Management Database)

For copy machine tracking (your machine inventory):

| Feature | Implementation |
|---------|----------------|
| **Asset Tracking** | Your existing machine inventory |
| **Relationship Mapping** | Machines ↔ Clients ↔ Service Contracts |
| **Dependency View** | Which machines affect which services |

**Recommendation:** Your machine inventory is already serving as a lightweight CMDB. Consider adding:
- Machine relationship fields (parent/child, dependencies)
- Contract SLA tracking linked to machines

---

## 5. What NOT to Use and Why

| Tool | Why Avoid | Alternative |
|------|-----------|-------------|
| **TypeORM (for new code)** | Slow maintenance, complex queries | Prisma, Drizzle |
| **MongoDB** | Not appropriate for relational service data | Keep MySQL |
| **REST-only** | Consider GraphQL for complex queries | Add GraphQL via `@nestjs/graphql` if needed |
| **Redux (frontend)** | Overkill with TanStack Query | Keep TanStack Query |
| **Plain CSS/SCSS** | You're using Tailwind - stick with it | N/A |
| **jQuery** | Not needed with Svelte | N/A |
| **Monolithic Controllers** | Avoid large service files | Use NestJS modules, domain-driven boundaries |

---

## 6. Security (2026 Essentials)

| Area | Recommendation |
|------|----------------|
| **API Security** | Add `@nestjs/throttler` for rate limiting |
| **Input Validation** | Use Zod (see 3.5) |
| **CORS** | Configure properly in NestJS |
| **Helmet** | Add helmet middleware |
| **RBAC → ABAC** | Consider attribute-based access as you grow |

**2026 Auth Note:** JWT is fine. For advanced needs, consider:
- **PASETO** - Newer, simpler token format
- **Keycloak** - If you need full identity management

---

## 7. Implementation Roadmap

### Phase 1: Quick Wins (1-2 sprints)
- [ ] Add Zod for API validation
- [ ] Enable Pino logging
- [ ] Add `@nestjs/throttler`

### Phase 2: Form Handling (1 sprint)
- [ ] Integrate Superforms for new forms
- [ ] Migrate forms progressively

### Phase 3: UI Modernization (2 sprints)
- [ ] Evaluate shadcn-svelte for new components
- [ ] Ensure LayerChart stable release

### Phase 4: Platform Features (Ongoing)
- [ ] Enable Bull for background jobs
- [ ] Add Socket.io for real-time
- [ ] Consider Prisma for new modules

### Phase 5: AI Readiness (Future)
- [ ] LLM integration for ticket classification
- [ ] Knowledge base search

---

## 8. Version Recommendations

| Package | Current | Recommended | Notes |
|---------|---------|-------------|-------|
| Node.js | 20 | **22.x LTS** | 2026 minimum |
| NestJS | 10 | **11.x** | Latest has Express 5 support |
| SvelteKit | 2.43.2 | **2.x (latest)** | Stay on 2 until Svelte 6 stable |
| Svelte | 5.39.5 | **5.x** | Good |
| Tailwind CSS | 4.1.13 | **4.x** | Good |
| TanStack Query | 6.0.3 | **5.x or 6.x** | Check compatibility |
| TypeORM | 0.3 | Consider **Prisma** | See 3.1 |
| MySQL | 8.0 | **8.0+** | Good |

---

## 9. Sources

- Service management platform trends: Salesforce ITSM Guide, Adaptavist 2026 Predictions
- NestJS best practices: NestJS 11 documentation, TheLinuxCode
- Svelte ecosystem: Svelte Society, Weavelinx chart comparison
- Tech stack 2026: A3 IT Solutions, NanoByte Technologies
- AI in ITSM: eesel AI, Gartner (cited by vendors)

---

*Research for roadmap planning - 2026-02-18*
