import type { DocumentSummary } from "@projectdoc/shared";

export const buildTestDocumentSummary = (
  overrides: Partial<DocumentSummary> = {}
): DocumentSummary => ({
  id: "doc_test_001",
  type: "invoice",
  status: "ingested",
  sourceType: "upload",
  filename: "sample-invoice.pdf",
  receivedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
});
