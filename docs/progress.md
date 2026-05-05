# Orbit Control — Progress

## Completed

### Foundation
- Next.js + TypeScript project scaffold is set up
- Prisma is configured for PostgreSQL
- `.env.example` and local `.env` flow are in place
- Prisma config is separated into `prisma.config.ts`

### Database
- Initial schema is implemented in `prisma/schema.prisma`
- Core tables are created:
  - `users`
  - `sessions`
  - `space_objects`
  - `watchlist_items`
  - `missions`
- UUID primary keys are used across the schema
- `created_at` and `updated_at` conventions are in place
- Prisma migrations have been created and applied locally

### Seed data
- Deterministic seeded space objects are implemented
- Active tracked objects are APOD, ISS, and Near-Earth Asteroids
- Mars, Jupiter, and the old synthetic Asteroid 2026 AB1 seed are deprecated and hidden from new flows
- Seeded test user is implemented
- Seeded watchlist item is implemented
- Seeded mission is implemented against Near-Earth Asteroids
- Seed uses `upsert` so it can be re-run safely

### Auth
- Auth approach is server-side opaque sessions, not JWT
- Password hashing uses `argon2`
- Session cookies are `HttpOnly` and `SameSite=Lax`
- Raw session tokens are stored only in cookies
- Database stores only `token_hash`
- Register endpoint is implemented
- Login endpoint is implemented
- Logout endpoint is implemented
- Current-session endpoint is implemented
- Shared `requireUser()` helper is implemented for protected server-side logic

### Test scaffolding and automation
- Auth test plan is documented in `docs/auth-test-plan.md`
- Playwright setup is added
- `playwright.config.ts` is configured with a local `webServer` and `baseURL`
- UI auth/dashboard smoke coverage is implemented
- API auth/dashboard/missions smoke coverage is implemented
- Shared fixtures, page objects, API helpers, DB helpers, and test data helpers are implemented
- Playwright runs with `SPACE_API_MODE=mock` for deterministic external API data
- Playwright HTML reports and trace-on-failure artifacts are configured

### Real external APIs
- Dashboard live signals are implemented through server-side service code
- NASA APOD is integrated
- NASA NeoWs near-earth object feed is integrated
- ISS live position is integrated
- External API failures use per-source fallback data instead of breaking the dashboard

### Infrastructure
- Dockerfile is added
- Docker Compose starts PostgreSQL and the app
- Compose startup applies migrations and seeds local data
- GitHub Actions CI is added
- CI runs install, Prisma generate, migrations, seed, typecheck, lint, build, and Playwright tests
- CI uploads Playwright report and test-results artifacts

### Documentation
- README is added with local setup, real API env vars, verification commands, Docker, and test coverage
- `.env.example` documents `NASA_API_KEY`, `SPACE_API_MODE`, and `SPACE_API_TIMEOUT_MS`

### Design migration
- Design tokens, dark/light color variables, page shell, sidebar, and shared chrome are implemented in `src/app/globals.css`, `src/app/layout.tsx`, and shell components
- Dashboard has been redesigned with:
  - sticky topbar with UTC clock
  - APOD hero using live image data when available and deterministic art fallback in mock/fallback modes
  - live signals panel for APOD, ISS position, and nearest asteroids
  - projected ISS world map using local `world-atlas` geography, avoiding external image/tile dependencies in CI
  - catalog object cards with procedural thumbnails
  - active missions and system status sections
- Mission list (`/missions`) has been redesigned with:
  - topbar mission counts
  - search/status/priority/sort/density toolbar
  - `oc-table` rows
  - status pills
  - priority bars
  - linked object thumbnails
  - design empty state
- Existing mission list `data-testid` selectors were preserved during the redesign
- Mission detail (`/missions/[id]`) has been redesigned with:
  - topbar breadcrumbs
  - view/edit modes
  - notes card and activity timeline
  - linked object sidebar and mission metadata
  - restyled update/delete controls
- Existing mission update/delete `data-testid` selectors were preserved during the redesign
- Mission composer (`/missions` New mission) has been moved into a design-system modal:
  - `oc-modal` panel hosting `MissionCreateForm`
  - `oc-form` / `oc-field` / `oc-input` / `oc-textarea` / `oc-select` primitives
  - close on Escape, backdrop click, or Cancel; redirect to created mission preserved
- Existing mission composer `data-testid` selectors were preserved during the redesign
- Watchlist (`/watchlist`) has been redesigned with:
  - topbar with status counts and dashboard/missions navigation
  - status filter tabs (All/Watching/Paused/Archived) via `searchParams`
  - `oc-watchcard` grid with object thumbnail, type, blurb, status pill, linked-mission count, and category meta
  - design empty state with filter-aware copy
  - restyled remove and `New mission` actions on each card
- Existing watchlist `data-testid` selectors were preserved during the redesign
- Step 5 (Polish) — partial:
  - global `ToastProvider` (`src/components/toast-provider.tsx`) with `useToast()` hook, queue, auto-dismiss, manual close
  - `oc-toast-region` / `oc-toast` styles with success/error/info variants in `src/app/globals.css`
  - `ToastProvider` wraps `AppShell` in `src/app/layout.tsx`
  - toasts wired into mission create/update/delete and watchlist add/remove flows
  - native `window.confirm` for mission delete replaced with an `oc-modal` confirmation dialog
  - new `data-testid`s added: `toast-region`, `toast` (with `data-variant`), `mission-delete-confirm`, `mission-delete-confirm-submit`
  - existing `mission-*` and `watchlist-*` `data-testid` selectors preserved
  - `/login` and `/register` redesigned in `src/components/auth-form.tsx` with a split-screen layout: starfield art panel + form column with brand mark, sign-in / create-account tab links, design-system inputs and primary block submit
  - auth-specific `oc-auth*` styles added to `src/app/globals.css`: desktop uses fixed `height: 100vh` + `overflow: hidden` with the form column as a flex column (`flex: 1` form-wrap centered, footer pinned at the bottom); `<= 900px` breakpoint collapses to single-column with `min-height: 100vh` and natural scroll
  - existing `login-*` and `register-*` `data-testid` selectors preserved; alternate-link wording (`Create an account`, `Back to login`) preserved so `LoginPage.goToRegister()` still works
  - unused `src/components/app-header.tsx` removed (no remaining imports)
  - real live NASA NeoWs near-earth objects are upserted into `space_objects` as `source: "live-neows"` trackable objects
  - mock/fallback NeoWs fixtures stay out of the catalog and are kept only as deterministic dashboard/test signal data
  - stale unreferenced `live-neows` objects are deleted during dashboard sync when they are no longer in the current NeoWs feed
  - watchlist and mission creation accept both stable `seed` objects and persisted `live-neows` objects
  - catalog cards now expose `+ Watchlist` and `New mission` actions for trackable objects, including persisted live NeoWs objects
  - catalog cards now show live feed summaries for APOD, ISS, the aggregate near-earth feed, and persisted individual near-earth objects
  - dashboard catalog now shows the first five trackable objects by default with a smooth show more/show fewer control for the rest
  - ISS position map now uses `d3-geo`, `topojson-client`, and local `world-atlas` data instead of hand-drawn continent paths
- User-requested automation framework hardening:
  - removed the broad `tests/ui/full-e2e.spec.ts` draft in favor of feature-oriented UI specs
  - added `tests/ui/watchlist.ui.spec.ts` for watchlist add/filter/remove flows
  - added `tests/ui/missions.ui.spec.ts` for mission create/detail/update/search/filter/delete flows
  - added `tests/api/watchlist.api.spec.ts` for watchlist route contracts and negative paths
  - added page objects for missions and watchlist
  - added an authenticated API request fixture for API-based setup
  - normalized watchlist service responses to lowercase status values so API contracts and UI filters use the same external values
  - removed cookie mutation from `getCurrentUser()` server-rendered reads for stale-cookie/missing-session cases
  - added local `quality:static` and `quality` scripts
  - split GitHub Actions into `static-quality`, `build`, `api-tests`, `ui-tests`, and aggregate `quality-gates`
  - documented the automation architecture in `docs/test-framework.md`

## Implemented API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/objects`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/[id]`
- `GET /api/missions`
- `POST /api/missions`
- `GET /api/missions/[id]`
- `PATCH /api/missions/[id]`
- `DELETE /api/missions/[id]`

## Verified
- `npx prisma migrate dev` runs successfully for the current schema
- `npx prisma db seed` runs successfully
- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- Manual API login flow was verified
- Manual API logout flow was verified
- Session rows are created in `sessions`
- Logout removes the current session tied to the active cookie
- Auth flow has a documented test matrix for later expansion
- Playwright UI/API coverage is stabilized as a finished baseline
- Dashboard external API data is verified in mock mode for deterministic tests
- Design migration Step 3a verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests
- Design migration Step 3b verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests
  - manual detail smoke against `/missions/[id]` create/view/edit/update/delete path
- Design migration Step 3c verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Design migration Step 4 verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Design migration Step 5 (toast provider + delete confirm) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - manual smoke: create / update / delete mission, add / remove watchlist trigger styled toasts; delete shows `oc-modal` confirm instead of native dialog
- Design migration Step 5 (auth redesign + app-header removal) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests (5 auth-and-dashboard UI tests cover the new screens)
- Design migration Step 5 (live NeoWs trackable objects) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Design migration Step 5 (collapsible catalog polish) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests
- Design migration Step 5 (NeoWs catalog source guard) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests
- Design migration Step 5 (ISS projected atlas map) verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test` with 13 passing tests
- Automation framework hardening verification passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:api` with 11 passing tests
  - `npm run test:ui` with 13 passing tests
  - `npm run test` with 24 passing tests

## Current behavior notes
- One user can have multiple active sessions
- Each successful login creates a new session row
- Logout removes only the current session from the current cookie
- `Prisma Studio` shows Prisma models such as `Session`, while PostgreSQL stores the SQL table `sessions`
- Live external space data is used in normal local/dev mode
- Tests and CI use `SPACE_API_MODE=mock`
- Mock and fallback states are visually distinct in the UI

## Current step
- Design Migration Step 5 - Polish (in progress)

## Next planned step
- Optional: richer seed metadata for catalog cards
