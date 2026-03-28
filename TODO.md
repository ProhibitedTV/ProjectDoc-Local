# TODO

## Phase 0: Foundation and Architecture

- [ ] Finalize the canonical document lifecycle and status model
- [ ] Write the first architecture decision records for deployment model, storage boundaries, and audit logging
- [ ] Define shared domain schemas for projects, counterparties, documents, and review actions
- [ ] Establish repository tooling, CI checks, formatting, and test conventions
- [ ] Create synthetic fixture strategy for supported document types

## Phase 1: Intake and Storage

- [ ] Implement basic API and worker scaffolding
- [ ] Add document upload, watched-folder import, and processing job creation
- [ ] Persist original files and metadata with clear retention assumptions
- [ ] Add document status tracking from intake through completion
- [ ] Capture structured processing logs for debugging and operations

## Phase 2: Classification, Extraction, and Review

- [ ] Implement initial document classification pipeline
- [ ] Define extraction schemas for COIs, invoices, change orders, lien waivers, and permits
- [ ] Build a review UI for low-confidence and rule-flagged documents
- [ ] Record edit history, approvals, and reviewer attribution
- [ ] Add search and filtering across core workflow attributes

## Phase 3: Rules, Auditability, and Output

- [ ] Add configurable exception rules for missing fields, expirations, and policy thresholds
- [ ] Implement CSV and API export for approved records
- [ ] Expand audit trails to cover ingestion, extraction, edits, approvals, and exports
- [ ] Add role-based access controls for administrators, reviewers, and operators
- [ ] Define operational dashboards for backlog, aging items, and processing throughput

## Phase 4: Pilot Readiness

- [ ] Package a repeatable local deployment for design-partner environments
- [ ] Add backup, restore, and log-retention guidance
- [ ] Run performance tests on realistic batch sizes and file mixes
- [ ] Validate the product with pilot workflows using synthetic or approved sample data
- [ ] Tighten operational runbooks, installation docs, and support procedures

## Phase 5: Commercial Hardening

- [ ] Prioritize the first production-grade downstream integrations
- [ ] Add admin-facing configuration for document rules and routing
- [ ] Expand observability for supportability in customer-managed environments
- [ ] Prepare packaging, upgrade, and migration strategy for customer deployments
- [ ] Define release readiness criteria for the first commercial offering
