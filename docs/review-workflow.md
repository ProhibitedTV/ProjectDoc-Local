# Review Workflow

## Purpose

ProjectDoc Local needs a review queue that makes the machine proposal easy to inspect and the human override path impossible to miss.

The first version of the workflow is intentionally simple:

1. a document enters the queue with machine-generated classification and extraction output
2. the reviewer inspects confidence, provenance, and citations
3. the reviewer either approves, corrects, or marks the item for follow-up
4. the system preserves both the original machine proposal and the current authoritative value

## Current Slice

The current implementation includes:

- API endpoints for queue list, review detail, approve, correct, and follow-up actions
- a JSON-backed persisted review record per document for development
- a list page that surfaces active review items and queue pressure
- a detail page that shows machine output, authoritative values, citations, actions, and audit events

The machine output is still stubbed, but the review state itself is durable and product-owned.

## Information Architecture

### Queue List

The list page answers:

- what needs review now
- why it needs review
- how risky it looks at a glance
- whether someone has already started correcting it

That is why the list emphasizes:

- predicted document type
- classification and extraction confidence
- unresolved field count
- corrected field count
- review status and priority

### Review Detail

The detail page separates four concerns:

1. document metadata and processing context
2. classification decision and candidate reasoning
3. field-by-field extraction review
4. actions and audit trail

This prevents reviewers from having to mentally merge system status, model evidence, and editable business values in one overloaded table.

## Override Model

The review detail page always shows:

- the machine proposal
- the current authoritative value
- the authoritative value source

That separation matters because correction is not the same thing as replacement history being erased.

When a reviewer changes a field:

- the machine value remains visible
- the authoritative value changes
- the value source switches to `human`
- a review action is appended
- an audit event is appended

## Actions

### Approve

Approving resolves the review task and marks the document approved. It accepts the current authoritative values, whether they still come from the machine or have been corrected by a human.

### Correct

Correcting saves explicit field overrides and keeps the review task open. This supports the common workflow where someone fixes values first and only approves after a final pass.

### Mark Needs Follow-Up

This sets the task aside without pretending the document is complete. It is used when the reviewer needs external confirmation, missing paperwork, or supporting backup before approval.

## Audit Trail

Each review item stores:

- review actions
- audit events
- reviewer identity supplied by the client
- timestamps for corrections, follow-up, and approval

This is not a full security model yet, but it preserves the decision trail required for later productization.

## UX Rationale

The workflow is shaped this way because reviewers usually do not need more AI surface area. They need less ambiguity.

- The queue list is compact because triage happens fast.
- The detail page is explicit because reviewers need to compare machine output against business truth, not guess which value the system will use.
- Corrections are separate from approval because editing and final sign-off are different cognitive steps.
- Citations and provenance stay close to each field because trust depends on seeing the evidence at the moment a correction is made.
