# Product Overview

## Summary

ProjectDoc Local is an on-prem document operations product for project-based businesses, especially contractors and construction back offices. It is intended to help teams ingest project documents, classify them, extract key fields, review uncertain results, and maintain an auditable operating record inside customer-controlled infrastructure.

The product is deliberately positioned as AI-assisted, not AI-autonomous. Extraction should accelerate work, but human operators must remain able to verify, correct, approve, and trace the system's output.

## Who It Serves

The initial target market is organizations that manage a steady volume of compliance, billing, and project administration paperwork, including:

- general contractors
- specialty subcontractors
- construction services firms
- project-based field service businesses with regulated or deadline-sensitive documentation

These teams are often dealing with a mix of PDFs, scans, email attachments, downloaded portal files, and manually renamed folders across active projects.

## Core Product Jobs

ProjectDoc Local is being designed to do five things well:

1. Accept documents through controlled intake paths.
2. Identify the likely document type and extract the fields that matter for operations.
3. Send uncertain or policy-sensitive items into a structured review process.
4. Preserve the history of system output, user edits, approvals, and export events.
5. Make approved records usable by downstream business systems and reporting processes.

## Product Principles

- Local-first deployment. Customer data should remain inside infrastructure controlled by the customer or their approved hosting environment.
- Reviewability. Users must be able to inspect extracted values, source evidence, and confidence indicators before acting on them.
- Auditability. The system should capture who changed what, when, and why.
- Pragmatic workflow support. The product should help real operations teams move work forward instead of creating new process overhead.
- Configurable control points. Organizations should be able to define when review is required and what conditions trigger exception handling.

## Intended Deployment Model

The expected deployment posture is a customer-managed environment with:

- an application API
- background workers for ingestion and extraction
- a browser-based review interface
- customer-controlled document storage
- a relational database for metadata, workflow state, and audit records
- local or customer-approved AI and OCR runtimes within the same trust boundary

The exact packaging may evolve, but the trust boundary should remain explicit and conservative.

## Expected System Capabilities

At maturity, the product should support:

- document intake from uploads, watched directories, and system endpoints
- document classification by type
- targeted field extraction for supported document families
- exception queues for low-confidence or rule-triggered documents
- search and filtering by project, vendor, document type, and status
- export or handoff to downstream systems after review
- operational reporting on backlog, document state, and review throughput

## What Good Looks Like

ProjectDoc Local is valuable if it helps teams process project paperwork with less manual rekeying, fewer hidden exceptions, and a clearer chain of custody from intake through approval. Success depends less on claiming perfect extraction and more on reducing operational friction while preserving control.
