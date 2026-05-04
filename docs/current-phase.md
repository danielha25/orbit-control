# Current Phase: Design Migration

## Current step
Step 5 - Polish.

## Completed in this design migration
- Step 1 - Foundation: global design tokens, dark shell, sidebar, app shell, live signal chrome.
- Step 2 - Dashboard: topbar, APOD hero, live signals panel, catalog grid, active missions, system status.
- Step 2 fixes: projected ISS world map, UTC clock, visual source-mode tags, deterministic mock APOD fallback.
- Step 3a - Missions list: topbar counts, search/filter/sort/density toolbar, `oc-table`, status pills, priority bars, linked object thumbs, empty state.
- Step 3b - Mission detail: breadcrumbs, view/edit modes, notes card, activity timeline, linked object sidebar, metadata, restyled update/delete controls.
- Step 3c - Mission composer modal: `oc-modal` tokens, `New mission` opens modal-hosted `MissionCreateForm`, restyled with `oc-form`/`oc-field`/`oc-input`/`oc-textarea`/`oc-select`, preserves all `mission-create-*` test selectors.
- Step 4 - Watchlist: topbar with status counts, `oc-tabs` status filter via `searchParams`, `oc-watchcard` grid with object thumb / status pill / linked-mission count, design empty state, restyled Remove and `New mission` actions, preserves all `watchlist-*` and `remove-watchlist-*` test selectors.

## Scope for this step
- ✅ Toast provider for create/update/delete and other transient feedback surfaces.
- ✅ Replace native `window.confirm` for mission delete with an `oc-modal`-styled confirmation dialog.
- ✅ Auth page redesign (`/login`, `/register`).
- ✅ Remove unused `src/components/app-header.tsx`.
- ✅ Promote only real live NASA NeoWs near-earth objects into trackable catalog objects for watchlist and mission creation.
- ⏳ Optional: richer seed metadata for catalog cards.

## Step 5 progress notes
- `src/components/toast-provider.tsx` is the global `ToastProvider` + `useToast()` hook.
- `ToastProvider` wraps `AppShell` in `src/app/layout.tsx`.
- Toast styles (`oc-toast-region`, `oc-toast`, success/error/info variants) are in `src/app/globals.css`.
- Toasts wired into: `mission-create-form.tsx`, `mission-update-form.tsx`, `mission-delete-button.tsx`, `add-to-watchlist-button.tsx`, `remove-watchlist-button.tsx`.
- All existing `mission-*` and `watchlist-*` `data-testid` selectors preserved; new selectors added: `toast-region`, `toast`, `mission-delete-confirm`, `mission-delete-confirm-submit`.
- Auth pages (`/login`, `/register`) redesigned in `src/components/auth-form.tsx`: split-screen layout with starfield art panel, brand mark, sign-in/create-account tab links, `oc-form`/`oc-field`/`oc-input` primitives, primary block submit, alternate-prompt link below.
- Auth-specific styles (`oc-auth*`) added to `src/app/globals.css`: fixed `height: 100vh` + `overflow: hidden` on the desktop split, form column is a flex column with `flex: 1` form-wrap centered vertically and footer pinned at the bottom; `<= 900px` breakpoint collapses to single-column with `min-height: 100vh` and natural scroll.
- Existing `login-*` / `register-*` `data-testid` selectors preserved (`*-card`, `*-form`, `*-email`, `*-password`, `*-submit`, `*-error`); the `Create an account` / `Back to login` alternate-link wording is preserved so `LoginPage.goToRegister()` still resolves.
- Unused `src/components/app-header.tsx` removed (no remaining imports).
- Dashboard real NASA NeoWs asteroids are upserted into `space_objects` with `source: "live-neows"` and rendered as trackable catalog objects.
- Mock/fallback NeoWs fixtures remain test/dashboard signal data only; they are not persisted into the catalog.
- Dashboard sync removes stale unreferenced `live-neows` objects that are no longer in the current NeoWs feed.
- Watchlist and mission creation now accept both stable `seed` objects and persisted `live-neows` objects.
- Catalog cards expose `+ Watchlist` and `New mission` actions for trackable objects, including persisted live NeoWs objects.
- Dashboard catalog is collapsed by default to the first five trackable objects and can smoothly expand/collapse the rest on demand.
- ISS position now renders on a real projected world atlas (`d3-geo` + local `world-atlas`) instead of hand-drawn continent paths.

## Explicitly out of scope
- API route changes.
- Docker, CI/CD, and Playwright framework changes.

## Source of truth
- Product scope: `docs/MVP.md`
- Architecture notes: `docs/architecture.md`
- Design source: `/tmp/design-fetch/app-onboarding/project/auth.jsx`
- Design CSS reference: `/tmp/design-fetch/app-onboarding/project/styles.css`

## Commands to run
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx playwright test`
