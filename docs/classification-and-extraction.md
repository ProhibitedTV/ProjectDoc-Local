# Classification and Extraction

## Purpose

ProjectDoc Local needs classification and extraction contracts that are narrow enough to keep the MVP maintainable, but rich enough to support traceability, review, and future model swaps.

The current design treats classification and extraction as normalized worker outputs, not raw model payloads.

## Design Principles

- keep the input contract simple enough to feed from OCR, fixtures, or hand-authored test text
- keep the output contract explicit about confidence, provenance, and review recommendations
- avoid pretending the default stubs are production parsing logic
- make expected fields predictable by document type so review screens and tests can be built early

## Contract Locations

- `packages/shared/src/domain/document-analysis.ts`
- `packages/shared/src/ai/providers.ts`
- `apps/worker/src/modules/classification/*`
- `apps/worker/src/modules/extraction/*`

## Normalized Inputs

### Classification Input

`ClassificationInput` carries:

- `documentId`
- `processingRunId`
- `text`
- `pages`
- `metadata`

This keeps the classifier independent from any one OCR engine while still allowing page-aware citations.

### Extraction Input

`ExtractionInput` carries:

- `documentId`
- `processingRunId`
- `documentType`
- `text`
- `pages`
- `metadata`

This makes it easy to test extraction with future fixture documents because the extractor only needs normalized page text, not raw OCR engine output.

## Normalized Outputs

### Classification Output

`ClassificationOutput` includes:

- selected `documentType`
- normalized `confidence`
- `method`
- human-readable `reasons`
- ranked `candidates`
- `reviewRecommended`
- `reviewReasons`
- `provenance`

Each candidate can carry citations to the page text that triggered the classification signal.

### Extraction Output

`ExtractionOutput` includes:

- `schemaName`
- `schemaVersion`
- `overallConfidence`
- `reviewRecommended`
- `reviewReasons`
- `missingRequiredFieldKeys`
- `warnings`
- `fields`
- `provenance`

Each `ExtractionFieldOutput` includes:

- `fieldKey`
- `label`
- `valueType`
- `required`
- `value`
- `normalizedText`
- `confidence`
- `reviewRecommended`
- `reviewReasons`
- `citations`
- `provenance`

The important behavior is that missing values remain `null`. The stub extractor does not invent data to make a record look complete.

## Default Stub Behavior

### Classifier

The default classifier is `DeterministicStubClassifierProvider`.

It uses deterministic keyword rules to:

- rank candidate document types
- emit page citations for matched signals
- recommend review when confidence is weak or ambiguous

This is useful for development because it gives the UI and pipeline stable behavior without implying real model quality.

### Extractor

The default extractor is `DeterministicStubExtractorProvider`.

It uses simple labeled-field matching rules such as:

- `Invoice Number: ...`
- `Permit Number: ...`
- `Expiration Date: ...`

The extractor is intentionally conservative:

- it only extracts values when an explicit rule matches
- it leaves missing values as `null`
- it raises review recommendations for missing required fields or weak matches

## Expected Field Sets By Document Type

### certificate_of_insurance

- `insured_name`
- `certificate_holder_name`
- `producer_name`
- `policy_number`
- `policy_effective_date`
- `policy_expiration_date`
- `coverage_general_liability`

### permit

- `permit_number`
- `permit_type`
- `issuing_authority`
- `site_address`
- `issue_date`
- `expiration_date`
- `applicant_name`

### invoice

- `invoice_number`
- `vendor_name`
- `invoice_date`
- `due_date`
- `purchase_order_number`
- `subtotal_amount`
- `total_amount`

### change_order

- `change_order_number`
- `project_name`
- `vendor_name`
- `change_description`
- `net_change_amount`
- `change_order_date`
- `requested_by_name`

### lien_waiver

- `waiver_type`
- `claimant_name`
- `customer_name`
- `project_name`
- `amount_paid`
- `through_date`
- `signed_date`

### contract

- `agreement_title`
- `contract_number`
- `owner_name`
- `contractor_name`
- `effective_date`
- `contract_value`

### inspection_report

- `report_number`
- `inspector_name`
- `inspection_date`
- `inspected_entity_name`
- `site_address`
- `outcome`

### unknown

- no structured field set is assumed
- the default extractor returns no fields and recommends review

## Example Extraction Expectations

### Invoice Example

Input text:

```text
Invoice Number: INV-2048
Vendor Name: ACME Electrical LLC
Invoice Date: 2026-03-01
Total Amount: 5432.10
```

Expected normalized behavior:

- document classified as `invoice`
- `invoice_number` extracted as `INV-2048`
- `total_amount` extracted as numeric `5432.1`
- citations point back to the page containing the matched labels
- review is not required if required fields are present

### Permit Example

Input text:

```text
Permit Number: PERM-7781
Issuing Authority: City of Denver
Expiration Date: 2026-09-10
```

Expected normalized behavior:

- document classified as `permit` when permit signals are present
- `permit_number`, `issuing_authority`, and `expiration_date` extract cleanly
- optional fields may remain `null`
- review is only recommended if required fields are missing or confidence is weak

## Tradeoffs

- The current stubs favor explicit labeled fields over aggressive guessing.
- Contracts are richer than the stub logic because downstream review and audit requirements need those fields now.
- Required fields are defined centrally so the UI and tests can rely on one expected schema per document type.

## Rejected Shortcuts

### Returning only a flat JSON blob

Rejected because review screens need per-field confidence, citations, and required-field status.

### Hiding missing values by omitting fields

Rejected because reviewers need to see expected-but-missing fields explicitly.

### Letting model or vendor payloads define the product contract

Rejected because it would make later provider swaps much more expensive.
