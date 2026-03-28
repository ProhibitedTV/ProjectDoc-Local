import { z } from "zod";

import { entityIdSchema, jsonValueSchema, metadataSchema, timestampSchema } from "./common";

export const auditActorTypes = ["system", "user"] as const;
export const auditActorTypeSchema = z.enum(auditActorTypes);
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export const auditEntityTypes = [
  "project",
  "counterparty",
  "document",
  "processing_run",
  "document_classification",
  "document_extraction",
  "extracted_field",
  "review_task",
  "reviewed_field_value",
  "user",
  "export_job",
  "system_config"
] as const;

export const auditEntityTypeSchema = z.enum(auditEntityTypes);
export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>;

export const auditEventTypes = [
  "document.ingested",
  "document.pipeline_stage_changed",
  "document.flagged_for_review",
  "document.approved",
  "classification.generated",
  "extraction.generated",
  "review.approved",
  "review.corrected",
  "review.follow_up_requested",
  "export.requested",
  "export.completed",
  "export.failed",
  "admin.settings_changed"
] as const;

export const auditEventTypeSchema = z.enum(auditEventTypes);
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;

export const auditEntityReferenceSchema = z
  .object({
    entityType: auditEntityTypeSchema,
    entityId: entityIdSchema,
    label: z.string().min(1).optional()
  })
  .strict();

export type AuditEntityReference = z.infer<typeof auditEntityReferenceSchema>;

export const auditChangeSchema = z
  .object({
    field: z.string().min(1),
    before: jsonValueSchema.optional(),
    after: jsonValueSchema.optional()
  })
  .strict();

export type AuditChange = z.infer<typeof auditChangeSchema>;

export const auditEventSchema = z
  .object({
    id: entityIdSchema,
    eventType: auditEventTypeSchema,
    entityType: auditEntityTypeSchema,
    entityId: entityIdSchema,
    actorType: auditActorTypeSchema,
    actorId: entityIdSchema.optional(),
    requestId: z.string().min(1).optional(),
    occurredAt: timestampSchema,
    summary: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
    changes: z.array(auditChangeSchema).default([]),
    relatedEntities: z.array(auditEntityReferenceSchema).default([]),
    metadata: metadataSchema.default({})
  })
  .strict();

export type AuditEvent = z.infer<typeof auditEventSchema>;

export const auditEventListFiltersSchema = z
  .object({
    limit: z.number().int().positive().max(200).default(25),
    eventType: auditEventTypeSchema.optional(),
    entityType: auditEntityTypeSchema.optional(),
    entityId: entityIdSchema.optional(),
    actorId: entityIdSchema.optional()
  })
  .strict();

export type AuditEventListFilters = z.infer<typeof auditEventListFiltersSchema>;

export const auditEventListResponseSchema = z
  .object({
    total: z.number().int().nonnegative(),
    events: z.array(auditEventSchema)
  })
  .strict();

export type AuditEventListResponse = z.infer<typeof auditEventListResponseSchema>;
