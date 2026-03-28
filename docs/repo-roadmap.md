# Repo Roadmap

## Purpose

This roadmap is about the repository itself, not just product features.

Its goal is to keep ProjectDoc Local credible as the foundation of a commercial software product by tightening the codebase, improving contributor ergonomics, and making the gap between current implementation and target architecture explicit.

## Current Foundation

The repository already has the right broad shape:

- `apps/api`, `apps/worker`, and `apps/web` are separated cleanly
- shared schemas and configuration loaders live in workspace packages
- product docs define the business problem, MVP scope, architecture, and domain model
- early ingestion, search, review, and audit slices are implemented

The repo now needs steady hardening more than dramatic redesign.

## Near-Term Priorities

### 1. Converge on One Persistence Story

Current thin slices use JSON-backed development stores to keep implementation moving.

Next step:

- replace JSON-backed stores with Prisma-backed repositories behind the same service boundaries
- keep filesystem storage for binaries and derived artifacts
- make PostgreSQL the source of truth for workflow state, review data, exports, and audit events

### 2. Strengthen Quality Gates

The repository should treat verification as part of normal development, not cleanup work.

Next step:

- keep `pnpm verify` as the baseline local gate
- enforce lint, typecheck, and test in CI
- add a committed lockfile for reproducible installs
- add at least one cross-application smoke test suite under `tests/`

### 3. Reduce Remaining Placeholder Surfaces

Placeholder routes are acceptable early, but they should shrink over time.

Next step:

- replace the Projects placeholder with a minimal but real read model once project records exist
- keep planned surfaces clearly labeled when they are still reserved
- avoid shipping routes that suggest functionality that the product cannot actually support yet

### 4. Tighten Operational Boundaries

The commercial direction of the product depends on clear boundaries between request handling, background work, storage, and auditability.

Next step:

- move pipeline execution and status mutation logic into worker-backed job flows
- keep API modules thin and product-facing
- ensure every consequential state change produces an auditable event

### 5. Improve Day-Two Developer Experience

The repo should be easy for a new engineer to trust and use without oral tradition.

Next step:

- keep setup instructions current with the real codebase
- prefer small helper scripts over tribal-knowledge command sequences
- grow `packages/testing` into reusable fixtures and factories instead of duplicating test setup in each app

## Deliberate Non-Goals For This Phase

These do not need to happen during the current hygiene pass:

- introducing microservices or extra infrastructure
- re-theming the UI or adding visual polish for its own sake
- rewriting the current module structure
- adding complex search or inference behavior before persistence and workflow boundaries are stable

## Exit Criteria For The Next Repo Phase

The next meaningful repo-hardening milestone is reached when:

- PostgreSQL backs core workflow state instead of local JSON records
- CI runs the same baseline verification developers run locally
- at least one system-level test suite exists under `tests/`
- the remaining docs clearly distinguish target architecture from implemented functionality
- the main user-facing routes are either real or explicitly labeled as planned
