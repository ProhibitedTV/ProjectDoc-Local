# OCR Strategy

## Purpose

ProjectDoc Local needs OCR because scanned PDFs and images are common in contractor-style back-office workflows. It does not need to commit the whole product to one OCR engine too early.

The current strategy is to standardize one narrow internal OCR representation and keep engine-specific behavior behind a provider interface.

## Design Goals

- support page-level text as a first-class output
- preserve page references and region-level evidence when an engine can provide them
- carry confidence when the engine exposes it
- keep provenance attached to the OCR run
- let the worker swap OCR implementations later without rewriting downstream extraction or citation logic

## Internal OCR Contract

The normalized OCR contract now lives in:

- `packages/shared/src/domain/ocr.ts`
- `packages/shared/src/ai/providers.ts`

The contract includes:

- `OcrProviderInput`
- `OcrResult`
- `OcrPage`
- `OcrRegion`

### `OcrResult`

Represents one OCR run for one document and processing run.

Key fields:

- `documentId`
- `processingRunId`
- `pageCount`
- `fullText`
- `pages`
- `provenance`
- `createdAt`

### `OcrPage`

Represents one normalized page of OCR output.

Key fields:

- stable `id`
- `pageNumber`
- normalized `text`
- optional `confidence`
- optional page dimensions
- `regions`

### `OcrRegion`

Represents a block, line, or word when the OCR engine can provide region detail.

Key fields:

- stable `id`
- `pageId`
- `pageNumber`
- `kind`
- `text`
- optional `confidence`
- optional `boundingBox`
- optional `sourceEngineId`

This is the main bridge into later extraction and citation work. A future extractor can cite a region by page and region ID, or use the bounding box and excerpt.

## Current Provider Boundary

The worker OCR module now uses a provider token:

- `apps/worker/src/modules/ocr/ocr-provider.token.ts`
- `apps/worker/src/modules/ocr/ocr.service.ts`
- `apps/worker/src/modules/ocr/local-stub-ocr.provider.ts`

`OcrService` is the product-facing OCR dependency.
The default implementation is `LocalStubOcrProvider`.

That provider is intentionally modest:

- for `text/plain`, it creates a normalized one-page OCR result from the file contents
- for other formats, it returns a placeholder normalized page with no extracted text

This is not presented as a real OCR engine. It only proves the normalization boundary and the downstream data shape.

## Normalization Rules

The current normalization logic lives in:

- `apps/worker/src/modules/ocr/ocr-normalizer.ts`

Normalization rules:

- page IDs and region IDs are deterministic from the processing run and page order
- page text is derived from region text when the engine does not provide page text directly
- region and page confidence are normalized into the `0..1` range
- invalid or incomplete bounding boxes are dropped instead of being half-trusted
- provenance records the provider, version, method, and processing run

Each provider adapter is responsible for translating its raw engine output into this internal shape. That includes engine-specific confidence scales such as percentages, token-level coordinates, or vendor-specific region metadata.

## Why This Boundary Fits The Product

- It is narrow enough to keep the worker code understandable.
- It is rich enough to support page citations and region-level evidence later.
- It does not force the rest of the codebase to understand OCRmyPDF, Tesseract TSV, hOCR, or any other engine-specific format.
- It keeps OCR output product-owned instead of vendor-owned.

## Rejected Shortcuts

### Returning only plain text

Rejected because page and region references are needed for later review and citation quality.

### Exposing raw OCR engine payloads directly

Rejected because it would leak engine-specific formats into extraction and review code.

### Pretending the stub provider is production OCR

Rejected because that would make the architecture look further along than it is.

## Near-Term Next Step

When a real OCR engine is introduced, it should:

1. implement the same `OcrProvider` interface
2. normalize raw engine output into `OcrResult`
3. preserve provider and version provenance
4. avoid leaking engine-specific response shapes outside the OCR module
