import { z } from "zod";

import { confidenceScoreSchema, entityIdSchema, fieldValueSchema, timestampSchema } from "./common";
import { sourceCitationSchema } from "./extraction";

export const reviewReasons = [
  "low_confidence",
  "missing_required_field",
  "conflicting_values",
  "policy_rule_triggered",
  "ocr_quality_issue"
] as const;

export const reviewReasonSchema = z.enum(reviewReasons);
export type ReviewReason = z.infer<typeof reviewReasonSchema>;

export const reviewPriorities = ["low", "normal", "high", "urgent"] as const;
export const reviewPrioritySchema = z.enum(reviewPriorities);
export type ReviewPriority = z.infer<typeof reviewPrioritySchema>;

export const reviewTaskStatuses = ["open", "in_progress", "follow_up", "resolved", "rejected"] as const;
export const reviewTaskStatusSchema = z.enum(reviewTaskStatuses);
export type ReviewTaskStatus = z.infer<typeof reviewTaskStatusSchema>;

export const reviewActionTypes = ["assign", "comment", "approve", "correct", "needs_follow_up", "reject"] as const;
export const reviewActionTypeSchema = z.enum(reviewActionTypes);
export type ReviewActionType = z.infer<typeof reviewActionTypeSchema>;

export const reviewedFieldStatuses = ["unreviewed", "accepted", "corrected", "rejected"] as const;
export const reviewedFieldStatusSchema = z.enum(reviewedFieldStatuses);
export type ReviewedFieldStatus = z.infer<typeof reviewedFieldStatusSchema>;

export const authoritativeValueSources = ["machine", "human"] as const;
export const authoritativeValueSourceSchema = z.enum(authoritativeValueSources);
export type AuthoritativeValueSource = z.infer<typeof authoritativeValueSourceSchema>;

export const reviewTaskSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    processingRunId: entityIdSchema.optional(),
    reason: reviewReasonSchema,
    priority: reviewPrioritySchema,
    status: reviewTaskStatusSchema,
    assignedToUserId: entityIdSchema.optional(),
    createdAt: timestampSchema,
    completedAt: timestampSchema.optional()
  })
  .strict();

export type ReviewTask = z.infer<typeof reviewTaskSchema>;

export const reviewedFieldValueSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    fieldKey: z.string().min(1),
    fieldLabel: z.string().min(1),
    sourceExtractedFieldId: entityIdSchema.optional(),
    machineValue: fieldValueSchema.optional(),
    machineConfidence: confidenceScoreSchema.optional(),
    authoritativeValue: fieldValueSchema.optional(),
    authoritativeValueSource: authoritativeValueSourceSchema,
    reviewStatus: reviewedFieldStatusSchema,
    reviewerId: entityIdSchema.optional(),
    reviewedAt: timestampSchema.optional(),
    notes: z.string().optional(),
    citations: z.array(sourceCitationSchema).default([])
  })
  .strict();

export type ReviewedFieldValue = z.infer<typeof reviewedFieldValueSchema>;

export const reviewActionSchema = z
  .object({
    id: entityIdSchema,
    reviewTaskId: entityIdSchema,
    documentId: entityIdSchema,
    reviewedFieldValueId: entityIdSchema.optional(),
    userId: entityIdSchema,
    action: reviewActionTypeSchema,
    fieldKey: z.string().min(1).optional(),
    beforeValue: fieldValueSchema.optional(),
    afterValue: fieldValueSchema.optional(),
    notes: z.string().optional(),
    createdAt: timestampSchema
  })
  .strict();

export type ReviewAction = z.infer<typeof reviewActionSchema>;

export const reviewedDocumentRecordSchema = z
  .object({
    reviewTasks: z.array(reviewTaskSchema),
    reviewedFields: z.array(reviewedFieldValueSchema),
    actions: z.array(reviewActionSchema).default([])
  })
  .strict();

export type ReviewedDocumentRecord = z.infer<typeof reviewedDocumentRecordSchema>;
