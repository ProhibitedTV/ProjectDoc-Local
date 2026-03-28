import { z } from "zod";

import { documentFileSchema, documentPageSchema, documentSchema } from "./document";
import { machineExtractionRecordSchema } from "./extraction";
import { reviewedDocumentRecordSchema } from "./review";

export const sourceDocumentRecordSchema = z
  .object({
    document: documentSchema,
    files: z.array(documentFileSchema),
    pages: z.array(documentPageSchema)
  })
  .strict();

export type SourceDocumentRecord = z.infer<typeof sourceDocumentRecordSchema>;

export const documentTraceSchema = z
  .object({
    source: sourceDocumentRecordSchema,
    machine: machineExtractionRecordSchema.optional(),
    review: reviewedDocumentRecordSchema.optional()
  })
  .strict();

export type DocumentTrace = z.infer<typeof documentTraceSchema>;
