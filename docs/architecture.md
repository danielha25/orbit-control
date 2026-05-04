# Orbit Control — Architecture

## Architecture goals
This project is designed to be:
- small and testable
- easy to explain in interviews
- easy to extend later
- suitable for a QA Automation / SDET portfolio

It is not a production-grade platform.

## Project structure

```text
project-root/
├── AGENTS.md                  # instructions for Codex
├── CLAUDE.md                  # instructions for Claude Code
├── README.md
├── docs/
│   ├── MVP.md                 # full MVP plan and phases
│   ├── architecture.md        # this file
│   ├── auth-test-plan.md      # auth automation contract and matrix
│   ├── current-phase.md       # active phase focus for agents
│   └── progress.md            # durable completed-work log
├── prisma/
│   ├── schema.prisma          # single schema file
│   ├── migrations/
│   └── seed.ts                # seeded space objects and test user
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── dashboard/route.ts
│   │   │   ├── objects/route.ts
│   │   │   ├── watchlist/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── missions/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── watchlist/page.tsx
│   │   ├── missions/page.tsx
│   │   ├── missions/[id]/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── components/            # shared UI, shell, form, and live-signal components
│   ├── lib/
│   │   ├── prisma.ts          # single Prisma client instance
│   │   ├── auth.ts            # session/cookie helpers
│   │   └── validators.ts      # input validation helpers
│   ├── server/
│   │   └── services/          # business logic layer
│   │       ├── auth-service.ts
│   │       ├── dashboard-service.ts
│   │       ├── external-space-service.ts
│   │       ├── watchlist-service.ts
│   │       └── mission-service.ts
├── tests/
│   ├── ui/                    # Playwright UI tests
│   ├── api/                   # Playwright API tests
│   ├── fixtures/              # test fixtures and setup
│   ├── pages/                 # Page Object classes
│   ├── utils/
│   │   ├── api.ts             # API helper functions
│   │   └── db.ts              # direct DB helpers for verification
│   └── data/                  # test data constants
├── .github/
│   └── workflows/ci.yml       # CI pipeline
├── Dockerfile
├── docker-compose.yml         # local infra
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Key conventions

- Each API route is a folder with `route.ts` inside `src/app/api/`
- Dynamic resource routes use `[id]/route.ts`
- Prisma client is imported from `src/lib/prisma.ts` everywhere — never instantiate a second client
- Auth uses session cookies managed in `src/lib/auth.ts`
- Application DB access goes through Prisma
- Tests may use Prisma-based DB helpers for direct state verification
- Input validation happens in route handlers via `src/lib/validators.ts`
- API responses follow a consistent shape: `{ data, error }`
- Pages use server components by default; client components only when interactivity is needed
- UI components get `data-testid` attributes for stable automation selectors
- Existing `data-testid` selectors should be preserved during design-only refactors
- Prefer API setup over UI setup in tests when it improves speed and stability
- Database columns may use snake_case, while application code may use camelCase through Prisma mapping
- Service files are named `feature-service.ts` and export plain functions, not classes
- Live third-party data is isolated behind service functions and must not be called directly from pages/components
- Near-earth objects returned by real NASA NeoWs may be persisted as `space_objects` with `source: "live-neows"` so users can add individual live objects to the watchlist or create missions for them
- Mock/fallback NeoWs fixtures are never catalog source data; they exist only for deterministic dashboard rendering in tests/CI or external API failure states

## Data flow

### Server-rendered pages

```text
Browser → Next.js Page (server component)
       → server/service layer
       → Prisma
       → PostgreSQL
```

### Client-side mutations and testable endpoints

```text
Browser / Playwright / client component
       → API route (src/app/api/...)
       → validation
       → service layer
       → Prisma
       → PostgreSQL
       → response { data, error }
```

## Auth flow

- Registration creates a user with a hashed password
- Login validates credentials, creates a server-side session row, and sets an HTTP-only session cookie
- `GET /api/auth/me` resolves the current user from the session cookie
- Protected routes check the cookie via `src/lib/auth.ts`
- `requireUser()` is the shared helper for protected server-side logic
- Session cookies store an opaque random token; the database stores only `token_hash`
- Logout deletes the session row and clears the cookie
- Unauthenticated users trying to access protected pages are redirected to `/login`
- No JWT, no OAuth, no external providers in v1

## Service layer responsibilities

Business logic should live in `src/server/services/`, not directly inside route handlers.

Examples:
- `auth-service.ts` handles register/login operations
- `dashboard-service.ts` prepares active seeded objects and external dashboard data
- `external-space-service.ts` owns NASA/ISS integration, mock mode, timeouts, and fallbacks
- `watchlist-service.ts` handles add/remove/list watchlist operations
- `mission-service.ts` handles missions CRUD, filters, and validation rules

API route handlers should stay thin:
1. Parse request
2. Validate input
3. Call service
4. Return response

## UI shell and design system

The app uses a global shell and token-based CSS layer:

- `src/app/layout.tsx` applies the app shell and fonts
- `src/components/app-shell.tsx` owns the authenticated app frame
- `src/components/sidebar.tsx` owns primary navigation
- `src/app/globals.css` contains design tokens and page primitives

Current design migration status:

- Foundation shell and dashboard redesign are complete
- Missions list redesign is complete
- Mission detail, mission composer, watchlist, and polish remain planned

Design migration is allowed to restyle existing behavior, but should not add
new product scope unless `docs/current-phase.md` says so.

## Database conventions

- All tables use `id` as UUID primary key
- All tables have `created_at` timestamp
- Mutable tables also have `updated_at`
- Foreign keys use `user_id`, `object_id` naming at the DB level
- Auth sessions use a `sessions` table with `token_hash` instead of storing raw tokens
- Seed data is deterministic — same objects every time for test stability

## Test architecture

- Page Objects live in `tests/pages/` — one class per screen
- API helpers live in `tests/utils/api.ts` — thin wrappers around request methods
- DB helpers live in `tests/utils/db.ts` — direct Prisma queries for state verification
- Test fixtures live in `tests/fixtures/` — shared setup/teardown and test user creation
- Test data constants live in `tests/data/` — reusable emails, titles, object names
- Each test file maps to one feature, for example: `auth.spec.ts`, `dashboard.api.spec.ts`, `missions.api.spec.ts`
- Tests must not depend on each other — each test sets up and cleans its own state
- Prefer API-based setup for faster and more stable tests
- UI tests should cover user-facing flows; API and DB helpers should support setup, verification, and cleanup
- Playwright runs the app with `SPACE_API_MODE=mock` so external APIs do not affect CI stability

## Response conventions

### Success

```json
{ "data": { ... }, "error": null }
```

### Failure

```json
{ "data": null, "error": "Mission not found" }
```

### HTTP status codes

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

## What is not in v1

- Role-based access — out of scope
- WebSocket / real-time — out of scope
- OAuth / external auth providers — out of scope
- Admin features — out of scope

## External API integration

Real space data is isolated in `src/server/services/external-space-service.ts`.
The dashboard consumes it through `getDashboardData()` so pages and API routes
do not call third-party services directly.

Current external sources:

- NASA APOD for the daily astronomy media item
- NASA NeoWs for near-earth object close approach data
- WhereTheISS for current ISS coordinates

Runtime behavior:

- `SPACE_API_MODE=live` calls real external APIs
- `SPACE_API_MODE=mock` returns deterministic payloads for tests and CI
- failed external requests fall back per source so the dashboard still renders
- `NASA_API_KEY` is optional locally because the service falls back to `DEMO_KEY`
- `SPACE_API_TIMEOUT_MS` bounds external API latency
- Dashboard loads upsert the current NeoWs asteroid list into `space_objects` as `live-neows` records only when the NeoWs source itself is live. Mock/fallback asteroid fixtures are not persisted; stale unreferenced `live-neows` records are removed when they are no longer in the current live feed, while records used by watchlists or missions are retained

## Infrastructure

Docker Compose starts PostgreSQL and the Next.js app together. The app container
applies Prisma migrations and seeds deterministic data before starting.

GitHub Actions uses a PostgreSQL service container, runs Prisma migrations and
seed data, typechecks, builds, installs Playwright browsers, runs Playwright,
and uploads report artifacts.
