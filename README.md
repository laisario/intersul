# Intersul Monorepo

Combined frontend and backend codebase for the Intersul service management platform. This repository keeps both applications under a single Git history so shared tooling, documentation, and deployment workflows stay in sync.

## Repository Layout

- `frontend/` – SvelteKit application responsible for the dashboard, client management, service history, and invitation-based onboarding experience. See `frontend/README.md` for framework-specific guidance.
- `backend/` – NestJS API that exposes authentication, user invitation, services, clients, and reporting endpoints. Detailed setup lives in `backend/README.md`.
- Root-level scripts, test helpers, and CI resources live alongside this README and are intended to orchestrate both apps together.

## Tech Stack Overview

- **Frontend:** SvelteKit, TypeScript, Tailwind, TanStack Query, Vite.
- **Backend:** NestJS, TypeScript, TypeORM, MySQL, Redis/Bull for queues, Swagger for API docs.
- **Infrastructure & Tooling:** Docker Compose, npm (per project), git-filter-repo guidance for history hygiene, automated test scripts.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intersul
   ```

2. **Install dependencies**
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && npm install`

3. **Run development servers**
   - Frontend: `npm run dev` (from `frontend/`)
   - Backend: `npm run start:dev` (from `backend/`)

4. **Environment variables**
   - Copy and adjust `backend/env.example` to configure the API and database.
   - The frontend consumes environment variables via Vite/SvelteKit conventions; see `frontend/README.md` if additional customization is required.

## Docker & Monorepo Workflows

- Use `backend/docker-compose.yml` to launch MySQL, Redis, and the NestJS API quickly.
- Frontend assets assume the API is reachable at the URL configured in their `.env` values; adjust when running the stack locally or in staging.
- End-to-end or integration tests located at the repository root (`TEST_REPORT.md`, `test-frontend-*.js`) interact with both services and help validate monorepo changes.

## Recommended Development Flow

1. Plan changes spanning both apps inside a single branch to keep migrations and UI adjustments aligned.
2. Update backend contracts first (DTOs, controllers, services), then integrate the new endpoints or socket events from the frontend.
3. Keep pagination, invitation management, and statistics features consistent across modules by reusing utility components (`frontend/src/lib/components`) and shared services (`backend/src/modules`).
4. Before shipping, run the domain-specific tests in each package and any shared scripts in the repository root.

## Documentation & Support

- Backend-specific docs: `backend/README.md`
- Frontend-specific docs: `frontend/README.md`
- Architecture summaries, test reports, and utility scripts are stored alongside this README to provide a single source of truth for monorepo operations.

For questions about the monorepo structure or workflows, update this README or add new guides under `docs/` (create the folder if it does not exist) so future contributors can follow the same process.

