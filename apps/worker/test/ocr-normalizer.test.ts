import { readFile } from "node:fs/promises";

import { ocrResultSchema, type OcrProviderInput } from "@projectdoc/shared";
import { describe, expect, it } from "vitest";

import { normalizeLocalOcrOutput } from "../src/modules/ocr/ocr-normalizer";
import type { RawLocalOcrOutput } from "../src/modules/ocr/ocr.types";

const loadFixture = async (name: string): Promise<RawLocalOcrOutput> => {
  const raw = await readFile(new URL(`./fixtures/ocr/${name}`, import.meta.url), "utf8");
  return JSON.parse(raw) as RawLocalOcrOutput;
};

const providerInput: OcrProviderInput = {
  documentId: "doc_123",
  processingRunId: "run_123",
  sourceFilePath: "/tmp/source.pdf",
  mimeType: "application/pdf",
  fileName: "source.pdf"
};

describe("normalizeLocalOcrOutput", () => {
  it("produces stable page and region references from engine output", async () => {
    const rawFixture = await loadFixture("raw-local-engine-output.json");

    const result = normalizeLocalOcrOutput(providerInput, rawFixture, {
      provider: "local-stub-ocr",
      providerVersion: "0.1.0",
      method: "fixture"
    });

    expect(() => ocrResultSchema.parse(result)).not.toThrow();
    expect(result.pageCount).toBe(2);
    expect(result.fullText).toContain("ACME ELECTRICAL LLC");
    expect(result.fullText).toContain("Total Due 5432.10");
    expect(result.pages[0].id).toBe("run_123:ocr:page:1");
    expect(result.pages[0].regions[0]).toMatchObject({
      id: "run_123:ocr:page:1:region:1",
      pageId: "run_123:ocr:page:1",
      pageNumber: 1,
      kind: "block",
      confidence: 0.98,
      sourceEngineId: "block-1"
    });
    expect(result.provenance).toMatchObject({
      processingRunId: "run_123",
      provider: "local-stub-ocr",
      providerVersion: "0.1.0",
      method: "fixture"
    });
  });

  it("derives page text and normalizes sparse confidence and bounding-box data", async () => {
    const rawFixture = await loadFixture("raw-local-engine-sparse-output.json");

    const result = normalizeLocalOcrOutput(providerInput, rawFixture, {
      provider: "local-stub-ocr",
      method: "fixture"
    });

    expect(result.pageCount).toBe(1);
    expect(result.pages[0].text).toBe("Permit Application\nCity of Denver");
    expect(result.pages[0].confidence).toBe(0.5);
    expect(result.pages[0].regions[0]).toMatchObject({
      kind: "line",
      confidence: 1
    });
    expect(result.pages[0].regions[1]).toMatchObject({
      kind: "line",
      confidence: 0,
      boundingBox: undefined
    });
  });
});
