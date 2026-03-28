# MVP Data Model

## Design Principles

The MVP data model should optimize for three things:

- reliable workflow state
- reviewable extraction results
- auditable changes over time

It should not optimize for multi-tenant SaaS from day one.

## Modeling Rules

- One deployment equals one customer environment in v1.
- Original uploaded files are immutable.
- Audit events are append-only.
- Workflow entities use relational tables.
- Document-type-specific extraction payloads use JSONB where schema churn is expected.
- Search and Q&A cite stored pages and chunks, not free-form model output.

## Core Entities

### Users and Access

### `users`

Stores local user accounts for the MVP.

Key fields:

- `id`
- `email`
- `display_name`
- `password_hash`
- `status`
- `created_at`
- `last_login_at`

### `roles`

Simple role catalog for:

- `admin`
- `reviewer`
- `operator`

### `user_roles`

Join table if multi-role assignment is needed. If the product starts with one role per user, this can be collapsed later or represented directly on `users`.

### Business Context

### `projects`

Represents the internal job or project a document belongs to when known.

Key fields:

- `id`
- `project_code`
- `project_name`
- `status`
- `customer_name`
- `metadata_json`

### `counterparties`

Represents vendors, subcontractors, carriers, inspectors, or other external entities referenced in documents.

Key fields:

- `id`
- `name`
- `type`
- `external_ref`
- `metadata_json`

### Documents and Files

### `documents`

Top-level document record used by the product.

Key fields:

- `id`
- `source_type` such as `upload` or `watched_folder`
- `source_ref`
- `project_id`
- `counterparty_id`
- `original_filename`
- `mime_type`
- `sha256`
- `document_type`
- `status`
- `needs_review`
- `current_extraction_id`
- `latest_processing_run_id`
- `received_at`
- `created_at`

Recommended statuses:

- `ingested`
- `processing`
- `classified`
- `extracted`
- `needs_review`
- `approved`
- `rejected`
- `exported`
- `failed`

### `document_files`

Tracks binary artifacts stored on disk.

Key fields:

- `id`
- `document_id`
- `kind` such as `original`, `ocr_pdf`, `preview`, `export`
- `storage_path`
- `size_bytes`
- `mime_type`
- `sha256`
- `created_at`

### `document_pages`

Page-level record used for citations and review.

Key fields:

- `id`
- `document_id`
- `page_number`
- `width`
- `height`
- `text_content`
- `ocr_confidence`
- `image_path`
- `created_at`

### Processing and Extraction

### `processing_runs`

Represents one pipeline execution for a document.

Key fields:

- `id`
- `document_id`
- `triggered_by`
- `trigger_type` such as `upload`, `watch_folder`, `reprocess`
- `status`
- `started_at`
- `completed_at`
- `error_summary`
- `provider_versions_json`

This table matters because extraction may be re-run after model changes, config changes, or review feedback.

### `document_classifications`

Stores classification outputs per run.

Key fields:

- `id`
- `processing_run_id`
- `document_id`
- `predicted_type`
- `confidence`
- `method` such as `rules`, `model`, `hybrid`
- `raw_output_json`
- `created_at`

### `document_extractions`

Stores one structured extraction result per run.

Key fields:

- `id`
- `processing_run_id`
- `document_id`
- `schema_name`
- `schema_version`
- `payload_json`
- `overall_confidence`
- `created_at`

This is the durable snapshot of what the system believed at a point in time.

### `extracted_fields`

Stores immutable machine-produced facts for a specific extraction snapshot.

Key fields:

- `id`
- `document_id`
- `document_extraction_id`
- `field_key`
- `field_label`
- `value_json`
- `normalized_text`
- `confidence`
- `citations_json`
- `provenance_json`
- `created_at`

This table preserves what the system originally proposed. It should not be overwritten when a reviewer makes a correction.

### Search and Q&A

### `document_chunks`

Stores the text chunks used for search and question answering.

Key fields:

- `id`
- `document_id`
- `page_id`
- `page_number`
- `chunk_index`
- `text_content`
- `tsv`
- `embedding`
- `token_count`
- `created_at`

This table supports:

- keyword search through PostgreSQL full-text search
- semantic retrieval through `pgvector`
- direct citations back to the source page

### `qa_queries`

Optional but recommended for auditability and support.

Key fields:

- `id`
- `user_id`
- `query_text`
- `answer_text`
- `status`
- `created_at`

### `qa_query_citations`

Links answers to the chunks and pages used.

Key fields:

- `id`
- `qa_query_id`
- `document_chunk_id`
- `document_id`
- `page_number`
- `rank`

### Review and Exceptions

### `review_tasks`

Represents queue items that need human attention.

Key fields:

- `id`
- `document_id`
- `reason`
- `priority`
- `status`
- `assigned_to`
- `created_at`
- `completed_at`

Common reasons:

- low confidence
- missing required field
- conflicting values
- policy rule triggered
- OCR quality issue

### `reviewed_field_values`

Stores the current authoritative field values for the document after human review.

Key fields:

- `id`
- `document_id`
- `field_key`
- `field_label`
- `source_extracted_field_id`
- `machine_value_json`
- `machine_confidence`
- `authoritative_value_json`
- `authoritative_value_source`
- `review_status`
- `reviewer_id`
- `reviewed_at`
- `notes`
- `citations_json`

This table makes overrides explicit. Machine output stays in `extracted_fields`, while the current business-approved value lives here.

### `review_actions`

Stores reviewer actions against a document or task.

Key fields:

- `id`
- `review_task_id`
- `document_id`
- `reviewed_field_value_id`
- `user_id`
- `action`
- `field_key`
- `notes`
- `before_json`
- `after_json`
- `created_at`

### Audit and Export

### `audit_events`

Append-only record of material system and user actions.

Key fields:

- `id`
- `actor_type` such as `user` or `system`
- `actor_id`
- `event_type`
- `entity_type`
- `entity_id`
- `request_id`
- `metadata_json`
- `created_at`

The product should write audit events for:

- document intake
- OCR and extraction completion
- review assignment
- field correction
- approval and rejection
- export generation
- admin configuration changes

### `export_jobs`

Tracks CSV export creation.

Key fields:

- `id`
- `requested_by`
- `status`
- `filter_json`
- `output_file_id`
- `row_count`
- `created_at`
- `completed_at`

### Configuration

### `watch_folder_configs`

Stores watched-folder settings.

Key fields:

- `id`
- `name`
- `path`
- `enabled`
- `project_id`
- `default_document_type`
- `post_process_action`
- `failure_path`
- `created_at`

### `system_settings`

Stores instance-wide settings as JSONB plus named keys.

Examples:

- model provider settings
- storage root settings
- review thresholds
- export defaults

## Relationship Summary

- A `document` has many `document_files`, `document_pages`, `processing_runs`, `review_tasks`, and `audit_events`.
- A `processing_run` may produce one `document_classification` and one `document_extraction`.
- A `document_extraction` has many `extracted_fields`.
- A `document_page` has many `document_chunks`.
- A `document` has many `reviewed_field_values`.
- A `qa_query` has many `qa_query_citations`.
- An `export_job` points to one generated export file.

## Why This Model Fits the MVP

- It keeps workflow and audit data relational and explicit.
- It keeps machine extraction output separate from reviewed authoritative values.
- It supports page-level citations without introducing a separate search database.
- It supports reprocessing without losing the original system output.
- It avoids fake multi-tenant complexity while leaving room for later growth.

## Tradeoffs

- Generic field tables are less elegant than document-type-specific tables, but they are faster to evolve while the supported document set is still moving.
- PostgreSQL stores both transactional and search data, which simplifies deployment but concentrates load in one system.
- Keeping QA history is useful for support and audit, but it adds storage overhead and should be configurable.

## Rejected Alternatives

### 1. One table per document type for every extracted field

Rejected because the MVP is still learning which fields really matter by document type. Separate tables would create migration churn and slow iteration.

### 2. Storing only the latest approved values

Rejected because it loses the original model output and makes auditability much weaker.

### 3. Storing all document data in a document database

Rejected because workflow, review, audit, and relational filtering are first-class needs. PostgreSQL is the better fit.
