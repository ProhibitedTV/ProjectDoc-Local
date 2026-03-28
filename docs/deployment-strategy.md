# Deployment Strategy

## Recommendation

ProjectDoc Local should target a Linux single-machine deployment for the MVP, packaged with Docker Compose.

That is the most practical commercial starting point because:

- the OCR and PDF toolchain is easier to package and support on Linux
- PostgreSQL, worker processes, and local model runtimes are straightforward to run together on one host
- support and upgrade procedures are much simpler with one known operating environment

Do not try to support Linux, Windows native installs, and Kubernetes all at once in v1.

## MVP Runtime Shape

The production MVP should run as four services:

1. `projectdoc-api`
   Serves the REST API and the compiled web UI.

2. `projectdoc-worker`
   Handles watched folders, OCR, extraction, indexing, and exports.

3. `projectdoc-postgres`
   Stores relational data, audit events, queue state, and vector search data.

4. `projectdoc-model`
   Runs the local Ollama-compatible model runtime.

This keeps the install small while still separating interactive request handling from long-running document jobs.

## Filesystem Layout

Use host-mounted volumes for the data that must survive upgrades and container restarts.

Recommended paths:

- `/opt/projectdoc/config`
- `/var/lib/projectdoc/postgres`
- `/var/lib/projectdoc/storage`
- `/var/lib/projectdoc/models`
- `/var/lib/projectdoc/watch`
- `/var/lib/projectdoc/exports`

The worker should own the managed storage layout under `/var/lib/projectdoc/storage`.

## Document Storage Strategy

Store binaries on disk, not in the database.

Recommended stored artifacts:

- original uploaded files
- OCR-processed PDFs
- page preview images
- generated CSV exports

Database rows should reference these paths through `document_files`.

## Watched Folder Strategy

Watched folders should be configured as host paths or mounted network shares visible to the worker container.

Recommended behavior:

- copy new files into managed storage before processing
- hash files to prevent duplicate ingestion
- leave source files untouched by default
- optionally move successfully processed files to an archive folder
- move failures to a quarantine or failure folder with a logged reason

This keeps the product's internal state independent from the external folder structure.

## Backup and Restore

The MVP backup story should be explicit and boring:

- back up PostgreSQL data
- back up `/var/lib/projectdoc/storage`
- back up `/opt/projectdoc/config`

The model cache can be rebuilt and does not need to be treated as irreplaceable data.

For restore, the system should bring back:

- database state
- original files and OCR derivatives
- exports when retention policy requires them
- watched folder configuration and system settings

## Upgrade Strategy

Use versioned container images and versioned database migrations.

Recommended upgrade pattern:

1. take a database backup and snapshot of the managed storage path
2. stop the worker
3. apply the new release images
4. run database migrations
5. start API and worker
6. verify health checks and a small sample workflow

Do not attempt rolling upgrades or zero-downtime release mechanics in the MVP. One-machine deployments do not need that complexity yet.

## Security Boundary

The deployment should assume:

- documents never need to leave the host to be processed
- OCR and model runtimes operate inside the same trusted environment
- the API is reachable only on the customer's local network or through a customer-managed reverse proxy
- secrets are provided through environment files or a local secret management mechanism outside the repository

For early pilots, it is acceptable to require a customer-managed reverse proxy or local network isolation rather than bundling a full ingress stack.

## Hardware Guidance

The MVP should be designed to run on a reasonably provisioned single server or workstation-class machine.

Practical baseline:

- modern multi-core CPU
- SSD storage
- at least 32 GB RAM for comfortable OCR, indexing, and local model use
- optional NVIDIA GPU for materially better extraction and Q&A latency

CPU-only operation should remain possible, but response times will be slower.

## Developer and Pilot Environments

- local development can use the same Docker Compose stack with bind mounts
- CI should run API, worker, and database tests in containers
- pilot environments should stay as close to the supported single-machine production layout as possible

Avoid a split where development uses one architecture and pilots use another.

## Tradeoffs

- Linux-first deployment reduces support burden, but it may be less convenient for some Windows-centric customers.
- Serving the compiled web app from the API keeps the runtime simpler, but it slightly couples UI and API release cadence.
- One-machine deployment keeps operations manageable, but it sets an upper ceiling on throughput until a later architecture phase.
- Local model runtimes improve privacy, but they make performance more sensitive to the customer's hardware.

## Rejected Alternatives

### 1. Kubernetes-first deployment

Rejected because it is unnecessary for a one-machine MVP and would increase installation, support, and troubleshooting effort.

### 2. Windows-native installer as the first supported deployment target

Rejected because the OCR and PDF toolchain is harder to package consistently, and support costs would rise quickly. Windows clients can still access the web UI from their desktops while the server runs on Linux.

### 3. Bundling object storage and a separate search cluster

Rejected because those services are not required to prove the product and would make backups, upgrades, and support more complicated.

### 4. Cloud-hosted inference as the default path

Rejected because it cuts directly against the product's privacy and local-control positioning.
