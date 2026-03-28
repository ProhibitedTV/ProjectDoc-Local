import { describe, expect, it } from "vitest";

import { extractedFieldSchema, reviewedFieldValueSchema } from "../src";

describe("domain model schemas", () => {
  it("requires citations on machine-extracted fields", () => {
    const result = extractedFieldSchema.safeParse({
      id: "field_1",
      documentId: "doc_1",
      documentExtractionId: "extract_1",
      fieldKey: "invoice_number",
      fieldLabel: "Invoice Number",
      value: "INV-001",
      normalizedText: "INV-001",
      confidence: 0.82,
      citations: [
        {
          documentId: "doc_1",
          pageNumber: 1,
          excerpt: "Invoice Number INV-001"
        }
      ],
      provenance: {
        processingRunId: "run_1",
        provider: "stub-extractor",
        method: "model",
        createdAt: "2026-01-01T00:00:00.000Z"
      },
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    expect(result.success).toBe(true);
  });

  it("makes human overrides explicit in reviewed values", () => {
    const result = reviewedFieldValueSchema.safeParse({
      id: "reviewed_field_1",
      documentId: "doc_1",
      fieldKey: "invoice_total",
      fieldLabel: "Invoice Total",
      sourceExtractedFieldId: "field_2",
      machineValue: 1200,
      machineConfidence: 0.66,
      authoritativeValue: 1250,
      authoritativeValueSource: "human",
      reviewStatus: "corrected",
      reviewerId: "user_1",
      reviewedAt: "2026-01-01T01:00:00.000Z",
      notes: "Corrected after checking page 2 supporting detail.",
      citations: [
        {
          documentId: "doc_1",
          pageNumber: 2,
          excerpt: "Total due 1,250.00"
        }
      ]
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.authoritativeValueSource).toBe("human");
      expect(result.data.machineValue).toBe(1200);
      expect(result.data.authoritativeValue).toBe(1250);
    }
  });
});
