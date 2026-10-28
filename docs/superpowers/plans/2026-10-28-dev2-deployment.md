# Dev2 Deployment Implementation Plan

> **For agentic workers:** Execute inline, following superpowers:executing-plans. The user requested immediate implementation of the deployment preparation checklist.

**Goal:** Prepare this repository for deployment at `http://ditckiosk.camt.cmu.ac.th` through dev2 without exposing the API/database or losing stored media.

**Architecture:** One Docker Compose Stack with an Nginx frontend, a single Node API process, and PostgreSQL 16. Only Nginx publishes host port 11780. Database and uploads use named volumes; production images contain neither secrets nor existing customer data/media.

**Tech Stack:** Existing React/Vite, Express, PostgreSQL, npm lockfiles; Docker and Nginx. No new application dependencies.

**Spec:** Deployment checklist and domain confirmed by the user in this chat.

## Global Constraints

- Preserve the user's modified `backend/.env` and existing local database.
- Prepare artifacts locally; registry publication and dev2 deployment require access not supplied in this chat.
- Use the confirmed bare domain; default to the HTTP scheme supplied by the user, with one environment value to switch to HTTPS.
- Production Compose references published images, so Portainer does not need repository files or local build contexts.
- Do not run sample schema/seed SQL or reset existing data.
- npm is the build manager because the existing operations runbook already verifies `npm ci` for both applications.

## Review Focus

- Missing secrets or a failed schema migration must prevent API startup.
- API routing must retain `/api` and `/uploads`, work after container IP changes, and allow SSE responses.
- An empty uploads volume must be writable by the non-root API user; existing media must be restored separately.
- Production checkout and payment webhooks remain disabled until Krungthai integration is implemented. The immediate goal is a reachable domain for the bank application.
- Updates must retain volumes and immutable application image tags; a code rollback must not be described as a schema rollback.

## Task 1: Production startup and payment boundaries

- [x] Add failing behavior tests for missing DB configuration, migration failure, and disabled production checkout/payment endpoints.
- [x] Require production DB settings, remove credential fallbacks, and fail startup when migrations fail.
- [x] Add database-backed `/api/health`, support the known Nginx proxy hop, and disable production checkout and payment endpoints.
- [x] Run the new tests and existing backend regression tests.

## Task 2: Containers and persistent Stack

- [x] Add allowlisted Docker build contexts and frontend/backend Dockerfiles.
- [x] Add Nginx SPA routing, API/uploads proxying, Docker DNS resolution, forwarding headers, and SSE support.
- [x] Add image-only `compose.dev2.yml`, a local build override, and a secrets-free `.env.example`.
- [x] Validate Compose and build/frontend syntax using available tools. Attempt container checks only if a Docker engine is available.

## Task 3: Migration and operation instructions

- [x] Add a safe create-admin command for empty installations, without resetting imported users.
- [x] Document image build/push, Portainer environment values, pre-migration backups, restoring DB/uploads, health checks, and rollback limits.
- [x] Review the diff and report exact checks and anything that requires Docker/dev2/registry access.

## Execution record

- Ruling: Proceed using the architecture already described to the user; they explicitly asked to implement now rather than continue questions.
- Ruling: Preserve the existing development-only Compose file; production gets a separate file to avoid changing the running local DB configuration.
- Preflight: `backend/.env` is the only pre-existing modified file. No Docker executable is installed on this workstation.
- Ruling: User clarified that Krungthai is the intended gateway and asked to prioritize deploying the domain. Discard the newly written Omise integration changes; no gateway credentials are required for this release.
- Ruling: User requested removal of shipping API integration. No shipping provider/service modules exist in the current branch; remove all courier API configuration from the new deployment files and retain manual tracking/shipment records.
- Verification: 12 backend tests passed, no failures; the existing opt-in schema-upgrade test was skipped because its specific pre-merge fixture database was not provisioned.
- Verification: A separate fresh PostgreSQL 16 smoke test passed schema startup, catalog, admin creation/duplicate refusal, login/session/cookie, upload/readback, blocked checkout with zero orders, closed payment routes, and graceful shutdown. It used a temporary cluster, never the user's existing DB.
- Verification: Clean `npm ci --ignore-scripts --offline` and frontend production build passed in a temporary copy.
- Verification: Official standalone Docker Compose v5.6.1 validated production and build-override configuration, internal-only API/DB ports, persistent volumes, disabled checkout, and rejection of missing secrets.
- Review: Independent review found that the non-root API needs a pre-owned logs directory. Fixed Dockerfile to create/chown logs and included the existing email logo asset. No other P1/P2 findings were reported.
- Limitation: No local Docker engine; Nginx/container/image publication and dev2 access have not been exercised. Manual GitHub workflow includes a real full-Stack startup check before publishing release images.
