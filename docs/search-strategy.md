# Search Strategy

## Current Approach

The first search experience in ProjectDoc Local is deterministic and local.

It searches over normalized document sections built from the data the product already controls:

- source text from uploaded text files
- document metadata
- classification summaries
- extracted field summaries

The current search flow does not attempt semantic ranking or answer generation. It is intentionally simple so the team can ship traceable results before adding more complex retrieval behavior.

## Why This Fits The MVP

- It works on a single machine with no extra search infrastructure.
- It keeps every result tied to a document and, when available, a page reference.
- It reuses product-owned schemas instead of introducing a one-off search index format.
- It leaves a clean seam for later retrieval upgrades.

## Searchable Section Model

The system now builds local searchable sections for each document.

Each section includes:

- document ID
- section ID
- section title
- section source
- text
- optional page number
- optional citations
- optional provenance

This section model is the key architectural choice in the current search slice. The UI and API both depend on sections, not on a storage-engine-specific result format.

## Current Ranking

The MVP ranking is intentionally modest:

- tokenize the query into lowercase terms
- match terms against section title plus section text
- score by matched term count and raw occurrence count
- add a small source boost for source text and extracted fields
- break ties by document recency

This is enough to make results useful without implying a level of search sophistication the product does not yet have.

## Traceability Rules

The current search slice prioritizes traceability over cleverness.

- Results always point back to a document.
- Results include a section title and section source.
- Page references are returned when the section has page-level evidence.
- Document detail pages expose the underlying searchable sections directly.

That means users can inspect the same content the search system matched instead of trusting an opaque ranking output.

## Known Limitations

- Text-native uploads are the strongest current search source because they provide real source text.
- PDF and image uploads still rely heavily on stubbed machine summaries until OCR and real extraction land.
- Search currently runs in-process over persisted records rather than using PostgreSQL full-text indexing.
- There is no semantic retrieval, embedding search, or question answering in this slice.

These limitations are acceptable for the current MVP because the goal is a reviewable local baseline, not a fully mature retrieval stack.

## Future Evolution

The intended upgrade path is:

1. replace in-process section scanning with PostgreSQL full-text indexing over stored page and chunk records
2. keep the same section-oriented response shape for the UI
3. add chunk-level storage and indexing for longer documents
4. add vector search and hybrid ranking behind the retrieval service boundary
5. add citation-backed question answering that only returns evidence tied to stored sections, pages, or chunks

The important part is that future semantic retrieval should enrich the current section model, not bypass it.
