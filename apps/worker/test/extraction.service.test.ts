import { extractionOutputSchema, type ExtractionInput } from "@projectdoc/shared";
import { describe, expect, it } from "vitest";

import { DeterministicStubExtractorProvider } from "../src/modules/extraction/deterministic-stub-extractor.provider";

const provider = new DeterministicStubExtractorProvider();

const buildInput = (documentType: ExtractionInput["documentType"], text: string): ExtractionInput => ({
  documentId: "doc_extractor_1",
  processingRunId: "run_extractor_1",
  documentType,
  text,
  pages: [{ pageNumber: 1, text, regions: [] }],
  metadata: {}
});

describe("DeterministicStubExtractorProvider", () => {
  it("extracts labeled permit fields into the normalized contract", async () => {
    const text = `Permit
Permit Number: PERM-7781
Permit Type: Electrical
Issuing Authority: City of Denver
Site Address: 123 Main St, Denver, CO 80205
Issue Date: 2026-03-10
Expiration Date: 2026-09-10
Applicant Name: ACME Electrical LLC`;

    const result = await provider.extract(buildInput("permit", text));

    expect(() => extractionOutputSchema.parse(result)).not.toThrow();
    expect(result.documentType).toBe("permit");
    expect(result.reviewRecommended).toBe(false);
    expect(result.missingRequiredFieldKeys).toEqual([]);
    expect(result.fields.find((field) => field.fieldKey === "permit_number")?.value).toBe("PERM-7781");
    expect(result.fields.find((field) => field.fieldKey === "issuing_authority")?.citations[0]).toMatchObject({
      documentId: "doc_extractor_1",
      pageNumber: 1
    });
  });

  it("marks missing required fields for review instead of inventing values", async () => {
    const text = `Invoice
Vendor Name: ACME Electrical LLC
Subtotal: 2000.00`;

    const result = await provider.extract(buildInput("invoice", text));

    expect(result.reviewRecommended).toBe(true);
    expect(result.missingRequiredFieldKeys).toEqual(expect.arrayContaining(["invoice_number", "invoice_date", "total_amount"]));
    expect(result.fields.find((field) => field.fieldKey === "vendor_name")?.value).toBe("ACME Electrical LLC");
    expect(result.fields.find((field) => field.fieldKey === "total_amount")?.value).toBeNull();
  });

  it("returns a deliberate no-op extraction for unknown documents", async () => {
    const result = await provider.extract(buildInput("unknown", "Project site memo."));

    expect(result.fields).toEqual([]);
    expect(result.reviewRecommended).toBe(true);
    expect(result.warnings[0]).toContain("Unknown documents");
  });
});
