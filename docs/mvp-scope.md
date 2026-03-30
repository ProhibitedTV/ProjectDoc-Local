# MVP Scope

## MVP Objective

The MVP should prove that ProjectDoc Local can support a paid pilot for on-prem COI and compliance document review in contractor and specialty trade back offices.

The first version does not need to solve every project document workflow. It needs to make one painful, repeatable workflow better: intake COIs, extract the fields reviewers care about, route uncertain cases to human review, and preserve a clean audit trail.

## Primary Initial Scope

### 1. Deployment Baseline

- single-customer deployment in a local or customer-managed environment
- container-based packaging suitable for development and early pilot installs
- customer-controlled document storage and application database

### 2. Intake

- manual upload through the web interface
- staged folder or watched-folder import for local operations teams
- clear document lifecycle status from intake through review and approval

Service-to-service ingestion can exist later, but it should not be required for the first paid pilot.

### 3. COI Handling

The primary commercial workflow is certificate of insurance review.

The MVP should support:

- classification of COIs versus unsupported or unknown uploads
- extraction of practical COI review fields such as:
  - named insured
  - certificate holder
  - producer or broker
  - policy number where available
  - policy effective and expiration dates
  - coverage-related review signals that should be checked by a human reviewer
- capture of confidence and source evidence where practical for reviewer verification

The system should help reviewers work faster, not imply fully automatic compliance approval.

### 4. Review Workflow

- queue-based review for low-confidence, incomplete, or rule-flagged COIs
- visibility into source evidence, extracted values, confidence, and provenance
- ability to correct, approve, or mark a document as needing follow-up
- explicit separation between machine output and human-authoritative values

### 5. Audit and Traceability

- event history for upload, pipeline progress, extraction output, reviewer actions, and export events
- timestamps and actor attribution for material workflow actions
- retention of original uploaded files and reviewable system output

### 6. Search and Output

- search and filtering across ingested COIs and reviewed fields
- filtering by status, document type, and project association where known
- CSV export of reviewed records for downstream operational use

### 7. Access and Operations

- basic role separation for administrators, reviewers, and operators
- local administrative controls for settings relevant to pilot operation
- clear operational surfaces for review queue, search, and audit inspection

## Explicitly Deferred

The following areas should be treated as later expansion unless a pilot customer makes one of them a narrow, concrete requirement:

- invoices as a first-class pilot workflow
- change orders, permits, lien waivers, contracts, and inspection reports as primary reviewed document families
- deep ERP or accounting integrations
- advanced analytics dashboards
- customer-defined workflow builders
- multi-tenant SaaS operation
- straight-through automated approval for compliance-sensitive documents
- clause-level contract analysis

Other document families may still be accepted, stored, or classified in early builds, but they should not dilute the primary COI review workflow.

## MVP Quality Bar

The MVP is successful if:

- a compliance coordinator can review incoming COIs faster than with a fully manual inbox-and-spreadsheet workflow
- the product makes missing, expiring, or unclear COI information easier to find and act on
- human review remains explicit and trustworthy
- the product produces a durable audit trail of system output and reviewer decisions
- deployment remains inside a customer-controlled environment suitable for a paid pilot
