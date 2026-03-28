import type { BoundingBox, OcrPage, OcrProviderInput, OcrRegion, OcrResult } from "@projectdoc/shared";

import type { RawLocalOcrOutput, RawLocalOcrPage, RawLocalOcrRegion } from "./ocr.types";

type NormalizeOcrOptions = {
  provider: string;
  providerVersion?: string;
  method: string;
};

const normalizeConfidence = (value: number | null | undefined): number | undefined => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
};

const normalizeBoundingBox = (value: RawLocalOcrRegion["boundingBox"]): BoundingBox | undefined => {
  if (!value) {
    return undefined;
  }

  if (
    typeof value.x !== "number" ||
    typeof value.y !== "number" ||
    typeof value.width !== "number" ||
    typeof value.height !== "number"
  ) {
    return undefined;
  }

  return {
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height
  };
};

const derivePageText = (page: RawLocalOcrPage): string => {
  if (typeof page.text === "string" && page.text.trim().length > 0) {
    return page.text;
  }

  return (page.regions ?? [])
    .map((region) => region.text?.trim() ?? "")
    .filter((text) => text.length > 0)
    .join("\n");
};

const derivePageConfidence = (page: RawLocalOcrPage): number | undefined => {
  const explicitConfidence = normalizeConfidence(page.confidence);

  if (explicitConfidence !== undefined) {
    return explicitConfidence;
  }

  const regionConfidences = (page.regions ?? [])
    .map((region) => normalizeConfidence(region.confidence))
    .filter((confidence): confidence is number => confidence !== undefined);

  if (regionConfidences.length === 0) {
    return undefined;
  }

  return regionConfidences.reduce((sum, confidence) => sum + confidence, 0) / regionConfidences.length;
};

const buildPageId = (processingRunId: string, pageNumber: number) =>
  `${processingRunId}:ocr:page:${String(pageNumber)}`;

const buildRegionId = (pageId: string, regionIndex: number) =>
  `${pageId}:region:${String(regionIndex + 1)}`;

export const normalizeLocalOcrOutput = (
  input: OcrProviderInput,
  raw: RawLocalOcrOutput,
  options: NormalizeOcrOptions
): OcrResult => {
  const pages: OcrPage[] = raw.pages.map((page, pageIndex) => {
    const pageNumber = page.pageNumber || pageIndex + 1;
    const pageId = buildPageId(input.processingRunId, pageNumber);
    const regions: OcrRegion[] = (page.regions ?? []).map((region, regionIndex) => ({
      id: buildRegionId(pageId, regionIndex),
      documentId: input.documentId,
      processingRunId: input.processingRunId,
      pageId,
      pageNumber,
      kind: region.kind ?? "line",
      text: region.text ?? "",
      confidence: normalizeConfidence(region.confidence),
      boundingBox: normalizeBoundingBox(region.boundingBox),
      sourceEngineId: region.engineId
    }));

    return {
      id: pageId,
      documentId: input.documentId,
      processingRunId: input.processingRunId,
      pageNumber,
      text: derivePageText(page),
      confidence: derivePageConfidence(page),
      width: typeof page.width === "number" && page.width > 0 ? page.width : undefined,
      height: typeof page.height === "number" && page.height > 0 ? page.height : undefined,
      regions
    };
  });

  const createdAt = new Date().toISOString();

  return {
    documentId: input.documentId,
    processingRunId: input.processingRunId,
    pageCount: pages.length,
    fullText: pages.map((page) => page.text).filter((text) => text.length > 0).join("\n\n"),
    pages,
    provenance: {
      processingRunId: input.processingRunId,
      provider: options.provider,
      providerVersion: options.providerVersion,
      method: options.method,
      createdAt
    },
    createdAt
  };
};
