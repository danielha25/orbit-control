# Orbit Control — Test Framework

## Purpose

The test framework is part of the portfolio value of the project. It is designed
to show clear QA Automation / SDET practices without turning the app into a
large product.

The framework demonstrates:
- UI automation against real user flows
- API contract automation against real Next.js route handlers
- DB-aware assertions through Prisma helpers
- deterministic test data and cleanup
- deterministic external API mode for CI
- CI quality gates with separate static, build, API, and UI jobs

## Test Layers

### UI tests

Location: `tests/ui/`

UI tests cover user-facing behavior:
- auth and dashboard smoke coverage
- watchlist add, status filtering, and remove flows
- mission create, detail, update, search/filter, delete confirm, and cancel delete flows

UI tests should use page objects from `tests/pages/` for reusable user actions.
The tests should assert stable `data-testid` selectors and user-visible outcomes.

### API tests

Location: `tests/api/`

API tests cover route contracts and status/error behavior:
- auth session lifecycle
- dashboard deterministic mock data contract
- watchlist add/list/delete and negative paths
- mission create/list/get/update/delete

API tests use `tests/utils/api.ts` as a thin HTTP wrapper and should assert the
standard `{ data, error }` response envelope.

### DB-aware checks

Location: `tests/utils/db.ts`

DB helpers verify durable side effects such as:
- user creation
- session creation/removal
- watchlist item persistence/removal
- mission persistence/removal

DB access is limited to test helpers. App code continues to use service-layer
Prisma calls.

## Shared Fixtures

Location: `tests/fixtures/test-fixtures.ts`

Fixtures provide:
- unique test credentials
- registered user setup and cleanup
- authenticated API request context
- logged-in browser session
- page objects for login, dashboard, watchlist, and missions

Each test should own its setup and cleanup through fixtures or API/DB helpers.
Tests must not depend on execution order.

## Deterministic Data

Playwright runs with `SPACE_API_MODE=mock`, which keeps NASA/ISS data stable in
tests and CI. Seeded catalog objects remain the stable test anchors:
- `apod`
- `iss`
- `near-earth-asteroids`

Live NASA NeoWs objects are product behavior, not CI test data.

## CI Quality Gates

GitHub Actions uses separate jobs so failures identify the failing quality layer:

- `static-quality`: Prisma generate, TypeScript typecheck, ESLint
- `build`: production Next.js build
- `api-tests`: PostgreSQL, migrations, seed, Playwright API suite
- `ui-tests`: PostgreSQL, migrations, seed, browser install, Playwright UI suite
- `quality-gates`: aggregate required status for branch protection

Recommended branch protection required check:
- `quality-gates`

Optional stricter branch protection can also require the individual gate jobs.

## Local Commands

```bash
npm run quality:static
npm run build
npm run test:api
npm run test:ui
```

Full local quality run:

```bash
npm run quality
```
