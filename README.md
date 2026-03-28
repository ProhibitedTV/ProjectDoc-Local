# ProjectDoc Local

ProjectDoc Local is an on-prem AI-assisted document intake and review platform for project-based businesses. It is aimed at contractors, specialty trades, construction back offices, and similar teams that manage a steady stream of compliance, billing, and project paperwork and need that work to stay inside customer-controlled infrastructure.

The product direction is simple: receive documents, determine what they are, extract the fields that matter, route uncertain cases to a human reviewer, and keep an auditable record of every decision. The goal is not to build an "AI demo." The goal is to build a product that can survive real operational use.

## Why This Exists

Project-driven businesses already have systems of record. The painful part is the messy layer in front of those systems: email attachments, scanned PDFs, vendor portals, shared folders, inconsistent naming, missing metadata, and deadlines that still matter even when the paperwork is incomplete.

ProjectDoc Local is being designed to reduce that friction for documents such as:

- certificates of insurance (COIs)
- permits
- invoices
- change orders
- lien waivers
- contracts
- inspection reports

## Product Principles

- Local deployment first. Customer documents and extracted data stay within customer-controlled environments.
- Human review for consequential actions. Low-confidence fields and policy-sensitive decisions must be reviewable before downstream use.
- Auditability over black-box automation. Users should be able to see what was extracted, what changed, who changed it, and when.
- Workflow fit over novelty. The product should support operations teams and back-office staff, not force them into generic AI interactions.
- Commercial realism. Security, maintainability, traceability, and deployment discipline matter from the beginning.

## Initial Product Shape

The first meaningful version of ProjectDoc Local is expected to provide:

1. Controlled document intake from uploads, watched folders, and service endpoints.
2. Document classification plus targeted field extraction by document type.
3. A review queue for low-confidence, incomplete, or policy-sensitive items.
4. Status tracking, decision history, and audit logs.
5. Search, filtering, and export-ready records for downstream systems.

This repository starts with product and engineering foundations before application code. The intent is to align on scope, constraints, and quality expectations early enough to avoid building something flashy but operationally weak.

## Baseline Engineering Direction

The initial repository layout assumes a TypeScript/Node.js monorepo with separate applications for the API, background processing, and review interface. That gives the project a practical default without overcommitting to unnecessary boilerplate on day one.

- `apps/api/`: operator-facing API and orchestration endpoints
- `apps/worker/`: ingestion, classification, extraction, and background jobs
- `apps/web/`: review and operations interface
- `packages/shared/`: shared schemas, types, validation, and domain utilities
- `deploy/docker/`: local and on-prem packaging assets
- `docs/`: product, scope, and project reference documentation

This structure is a starting point, not a frozen architecture.

## Documentation Map

- [`docs/product-overview.md`](docs/product-overview.md): product summary, principles, and intended system shape
- [`docs/problem-statement.md`](docs/problem-statement.md): the business problem and why current workflows break down
- [`docs/personas.md`](docs/personas.md): target users, responsibilities, and needs
- [`docs/mvp-scope.md`](docs/mvp-scope.md): what the first sellable internal milestone should and should not include
- [`docs/non-goals.md`](docs/non-goals.md): explicit boundaries to keep the product grounded
- [`docs/architecture.md`](docs/architecture.md): the recommended MVP application architecture and component boundaries
- [`docs/tech-stack.md`](docs/tech-stack.md): the concrete stack choice for the first implementation
- [`docs/data-model.md`](docs/data-model.md): the proposed relational data model and lifecycle entities
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

The repository is at the foundation stage. Product framing, scope definition, contribution standards, and security posture are being established before implementation begins.
