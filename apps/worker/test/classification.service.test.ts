import { classificationOutputSchema, type ClassificationInput } from "@projectdoc/shared";
import { describe, expect, it } from "vitest";

import { DeterministicStubClassifierProvider } from "../src/modules/classification/deterministic-stub-classifier.provider";

const provider = new DeterministicStubClassifierProvider();

const buildInput = (text: string): ClassificationInput => ({
  documentId: "doc_classifier_1",
  processingRunId: "run_classifier_1",
  text,
  pages: [{ pageNumber: 1, text, regions: [] }],
  metadata: {}
});

describe("DeterministicStubClassifierProvider", () => {
  it("classifies labeled invoice text with citations and confidence", async () => {
    const text = `Invoice
Invoice Number: INV-2048
Invoice Date: 2026-03-01
Vendor Name: ACME Electrical LLC
Total Amount: 5432.10
Amount Due: 5432.10`;

    const result = await provider.classify(buildInput(text));

    expect(() => classificationOutputSchema.parse(result)).not.toThrow();
    expect(result.documentType).toBe("invoice");
    expect(result.reviewRecommended).toBe(false);
    expect(result.candidates[0]?.matchedSignals).toContain("invoice number");
    expect(result.candidates[0]?.citations[0]).toMatchObject({
      documentId: "doc_classifier_1",
      pageNumber: 1
    });
  });

  it("falls back to unknown and recommends review when no signals match", async () => {
    const result = await provider.classify(
      buildInput("This attachment contains miscellaneous project notes and no labeled business form fields.")
    );

    expect(result.documentType).toBe("unknown");
    expect(result.reviewRecommended).toBe(true);
    expect(result.reviewReasons).toContain("low_confidence");
  });
});
