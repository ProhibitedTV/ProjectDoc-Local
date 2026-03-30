# ProjectDoc Local

ProjectDoc Local is an on-prem document review product for contractors, specialty trades, and construction back offices. The first commercial wedge is certificate of insurance review: receive COIs, extract the fields that matter, route uncertain cases to a human reviewer, and keep a durable audit trail inside customer-controlled infrastructure.

The near-term goal is narrow and commercial: help compliance coordinators and back-office reviewers process subcontractor and vendor COIs faster without giving up local deployment, human control, or traceability. Broader document families remain part of the product direction, but they are expansion paths after the first paid pilot workflow is solid.

## Why This Exists

Contractors and specialty trades already have accounting systems, project systems, and shared folders. The operational pain sits before those systems: COIs arrive by email, portal download, or shared drive; reviewers manually check dates and certificate holders; missing or expired coverage turns into follow-up work; and the review history often disappears into inboxes or spreadsheets.

ProjectDoc Local is being designed to reduce that friction, starting with COIs and later expanding to documents such as:

- certificates of insurance (COIs)
- permits
- lien waivers
- invoices
- change orders
- contracts
- inspection reports

## Product Principles

- Local deployment first. Customer documents and extracted data stay within customer-controlled environments.
- Human review for consequential actions. Low-confidence fields and policy-sensitive decisions must be reviewable before downstream use.
- Auditability over black-box automation. Users should be able to see what was extracted, what changed, who changed it, and when.
- Workflow fit over novelty. The product should support operations teams and back-office staff, not force them into generic AI interactions.
- Commercial realism. Security, maintainability, traceability, and deployment discipline matter from the beginning.

## First Paid Pilot

The first paid pilot should do one workflow well:

1. Intake COIs through controlled local upload paths and staged folder ingestion.
2. Extract core COI fields such as named insured, certificate holder, producer, policy dates, and coverage-related review signals.
3. Surface uncertain or incomplete results in a review queue instead of pretending the system can approve them automatically.
4. Preserve an audit trail of system output, reviewer corrections, approvals, and follow-up decisions.
5. Let back-office teams search and filter reviewed COI records for operational use and CSV handoff.

This is a focused compliance review product first. The broader architecture still supports later expansion to other project document families, but the first sellable motion should not read like "all project docs at once."

This repository starts with product and engineering foundations alongside early application code. The intent is to align on scope, constraints, and quality expectations early enough to avoid building something flashy but operationally weak.

## Baseline Engineering Direction

The initial repository layout assumes a TypeScript/Node.js monorepo with separate applications for the API, background processing, and review interface. That gives the project a practical default without overcommitting to unnecessary boilerplate on day one.

- `apps/api/`: operator-facing API and orchestration endpoints
- `apps/worker/`: ingestion, classification, extraction, and background jobs
- `apps/web/`: review and operations interface
- `packages/shared/`: shared schemas, types, validation, and domain utilities
- `packages/config/`: environment parsing and configuration helpers
- `packages/testing/`: reusable test fixtures and test helper utilities
- `deploy/docker/`: local and on-prem packaging assets
- `scripts/`: workspace verification and maintenance helpers
- `tests/`: reserved for cross-application and system-level test suites
- `docs/`: product, scope, and project reference documentation

This structure is a starting point, not a frozen architecture.

## Getting Started

### Prerequisites

- Node.js 22 or later
- pnpm 10 or later
- Docker Desktop or Docker Engine for local infrastructure

### Local Development

1. Copy [`.env.example`](.env.example) to `.env`.
2. Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.local`.
3. Start local dependencies with `docker compose -f deploy/docker/docker-compose.dev.yml up -d`.
4. Install workspace dependencies with `pnpm install`.
5. Start the workspace applications with `pnpm dev`.

Default local endpoints:

- Web UI: `http://localhost:5173`
- API health: `http://localhost:3000/api/health`
- PostgreSQL: `localhost:5432`
- Local model runtime: `http://localhost:11434`

### Common Scripts

- `pnpm dev`: start shared package watchers plus API, worker, and web
- `pnpm build`: build packages and applications
- `pnpm lint`: run eslint across the workspace
- `pnpm typecheck`: run TypeScript checks across apps and shared packages
- `pnpm test`: run the current automated test suites across the workspace
- `pnpm verify`: run the baseline repo quality gate (`lint`, `typecheck`, `test`)

## Documentation Map

- [`docs/product-overview.md`](docs/product-overview.md): product summary, principles, and intended system shape
- [`docs/problem-statement.md`](docs/problem-statement.md): the business problem and why current workflows break down
- [`docs/personas.md`](docs/personas.md): target users, responsibilities, and needs
- [`docs/mvp-scope.md`](docs/mvp-scope.md): what the first sellable internal milestone should and should not include
- [`docs/pilot-offer.md`](docs/pilot-offer.md): who the first paid pilot is for, what workflow it covers, and how success should be measured
- [`docs/non-goals.md`](docs/non-goals.md): explicit boundaries to keep the product grounded
- [`docs/architecture.md`](docs/architecture.md): the recommended MVP application architecture and component boundaries
- [`docs/tech-stack.md`](docs/tech-stack.md): the concrete stack choice for the first implementation
- [`docs/domain-model.md`](docs/domain-model.md): the core product concepts and how source, extraction, review, and provenance fit together
- [`docs/data-model.md`](docs/data-model.md): the proposed relational data model and lifecycle entities
- [`docs/ingestion-lifecycle.md`](docs/ingestion-lifecycle.md): the thin-slice upload lifecycle, state transitions, and future worker handoff
- [`docs/ocr-strategy.md`](docs/ocr-strategy.md): the normalized OCR contract and provider strategy for scanned documents
- [`docs/classification-and-extraction.md`](docs/classification-and-extraction.md): normalized contracts, stub behavior, and expected field sets by document type
- [`docs/review-workflow.md`](docs/review-workflow.md): review queue structure, action semantics, and UX rationale
- [`docs/search-strategy.md`](docs/search-strategy.md): current deterministic search design and the path to later retrieval upgrades
- [`docs/auditability.md`](docs/auditability.md): the first-pass audit event model, persistence strategy, and inspection surfaces
- [`docs/repo-roadmap.md`](docs/repo-roadmap.md): repository hardening priorities and the near-term path from foundation to product-ready implementation
- [`docs/deployment-strategy.md`](docs/deployment-strategy.md): the single-machine deployment path for early pilots
- [`TODO.md`](TODO.md): phased milestones for product and engineering execution

## Commercial Status

ProjectDoc Local is being developed as a commercial product. This repository is private and no open-source license is currently granted. See [`LICENSE_STATUS.md`](LICENSE_STATUS.md) for the current rights position.

## Working Expectations

- Privacy and customer control are core product requirements, not later enhancements.
- AI output must remain reviewable and auditable.
- Quality standards should assume future commercial deployment, not an internal prototype.
- Documentation changes are part of product development, not cleanup work.

## Current Status

The repository now includes the initial application foundation, shared domain schemas, the first ingestion and search slices, a normalized OCR provider boundary, a first-pass audit trail, and a real documents list surface. Heavy business logic is still intentionally stubbed, and several persistence paths are still JSON-backed development adapters. The codebase has moved past pure planning, but it is not yet at the fully realized PostgreSQL-backed product architecture described in the target docs.
