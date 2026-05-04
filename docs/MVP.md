# Orbit Control — MVP

## Overview
Orbit Control is a small web application for tracking space objects and creating personal monitoring missions.

The goal is not to build a full product.
The goal is to build a focused MVP that supports a strong automation framework.

## Core user story
A user can:
- create an account
- log in
- view a dashboard with space objects
- add objects to a watchlist
- create missions linked to those objects
- update mission status, priority, and notes
- search and filter missions

## MVP goals
This MVP must support:
- stable UI flows
- predictable API routes
- clean database state
- meaningful UI/API/DB test cases

## Current implementation status
The functional MVP is complete. Auth, dashboard, watchlist, missions CRUD,
search/filter, API routes, database schema, seed data, Playwright smoke tests,
Docker Compose, GitHub Actions, and live dashboard space APIs are implemented.

Current work is a design migration over the existing product surface. The
migration is intentionally scoped by `docs/current-phase.md` so UI polish does
not turn into product expansion.

## Main entities
- User
- Session
- Space Object
- Watchlist Item
- Mission

## Screens in v1

### 1. Login / Register
User can register and log in.

### 2. Dashboard
Shows:
- a live APOD hero
- live space signals for APOD, ISS position, and nearest asteroids
- active seeded space objects that map to real dashboard data
- active missions and system status summaries
- action buttons like:
  - Add to Watchlist
  - Create Mission

### 3. Watchlist
Shows the user’s saved space objects.

Actions:
- open object
- remove from watchlist
- create mission from object

### 4. Missions List
Shows all missions for the current user.

Supports:
- search by title
- filter by status
- filter by priority
- sort by updated date, priority, or title
- density selection for the table layout

### 5. Mission Details
Shows:
- title
- linked object
- status
- priority
- notes

Actions:
- update
- delete


## Enum values

### Mission status
new, monitoring, critical, resolved

### Mission priority
low, medium, high

### Watchlist item status
watching, paused, archived

## Active tracked objects
The active object catalog should map to real data shown in the app.

- APOD
- ISS
- Near-Earth Asteroids

`Mars`, `Jupiter`, and the old synthetic `Asteroid 2026 AB1` seed were useful for early CRUD practice, but they are no longer active targets because the app does not currently show real tracking data for them.

## API routes in v1

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Dashboard / Objects
- GET /api/dashboard
- GET /api/objects

### Watchlist
- GET /api/watchlist
- POST /api/watchlist
- DELETE /api/watchlist/:id

### Missions
- GET /api/missions
- POST /api/missions
- GET /api/missions/:id
- PATCH /api/missions/:id
- DELETE /api/missions/:id

## Database tables in v1

### users
- id
- email
- password_hash
- created_at
- updated_at

### sessions
- id
- user_id
- token_hash
- expires_at
- created_at
- updated_at

### space_objects
- id
- external_id
- name
- type
- source
- metadata_json
- created_at

### watchlist_items
- id
- user_id
- object_id
- status
- created_at

### missions
- id
- user_id
- object_id
- title
- status
- priority
- notes
- created_at
- updated_at

## Test scenarios the MVP must support

### UI
- successful login
- invalid login
- add object to watchlist
- remove object from watchlist
- create mission
- edit mission
- delete mission
- search mission
- filter mission
- validation for empty title

### API
- register user
- login user
- get dashboard
- add to watchlist
- create mission
- update mission
- delete mission

### Hybrid
- create mission via API and verify in UI
- create mission via UI and verify in database

## What is NOT in the core MVP
- roles and permissions
- notifications
- file uploads
- comments
- admin panel
- advanced analytics
- real-time updates
- OAuth / external auth providers

## Phase plan

### Phase 1 — App MVP — done
- set up Next.js + TypeScript
- set up PostgreSQL + Prisma
- create schema and seed data
- implement auth
- implement dashboard
- implement watchlist
- implement missions CRUD

### Phase 2 — Automation framework — done
- set up Playwright
- add UI tests
- add API tests
- add fixtures
- add page objects
- add basic data helpers

### Phase 3 — Infrastructure — done
- add Docker Compose
- add GitHub Actions
- add reports and artifacts

### Phase 4 — Enhancements — done
- real external APIs for dashboard live signals
- deterministic mock external data for tests and CI
- per-source fallback handling for external API failures

### Phase 5 — Design migration — in progress
- Foundation shell and design tokens — done
- Dashboard redesign — done
- Missions list redesign — done
- Mission detail redesign — done
- Mission composer modal — next
- Watchlist redesign — planned
- Polish pass — planned

## Final enhancement scope
- NASA APOD data is displayed on the dashboard
- NASA NeoWs near-earth object data is displayed on the dashboard
- ISS live position data is displayed on the dashboard
- automated tests and CI use deterministic mock external data
- external API failures render fallback data instead of breaking the page

## Definition of done for MVP
The MVP is done when:
- a user can register and log in
- the dashboard loads seeded objects
- the user can add/remove watchlist items
- the user can create/update/delete missions
- search and filter work for missions
- the project runs locally with clear setup steps
- basic UI and API tests pass

## Auth approach in v1
- auth uses opaque server-side sessions, not JWT
- login stores an HTTP-only cookie with a random session token
- the database stores only a hash of that session token
- logout and session expiration are enforced server-side via the sessions table
