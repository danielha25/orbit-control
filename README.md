# Orbit Control

Orbit Control is a small QA Automation / SDET portfolio app for tracking seeded
space objects, managing a watchlist, and creating monitoring missions.

The app is intentionally compact: the product surface is small, while the
automation and infrastructure layers are explicit and easy to discuss.

## Current Status

The MVP is implemented: auth, dashboard, watchlist, missions CRUD, API routes,
Prisma/PostgreSQL, Playwright UI/API coverage, Docker Compose, and GitHub
Actions quality gates are in place.

The current workstream is a scoped design migration. Completed design steps:

- Foundation shell and design tokens
- Dashboard redesign with live space signals
- Mission detail redesign
- Mission composer modal
- Watchlist redesign
- Polish pass for toasts and auth pages

The test framework was also hardened as a portfolio artifact: UI tests are split
by feature, API tests cover auth/dashboard/watchlist/missions contracts, and CI
publishes separate API/UI Playwright artifacts.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- Playwright
- Docker Compose
- GitHub Actions

## Real Space APIs

Dashboard live signals use server-side requests to:

- NASA APOD: `https://api.nasa.gov/planetary/apod`
- NASA NeoWs: `https://api.nasa.gov/neo/rest/v1/feed`
- ISS position: `https://api.wheretheiss.at/v1/satellites/25544`

Set `NASA_API_KEY` for normal use. If it is omitted, the app uses `DEMO_KEY`.
Automated tests and CI use `SPACE_API_MODE=mock` so external network state does
not make the test suite flaky.

Live failures fall back per source, so APOD, ISS, or NeoWs outages do not break
the dashboard. Mock mode and fallback mode are visually distinct in the UI.

## Environment

Create `.env` from `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/orbit_control?schema=public"
NASA_API_KEY="DEMO_KEY"
SPACE_API_MODE="live"
SPACE_API_TIMEOUT_MS="5000"
```

`SPACE_API_MODE` supports:

- `live` - call real external APIs and fall back per source on failures
- `mock` - use deterministic local payloads for tests and CI

## Local Setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app starts at `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npx playwright test
```

Playwright starts its own Next.js server on `127.0.0.1:3101` with
`SPACE_API_MODE=mock`.

For the local equivalent of CI static gates:

```bash
npm run quality:static
```

For the full local gate set:

```bash
npm run quality
```

## Docker

```bash
docker compose up --build
```

The compose setup starts PostgreSQL, applies migrations, seeds deterministic
data, and runs the Next.js app on `http://localhost:3000`.

## Test Coverage

Current automation covers:

- UI auth and dashboard smoke flows
- UI watchlist add/filter/remove flows
- UI mission create/detail/update/search/filter/delete flows
- API auth session contracts
- API dashboard contract with deterministic external API data
- API watchlist add/list/delete and duplicate/unauthorized contracts
- API mission create/list/get/update/delete flow
- DB-aware verification helpers for user/session/mission state
- Page objects for login, dashboard, watchlist, and missions

The current baseline is 24 Playwright tests across 7 feature-oriented files.

See `docs/test-framework.md` for the test architecture and CI quality gates.

## CI Quality Gates

GitHub Actions runs the pipeline as separate, reviewable gates:

- `static-quality`: Prisma client generation, TypeScript typecheck, ESLint
- `build`: production Next.js build
- `api-tests`: PostgreSQL service, migrations, seed, Playwright API tests
- `ui-tests`: PostgreSQL service, migrations, seed, Playwright UI tests
- `quality-gates`: aggregate required status for branch protection

## Useful Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:ui
npm run test:api
npm run prisma:migrate
npm run prisma:seed
```
