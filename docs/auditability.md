# Auditability

## Purpose

ProjectDoc Local needs a usable operational trail, not just debug logs.

The audit layer is intended to answer practical questions such as:

- who uploaded this document
- when a pipeline stage changed
- when machine-generated classification or extraction output was produced
- who approved or corrected a review item
- when an export was requested or completed
- who changed an admin-facing setting and why

## Current Event Model

The current audit event shape is intentionally small and consistent.

Each event includes:

- event type
- actor type and optional actor ID
- occurred-at timestamp
- primary entity type and entity ID
- optional summary
- optional reason
- optional field-level changes
- optional related entity references
- optional metadata for operational context

This keeps the event stream readable while still preserving enough context for support, review, and pilot operations.

## What Is Logged Today

The current first-pass implementation records:

- `document.ingested`
  - when a local upload is accepted and the intake record is created
- `document.pipeline_stage_changed`
  - when a meaningful pipeline stage changes state
- `classification.generated`
  - when machine classification output is materialized for review
- `extraction.generated`
  - when structured field output is materialized for review
- `document.flagged_for_review`
  - when the system routes a document into human review
- `review.corrected`
  - when a reviewer changes one or more authoritative values
- `review.approved`
  - when a reviewer approves a review item
- `document.approved`
  - when the document itself is marked approved after review
- `review.follow_up_requested`
  - when a reviewer marks the item as needing follow-up
- `export.requested`
  - when a CSV export job is requested
- `export.completed`
  - when the current development export job completes
- `admin.settings_changed`
  - when an admin updates instance-level settings with a reason

## Persistence Approach

For the current MVP foundation, audit events are stored as individual JSON records under the local storage root.

This is not the long-term persistence strategy, but it has real product value now:

- events survive process restarts
- recent events can be queried over the API
- feature modules do not need to know about database internals yet
- the event model can stabilize before a Prisma-backed repository replaces the JSON store

## Inspection Surfaces

Current audit inspection is available through:

- `GET /api/audit-events`
  - supports recent-event inspection with simple filters
- the Admin page
  - shows recent events in a human-readable feed
  - exposes a small settings form so configuration changes create explicit audit entries

## Logging Principles

The current implementation tries to avoid noisy low-value logging.

- We log business-relevant lifecycle transitions, not every internal function call.
- We prefer explicit summaries over dumping raw payloads into the event body.
- Corrections capture before/after values when the change is meaningful.
- Configuration changes require a reason so later reviewers can understand intent.

## Current Limits

- Request-scoped correlation IDs are not wired through yet.
- Not every future worker-stage event exists yet because the worker pipeline is still mostly stubbed.
- Export generation is still development-stage logic, so export audit events currently track the job boundary rather than rich output details.
- The JSON-backed event store is suitable for the current foundation, not for long-term production scale.

## Next Evolution

The likely next step is to keep the event contract and move persistence to PostgreSQL, then add:

- stronger actor identity resolution
- request and job correlation IDs
- richer export and admin object references
- tighter integration with worker-stage processing
- retention and archival policy controls
