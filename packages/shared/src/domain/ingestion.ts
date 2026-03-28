import { z } from "zod";

import { entityIdSchema, timestampSchema } from "./common";
import {
  documentFileSchema,
  documentLifecycleStatusSchema,
  documentSchema,
  type DocumentLifecycleStatus
} from "./document";
import { processingRunSchema } from "./extraction";

export const documentPipelineStageNames = ["storage", "ocr", "classification", "extraction"] as const;
export const documentPipelineStageNameSchema = z.enum(documentPipelineStageNames);
export type DocumentPipelineStageName = z.infer<typeof documentPipelineStageNameSchema>;

export const documentPipelineStageStatuses = ["pending", "queued", "running", "completed", "failed"] as const;
export const documentPipelineStageStatusSchema = z.enum(documentPipelineStageStatuses);
export type DocumentPipelineStageStatus = z.infer<typeof documentPipelineStageStatusSchema>;

export const documentPipelineStageSchema = z
  .object({
    stage: documentPipelineStageNameSchema,
    status: documentPipelineStageStatusSchema,
    message: z.string().min(1).optional(),
    updatedAt: timestampSchema
  })
  .strict();

export type DocumentPipelineStage = z.infer<typeof documentPipelineStageSchema>;

export const documentIngestionRecordSchema = z
  .object({
    document: documentSchema,
    files: z.array(documentFileSchema),
    processingRun: processingRunSchema,
    pipelineStages: z.array(documentPipelineStageSchema),
    lastError: z
      .object({
        code: z.string().min(1).optional(),
        message: z.string().min(1),
        stage: documentPipelineStageNameSchema.optional(),
        occurredAt: timestampSchema
      })
      .strict()
      .optional()
  })
  .strict();

export type DocumentIngestionRecord = z.infer<typeof documentIngestionRecordSchema>;

export const documentUploadResponseSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    documentStatus: documentLifecycleStatusSchema,
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    message: z.string().min(1),
    pipelineStages: z.array(documentPipelineStageSchema)
  })
  .strict();

export type DocumentUploadResponse = z.infer<typeof documentUploadResponseSchema>;

export const documentStatusTransitionMap: Record<DocumentLifecycleStatus, readonly DocumentLifecycleStatus[]> = {
  ingested: ["processing", "failed"],
  processing: ["classified", "failed"],
  classified: ["extracted", "needs_review", "failed"],
  extracted: ["needs_review", "approved", "failed"],
  needs_review: ["approved", "rejected", "failed"],
  approved: ["exported"],
  rejected: [],
  exported: [],
  failed: ["processing"]
} as const;

export const canTransitionDocumentStatus = (
  from: DocumentLifecycleStatus,
  to: DocumentLifecycleStatus
): boolean => documentStatusTransitionMap[from].includes(to);
