import { z } from "zod";

import {
  boundingBoxSchema,
  confidenceScoreSchema,
  entityIdSchema,
  fieldValueSchema,
  metadataSchema,
  timestampSchema
} from "./common";
import { documentTypeSchema } from "./document";

export const processingTriggerTypes = ["upload", "watched_folder", "service_endpoint", "reprocess"] as const;
export const processingTriggerTypeSchema = z.enum(processingTriggerTypes);
export type ProcessingTriggerType = z.infer<typeof processingTriggerTypeSchema>;

export const processingRunStatuses = ["queued", "running", "completed", "failed"] as const;
export const processingRunStatusSchema = z.enum(processingRunStatuses);
export type ProcessingRunStatus = z.infer<typeof processingRunStatusSchema>;

export const classificationMethods = ["rules", "model", "hybrid", "stub"] as const;
export const classificationMethodSchema = z.enum(classificationMethods);
export type ClassificationMethod = z.infer<typeof classificationMethodSchema>;

export const sourceCitationSchema = z
  .object({
    documentId: entityIdSchema,
    pageId: entityIdSchema.optional(),
    pageNumber: z.number().int().positive().optional(),
    regionId: entityIdSchema.optional(),
    chunkId: entityIdSchema.optional(),
    boundingBox: boundingBoxSchema.optional(),
    excerpt: z.string().min(1).optional()
  })
  .strict();

export type SourceCitation = z.infer<typeof sourceCitationSchema>;

export const provenanceSchema = z
  .object({
    processingRunId: entityIdSchema,
    provider: z.string().min(1),
    providerVersion: z.string().min(1).optional(),
    method: z.string().min(1),
    model: z.string().min(1).optional(),
    createdAt: timestampSchema
  })
  .strict();

export type Provenance = z.infer<typeof provenanceSchema>;

export const processingRunSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    triggeredByUserId: entityIdSchema.optional(),
    triggerType: processingTriggerTypeSchema,
    status: processingRunStatusSchema,
    startedAt: timestampSchema.optional(),
    completedAt: timestampSchema.optional(),
    errorSummary: z.string().min(1).optional(),
    providerVersions: metadataSchema.default({}),
    createdAt: timestampSchema
  })
  .strict();

export type ProcessingRun = z.infer<typeof processingRunSchema>;

export const documentClassificationSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    predictedType: documentTypeSchema,
    confidence: confidenceScoreSchema,
    method: classificationMethodSchema,
    reasons: z.array(z.string().min(1)).default([]),
    rawOutput: metadataSchema.optional(),
    createdAt: timestampSchema
  })
  .strict();

export type DocumentClassification = z.infer<typeof documentClassificationSchema>;

export const documentExtractionSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    schemaName: z.string().min(1),
    schemaVersion: z.string().min(1),
    overallConfidence: confidenceScoreSchema,
    payload: fieldValueSchema.optional(),
    createdAt: timestampSchema
  })
  .strict();

export type DocumentExtraction = z.infer<typeof documentExtractionSchema>;

export const extractedFieldSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    documentExtractionId: entityIdSchema,
    fieldKey: z.string().min(1),
    fieldLabel: z.string().min(1),
    value: fieldValueSchema,
    normalizedText: z.string().optional(),
    confidence: confidenceScoreSchema,
    citations: z.array(sourceCitationSchema).min(1),
    provenance: provenanceSchema,
    createdAt: timestampSchema
  })
  .strict();

export type ExtractedField = z.infer<typeof extractedFieldSchema>;

export const machineExtractionRecordSchema = z
  .object({
    processingRun: processingRunSchema,
    classification: documentClassificationSchema.optional(),
    extraction: documentExtractionSchema,
    fields: z.array(extractedFieldSchema)
  })
  .strict();

export type MachineExtractionRecord = z.infer<typeof machineExtractionRecordSchema>;
