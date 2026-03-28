import { z } from "zod";

import { auditEventSchema } from "./audit";
import { fieldValueSchema, metadataSchema, timestampSchema } from "./common";
import { classificationOutputSchema, extractionOutputSchema, extractionFieldValueTypeSchema } from "./document-analysis";
import { documentLifecycleStatusSchema, documentSourceTypeSchema } from "./document";
import { documentPipelineStageSchema } from "./ingestion";
import {
  authoritativeValueSourceSchema,
  reviewActionSchema,
  reviewedFieldStatusSchema,
  reviewedFieldValueSchema,
  reviewPrioritySchema,
  reviewReasonSchema,
  reviewTaskSchema,
  reviewTaskStatusSchema
} from "./review";
import { provenanceSchema, sourceCitationSchema } from "./extraction";

export const reviewDocumentContextSchema = z
  .object({
    id: z.string().min(1),
    originalFilename: z.string().min(1),
    mimeType: z.string().min(1),
    sourceType: documentSourceTypeSchema,
    status: documentLifecycleStatusSchema,
    needsReview: z.boolean(),
    receivedAt: timestampSchema,
    updatedAt: timestampSchema.optional(),
    metadata: metadataSchema.default({}),
    pipelineStages: z.array(documentPipelineStageSchema).default([]),
    fileCount: z.number().int().nonnegative().default(0)
  })
  .strict();

export type ReviewDocumentContext = z.infer<typeof reviewDocumentContextSchema>;

export const reviewFieldViewSchema = z
  .object({
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    valueType: extractionFieldValueTypeSchema,
    required: z.boolean(),
    sourceExtractedFieldId: z.string().min(1).optional(),
    machineValue: fieldValueSchema.nullable(),
    machineNormalizedText: z.string().optional(),
    machineConfidence: z.number().min(0).max(1),
    machineReviewRecommended: z.boolean(),
    machineReviewReasons: z.array(reviewReasonSchema).default([]),
    authoritativeValue: fieldValueSchema.nullable(),
    authoritativeValueSource: authoritativeValueSourceSchema,
    reviewStatus: reviewedFieldStatusSchema,
    reviewerId: z.string().min(1).optional(),
    reviewedAt: timestampSchema.optional(),
    notes: z.string().optional(),
    citations: z.array(sourceCitationSchema).default([]),
    provenance: provenanceSchema
  })
  .strict();

export type ReviewFieldView = z.infer<typeof reviewFieldViewSchema>;

export const reviewQueueItemSchema = z
  .object({
    taskId: z.string().min(1),
    documentId: z.string().min(1),
    originalFilename: z.string().min(1),
    documentStatus: documentLifecycleStatusSchema,
    reviewStatus: reviewTaskStatusSchema,
    priority: reviewPrioritySchema,
    reason: reviewReasonSchema,
    predictedDocumentType: classificationOutputSchema.shape.documentType,
    classificationConfidence: z.number().min(0).max(1),
    extractionConfidence: z.number().min(0).max(1),
    requiredFieldCount: z.number().int().nonnegative(),
    correctedFieldCount: z.number().int().nonnegative(),
    unresolvedFieldCount: z.number().int().nonnegative(),
    reviewRecommended: z.boolean(),
    receivedAt: timestampSchema,
    updatedAt: timestampSchema
  })
  .strict();

export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;

export const reviewItemRecordSchema = z
  .object({
    task: reviewTaskSchema,
    classification: classificationOutputSchema,
    extraction: extractionOutputSchema,
    reviewedFields: z.array(reviewedFieldValueSchema),
    actions: z.array(reviewActionSchema).default([]),
    auditEvents: z.array(auditEventSchema).default([]),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
  })
  .strict();

export type ReviewItemRecord = z.infer<typeof reviewItemRecordSchema>;

export const reviewItemDetailSchema = z
  .object({
    task: reviewTaskSchema,
    document: reviewDocumentContextSchema,
    classification: classificationOutputSchema,
    extraction: extractionOutputSchema,
    fields: z.array(reviewFieldViewSchema),
    actions: z.array(reviewActionSchema),
    auditEvents: z.array(auditEventSchema)
  })
  .strict();

export type ReviewItemDetail = z.infer<typeof reviewItemDetailSchema>;

export const approveReviewItemRequestSchema = z
  .object({
    reviewerId: z.string().min(1),
    notes: z.string().min(1).optional()
  })
  .strict();

export type ApproveReviewItemRequest = z.infer<typeof approveReviewItemRequestSchema>;

export const reviewCorrectionSchema = z
  .object({
    fieldKey: z.string().min(1),
    authoritativeValue: fieldValueSchema.nullable(),
    notes: z.string().min(1).optional()
  })
  .strict();

export type ReviewCorrection = z.infer<typeof reviewCorrectionSchema>;

export const correctReviewItemRequestSchema = z
  .object({
    reviewerId: z.string().min(1),
    notes: z.string().min(1).optional(),
    corrections: z.array(reviewCorrectionSchema).min(1)
  })
  .strict();

export type CorrectReviewItemRequest = z.infer<typeof correctReviewItemRequestSchema>;

export const followUpReviewItemRequestSchema = z
  .object({
    reviewerId: z.string().min(1),
    notes: z.string().min(1),
    fieldKeys: z.array(z.string().min(1)).default([])
  })
  .strict();

export type FollowUpReviewItemRequest = z.infer<typeof followUpReviewItemRequestSchema>;
