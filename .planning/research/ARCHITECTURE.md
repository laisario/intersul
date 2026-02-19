# Service Management Platform Architecture

## Overview

This document describes the architecture for Intersul, a service management platform for copy machine businesses. The system follows a modular monolith approach using NestJS for the backend and SvelteKit for the frontend.

## Component Architecture

### Layer 1: Presentation (Frontend)
```
┌─────────────────────────────────────────────────────────────┐
│  SvelteKit Frontend (TanStack Query)                        │
│  ├── Protected Routes (Dashboard, Clients, Machines, etc)  │
│  └── Public Routes (Login, Register, Invites)              │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: API Gateway / Application (Backend)
```
┌─────────────────────────────────────────────────────────────┐
│  NestJS Backend                                             │
│  ├── Controllers (HTTP Request Handling)                    │
│  ├── Services (Business Logic)                              │
│  └── Modules (Dependency Injection Containers)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer 3: Data Access
```
┌─────────────────────────────────────────────────────────────┐
│  TypeORM + MySQL                                            │
│  └── Entities (Data Models)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Module Boundaries

### Current Modules and Responsibilities

| Module | Responsibility | External Dependencies |
|--------|----------------|----------------------|
| **Auth** | User authentication, JWT tokens, invitations | None (core) |
| **Common** | Shared entities (Address, City, State, Image, Approval) | All modules |
| **Clients** | Client management, contact information | Common (Address) |
| **CopyMachines** | Machine catalog, client machine assignments, franchises | Clients |
| **Services** | Service tickets, categories, steps, templates | Clients, CopyMachines |
| **Billings** | Billing generation, payment tracking | Clients, Services |
| **Dashboard** | Statistics, aggregated data | All modules |

### Communication Boundaries

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Auth    │────▶│ Common   │────▶│   Clients    │
└──────────┘     └──────────┘     └──────────────┘
                                             │
                                             ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│Dashboard │◀────│  Billings    │◀────│CopyMachines │
└──────────┘     └──────────────┘     └──────────────┘
       │                                   │
       └───────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Services   │
                    └──────────────┘
```

## Data Flow

### Request-Response Flow

```
User Action
    │
    ▼
SvelteKit Page (+page.svelte)
    │
    ▼
TanStack Query Hook (useQuery/useMutation)
    │
    ▼
API Client (lib/api/endpoints/*.ts)
    │
    ▼
NestJS Controller (@Controller)
    │
    ▼
NestJS Service (Business Logic)
    │
    ▼
TypeORM Repository
    │
    ▼
MySQL Database
```

### Key Data Relationships

1. **Client → CopyMachine**: One-to-Many (client owns multiple machines)
2. **Client → Service**: One-to-Many (client has multiple service tickets)
3. **Service → Step**: One-to-Many (service has multiple steps)
4. **Service → Billing**: One-to-Many (service generates billing records)
5. **Client → Address**: One-to-One (client has address via Common)

## Suggested Build Order

### Phase 1: Foundation (Weeks 1-2)
Build in this order due to dependencies:
1. **Common** - Base entities (Address, Image, Approval) needed everywhere
2. **Auth** - Core authentication, no dependencies

### Phase 2: Core Business (Weeks 3-5)
3. **Clients** - First-class business entity, depends on Common
4. **CopyMachines** - Machine catalog, depends on Clients

### Phase 3: Operations (Weeks 6-8)
5. **Services** - Core service ticketing, depends on Clients, CopyMachines
6. **Billings** - Financial tracking, depends on Services

### Phase 4: Analytics (Weeks 9-10)
7. **Dashboard** - Aggregations, depends on all modules

### Current Status
- [x] Phase 1: Complete
- [x] Phase 2: Complete
- [x] Phase 3: Complete
- [x] Phase 4: Complete

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | SvelteKit | UI Framework |
| State Management | TanStack Query | Server State |
| Backend | NestJS | API Framework |
| ORM | TypeORM | Database Abstraction |
| Database | MySQL | Primary Data Store |
| Auth | JWT + Passport | Authentication |
| File Storage | AWS S3 | Image/Document Storage |
| Job Queue | Bull + Redis | Async Processing |

## Extension Points

### Adding New Modules
1. Create module directory: `backend/src/modules/<module-name>/`
2. Create entity in `entities/` subdirectory
3. Create service in `service/` subdirectory
4. Create controller in `controller/` subdirectory
5. Register module in `app.module.ts`
6. Create API endpoint in `frontend/src/lib/api/endpoints/`
7. Create Svelte page in `frontend/src/routes/`

### Cross-Cutting Concerns
- **Validation**: Use DTOs with class-validator
- **Error Handling**: HttpExceptionFilter in common/filters
- **Logging**: NestJS built-in logger
- **Testing**: Jest with unit, integration, and e2e tests
