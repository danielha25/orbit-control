# Orbit Control — Agent Guide

## Session startup contract

At the start of every new session, before planning or editing code, read:

- `AGENTS.md`
- `docs/current-phase.md`
- `docs/progress.md`
- `docs/MVP.md`
- `docs/architecture.md`

Use `docs/current-phase.md` as the active working context.

Continue from the documented current phase only.

Do not rely on previous chat context, memory, or assumptions if they conflict with the docs.

If the docs conflict, stop and report the conflict before changing code.

Before implementation, briefly summarize:
- current phase
- current step
- files likely to be touched
- tests/checks to run

Do not implement beyond the current step unless explicitly requested.

After completing a milestone, update:
- `docs/progress.md`
- `docs/current-phase.md`

## Project purpose

Small portfolio project for QA Automation / SDET practice.

Detailed product scope: see `docs/MVP.md`.
Architecture notes: see `docs/architecture.md`.
Completed work log: see `docs/progress.md`.

The project should showcase:
- UI automation
- API automation
- DB-aware testing
- deterministic test data
- live API fallback handling
- CI/CD
- Docker

## Stack

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Playwright
- Docker Compose
- GitHub Actions

## Project structure

- `src/` — app code
- `prisma/` — schema, migrations, seed
- `tests/` — UI, API, fixtures, pages, utils
- `docs/` — MVP, architecture, progress, and phase docs

## Core MVP

- register/login
- dashboard with live space signals and active seeded space objects
- watchlist
- missions CRUD
- search/filter for missions

## Current scope

The MVP, automation baseline, real API enhancement, Docker, and CI are already implemented.

Current work is a scoped design migration.

Use:
- `docs/current-phase.md` for the active step
- `docs/progress.md` for completed work and handover

## Out of scope for now

- OAuth / advanced auth
- roles/permissions
- notifications
- real-time updates
- admin features
- broad product expansion outside `docs/current-phase.md`

## Engineering rules

- Keep the MVP small and defendable.
- Prefer simple, readable code over abstraction.
- Do not add features beyond the requested/current step.
- Do not touch unrelated files.
- Keep app code and test framework code separate.
- Optimize for testability and interview discussion.
- Use deterministic seeded/mock data for tests.
- Prefer deterministic mock mode in tests and CI.
- Live external APIs are for local/dev/product behavior only.
- Keep live third-party data behind service boundaries and fallback states.
- Build stable selectors for UI automation.
- Preserve existing `data-testid` selectors during design migration unless the task explicitly changes test coverage.
- Avoid broad refactors unless required by the current step.

## Working style

For each task:

1. Brief plan
2. Files to create/change
3. Implementation
4. Run/verify commands
5. Short explanation of key decisions

## Verification commands

Use the smallest relevant verification set for the task.

Available commands:

- `npm install`
- `npm run dev`
- `npx prisma migrate dev`
- `npx prisma db seed`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx playwright test`