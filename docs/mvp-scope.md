# MVP Scope

## MVP Objective

The MVP should prove that ProjectDoc Local can reduce manual document handling in a customer-controlled environment without removing human oversight. It should be credible enough for internal pilots and early design-partner use, not just a product demo.

## In Scope

### 1. Deployment Baseline

- single-customer deployment in a local or customer-managed environment
- container-based packaging suitable for development and early pilot installs
- customer-controlled document storage and application database

### 2. Intake

- manual upload through the web interface
- batch import from a watched folder or staged directory
- a basic authenticated service endpoint for system-to-system ingestion

### 3. Document Handling

- document storage with metadata and processing status
- document classification into supported types
- targeted field extraction with confidence indicators
- capture of extraction evidence where practical for reviewer verification

### 4. Supported Document Types

The MVP should focus on the high-value document types most likely to create operational friction:

- COIs
- invoices
- change orders
- lien waivers
- permits

Contracts and inspection reports may be accepted and classified in the MVP, but deeper extraction for those document families should be limited unless it can be done without destabilizing the core workflows.

### 5. Review Workflow

- queue-based review for low-confidence or rule-flagged documents
- side-by-side visibility into the document and extracted fields
- ability to edit, approve, reject, or request follow-up
- document status lifecycle that distinguishes intake, review, approval, export, and exception states

### 6. Audit and Traceability

- event history for extraction runs, user edits, approvals, and exports
- timestamps and user attribution for material workflow actions
- retention of original uploaded document files

### 7. Search and Output

- search and filtering by project, document type, vendor or counterparty, and workflow status
- export of approved structured data through CSV and a basic API surface

### 8. Access Control

- at least basic role separation for administrators, reviewers, and operators
- private deployment assumptions with no public-by-default access patterns

## Explicitly Deferred

The MVP is not expected to include every desirable feature. The following can be deferred if doing so improves the odds of shipping a reliable first version:

- deep ERP or accounting system integrations
- advanced analytics dashboards
- customer self-service workflow builders
- multi-tenant SaaS operation
- fully automated straight-through approval for sensitive document types
- clause-level contract analysis

## MVP Quality Bar

The MVP is successful if:

- real reviewers can process supported documents faster than a purely manual workflow
- low-confidence output is surfaced clearly enough that users know what needs attention
- the product produces an auditable record of system actions and human decisions
- deployment stays inside a customer-controlled environment
- operational behavior is predictable enough to support a design-partner pilot
