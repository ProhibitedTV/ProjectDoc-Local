import { z } from "zod";

import { boundingBoxSchema, confidenceScoreSchema, entityIdSchema, timestampSchema } from "./common";
import { provenanceSchema } from "./extraction";

export const ocrProviderInputSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    sourceFilePath: z.string().min(1),
    mimeType: z.string().min(1),
    fileName: z.string().min(1).optional()
  })
  .strict();

export type OcrProviderInput = z.infer<typeof ocrProviderInputSchema>;

export const ocrRegionKinds = ["block", "line", "word"] as const;
export const ocrRegionKindSchema = z.enum(ocrRegionKinds);
export type OcrRegionKind = z.infer<typeof ocrRegionKindSchema>;

export const ocrRegionSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    pageId: entityIdSchema,
    pageNumber: z.number().int().positive(),
    kind: ocrRegionKindSchema,
    text: z.string(),
    confidence: confidenceScoreSchema.optional(),
    boundingBox: boundingBoxSchema.optional(),
    sourceEngineId: z.string().min(1).optional()
  })
  .strict();

export type OcrRegion = z.infer<typeof ocrRegionSchema>;

export const ocrPageSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    pageNumber: z.number().int().positive(),
    text: z.string(),
    confidence: confidenceScoreSchema.optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    imagePath: z.string().min(1).optional(),
    regions: z.array(ocrRegionSchema)
  })
  .strict();

export type OcrPage = z.infer<typeof ocrPageSchema>;

export const ocrResultSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    pageCount: z.number().int().nonnegative(),
    fullText: z.string(),
    pages: z.array(ocrPageSchema),
    provenance: provenanceSchema,
    createdAt: timestampSchema
  })
  .strict();

export type OcrResult = z.infer<typeof ocrResultSchema>;
