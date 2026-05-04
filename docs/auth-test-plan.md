# Orbit Control — Auth Test Plan

## Goal

Cover the auth slice with a small but meaningful set of tests that prove:
- a user can register
- a user can log in
- a session cookie is issued
- the current session can be resolved
- logout removes only the current session

## Status

The baseline auth API and UI smoke coverage is implemented. This document now
serves as the auth contract and backlog for any future auth-specific expansion.

## Scope

Implemented scope:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- session creation and deletion in `sessions`
- protected-page redirect smoke coverage
- login/register UI smoke coverage

Out of scope for the current product:
- session expiration edge cases
- password reset
- OAuth / external auth providers
- roles and permissions

## Test layers

### Manual smoke
- Register a new user through the API
- Log in with the new user
- Confirm `Set-Cookie` contains `orbit_control_session`
- Call `GET /api/auth/me` with the cookie
- Call `POST /api/auth/logout` with the same cookie
- Confirm `GET /api/auth/me` returns `401`

### Automated baseline coverage
- API smoke tests start the local app through Playwright config
- Tests use HTTP requests against real Next.js API routes
- Tests verify DB state directly through Prisma helpers
- UI smoke tests cover login redirects, successful login, logout access removal, invalid login, and login-to-register navigation

## Implemented automated scenarios

### `auth_smoke_happy_path`
- register with a unique email returns `201`
- user row exists in `users`
- login returns `200`
- login response sets session cookie
- session row exists in `sessions`
- `GET /api/auth/me` with cookie returns the same user
- logout returns `200`
- current session row is removed from `sessions`
- `GET /api/auth/me` after logout returns `401`

### Additional implemented auth scenarios
- invalid password returns `401`
- `/api/auth/me` without a session returns `401`
- duplicate registration returns `400`
- invalid login body returns `400`
- unauthenticated `/dashboard` navigation redirects to `/login`
- logout removes access to protected pages
- invalid UI login shows an error and stays on `/login`

## Full auth matrix for later

### Register
- success with valid email and password
- duplicate email returns `400`
- invalid email returns `400`
- password shorter than minimum returns `400`
- password stored as hash, not plaintext

### Login
- success with valid credentials
- wrong password returns `401`
- unknown email returns `401`
- multiple logins create multiple active sessions

### Current session
- `GET /api/auth/me` without cookie returns `401`
- `GET /api/auth/me` with valid cookie returns current user
- expired session returns `401` and is removed

### Logout
- logout with valid cookie removes current session
- logout without cookie does not crash
- logout removes only the current session, not all sessions for the user

## Notes

- Current auth semantics allow multiple active sessions per user
- Current logout semantics remove only the session bound to the active cookie
- Future auth work should extend this matrix only when product behavior changes
