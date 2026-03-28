# MVP Tech Stack

## Recommendation

The recommended MVP stack for ProjectDoc Local is:

- `pnpm` workspaces for the monorepo
- `Node.js 22 LTS` and `TypeScript 5`
- `NestJS` with the `Fastify` adapter for the API
- `React` with `Vite`, `TanStack Router`, `TanStack Query`, and `Material UI` for the web app
- `PostgreSQL 16` with `pgvector`
- `Prisma` for primary relational access and migrations
- `pg-boss` for background jobs on PostgreSQL
- `Pino` for structured logs
- `OCRmyPDF`, `Tesseract`, and `Poppler` for OCR and PDF handling
- an `Ollama`-compatible local model runtime behind provider interfaces
- local filesystem storage for document binaries and derived artifacts

This is the one MVP path I recommend.

## Stack by Area

| Area | Choice | Why It Fits |
| --- | --- | --- |
| Monorepo | `pnpm` workspaces | Fast, simple, and well-suited to a multi-app TypeScript repo without extra monorepo machinery. |
| Runtime | `Node.js 22 LTS` | Current LTS baseline, strong ecosystem, good Windows and Linux developer support. |
| Language | `TypeScript 5` | Shared types across API, worker, and web reduce product friction and integration mistakes. |
| API framework | `NestJS` on `Fastify` | Opinionated enough for a commercial product, structured modules, DI, and better long-term maintainability than ad hoc Express code. |
| API style | REST + OpenAPI | Predictable, easy to debug, and well-matched to document workflows, review operations, and exports. |
| Web app | `React` + `Vite` | Strong ecosystem, fast iteration, and no unnecessary SSR burden for an internal-style operations product. |
| Client routing and server state | `TanStack Router` + `TanStack Query` | Durable, explicit patterns for data-heavy screens, queues, and admin views. |
| UI components | `Material UI` | Mature component library that speeds up admin-style screens, forms, tables, and dialogs. |
| Forms and shared validation | `React Hook Form` + `Zod` | Productive for structured review and admin forms; `Zod` also works well in shared packages. |
| Database | `PostgreSQL 16` + `pgvector` | One durable database for transactional state, audit logs, full-text search, and vector search. |
| ORM and migrations | `Prisma` | High developer productivity for CRUD-heavy business logic; use targeted raw SQL where vector queries need it. |
| Job queue | `pg-boss` | Keeps queue state in PostgreSQL and avoids adding Redis to a single-machine MVP. |
| Logging | `Pino` | Fast structured logs that are easy to ship, parse, and correlate with audit events. |
| OCR and PDF utilities | `OCRmyPDF`, `Tesseract`, `Poppler`, `qpdf` | Practical toolchain for searchable PDFs, scanned docs, page extraction, and image OCR. |
| Model runtime | Ollama-compatible local HTTP runtime | Simple on a single machine and easy to swap later behind adapter interfaces. |
| File storage | Managed local filesystem | Lowest operational overhead for one-machine deployments; good enough until shared object storage is actually needed. |
| Unit and integration tests | `Vitest` | Fast TypeScript test runner with low setup overhead. |
| End-to-end tests | `Playwright` | Best fit for upload, review, search, and citation verification flows. |

## Why This Stack Fits ProjectDoc Local

### Maintainability

- The API and worker stay in one language and one repo.
- PostgreSQL is the single source of truth for workflow state.
- The product avoids an early sprawl of infrastructure components.
- NestJS modules give the codebase a clear place for document, review, search, and audit logic.

### Shipping Velocity

- The frontend stack is fast to iterate on and familiar to many engineers.
- Prisma and PostgreSQL accelerate CRUD-heavy product work.
- `pg-boss` avoids building custom queue plumbing or operating Redis.
- The OCR toolchain is proven and can be invoked from the worker without building OCR from scratch.

### Productization

- The system can start simple but still has obvious future seams: storage adapter, model provider adapter, search layer, and deployment packaging.
- REST plus OpenAPI makes integrations and support easier than a custom RPC or GraphQL layer.
- Material UI is a practical fit for a serious operations interface rather than a marketing site.

## Recommended Repository Shape

- `apps/api`: NestJS application
- `apps/worker`: job worker and watched-folder service
- `apps/web`: React review and admin UI
- `packages/shared`: types, schemas, document-type handlers, and provider interfaces
- `packages/config`: shared configuration loaders and environment validation
- `packages/testing`: synthetic fixtures and reusable test helpers

## Tradeoffs

- NestJS adds framework structure and indirection compared with plain Fastify, but that structure is worth it for a growing commercial codebase.
- Prisma is not perfect for vector-heavy SQL, so hybrid search should use explicit raw SQL instead of forcing everything through the ORM.
- Material UI is less visually custom than a hand-built design system, but it is much faster for MVP operations screens.
- Filesystem storage is easier than MinIO or S3-compatible storage now, but it is not the final answer for multi-node deployment.
- Ollama-compatible runtimes are easy to package, but model throughput and latency depend heavily on local hardware.

## Rejected Alternatives

### 1. Express or Fastify without a framework

Rejected because it would ship quickly at first but is more likely to turn into a loosely structured backend once the product grows across documents, review workflows, exports, and admin features.

### 2. Redis plus BullMQ

Rejected because it introduces another critical stateful component for a queue workload PostgreSQL can already support adequately in the MVP.

### 3. Elasticsearch or OpenSearch

Rejected because it increases deployment and support burden too early. PostgreSQL full-text search plus `pgvector` is the simpler first choice.

### 4. S3-compatible object storage in v1

Rejected because the product is deploying to one machine first. Local managed storage is simpler and easier to back up.

### 5. Next.js

Rejected because the application does not need SSR to provide value, and a separate worker still exists regardless.
