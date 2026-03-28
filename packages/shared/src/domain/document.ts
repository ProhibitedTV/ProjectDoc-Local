import { z } from "zod";

import { confidenceScoreSchema, entityIdSchema, metadataSchema, timestampSchema } from "./common";

export const documentTypes = [
  "certificate_of_insurance",
  "invoice",
  "change_order",
  "lien_waiver",
  "permit",
  "contract",
  "inspection_report",
  "unknown"
] as const;

export const documentTypeSchema = z.enum(documentTypes);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const documentSourceTypes = ["upload", "watched_folder", "service_endpoint"] as const;
export const documentSourceTypeSchema = z.enum(documentSourceTypes);
export type DocumentSourceType = z.infer<typeof documentSourceTypeSchema>;

export const documentLifecycleStatuses = [
  "ingested",
  "processing",
  "classified",
  "extracted",
  "needs_review",
  "approved",
  "rejected",
  "exported",
  "failed"
] as const;

export const documentLifecycleStatusSchema = z.enum(documentLifecycleStatuses);
export type DocumentLifecycleStatus = z.infer<typeof documentLifecycleStatusSchema>;

export const documentFileKinds = [
  "original",
  "ocr_pdf",
  "preview_image",
  "derived_text",
  "export_csv"
] as const;

export const documentFileKindSchema = z.enum(documentFileKinds);
export type DocumentFileKind = z.infer<typeof documentFileKindSchema>;

export const documentSchema = z
  .object({
    id: entityIdSchema,
    projectId: entityIdSchema.optional(),
    counterpartyId: entityIdSchema.optional(),
    sourceType: documentSourceTypeSchema,
    sourceRef: z.string().min(1).optional(),
    originalFilename: z.string().min(1),
    mimeType: z.string().min(1),
    sha256: z.string().min(1).optional(),
    documentType: documentTypeSchema,
    status: documentLifecycleStatusSchema,
    needsReview: z.boolean(),
    receivedAt: timestampSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema.optional(),
    tags: z.array(z.string().min(1)).default([]),
    metadata: metadataSchema.default({})
  })
  .strict();

export type Document = z.infer<typeof documentSchema>;

export const documentFileSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    kind: documentFileKindSchema,
    storagePath: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    mimeType: z.string().min(1),
    sha256: z.string().min(1).optional(),
    createdAt: timestampSchema
  })
  .strict();

export type DocumentFile = z.infer<typeof documentFileSchema>;

export const documentPageSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    pageNumber: z.number().int().positive(),
    textContent: z.string().default(""),
    ocrConfidence: confidenceScoreSchema.optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    imagePath: z.string().min(1).optional(),
    createdAt: timestampSchema
  })
  .strict();

export type DocumentPage = z.infer<typeof documentPageSchema>;

export const documentSummarySchema = z
  .object({
    id: entityIdSchema,
    type: documentTypeSchema,
    status: documentLifecycleStatusSchema,
    sourceType: documentSourceTypeSchema,
    filename: z.string().min(1),
    projectId: entityIdSchema.optional(),
    receivedAt: timestampSchema
  })
  .strict();

export type DocumentSummary = z.infer<typeof documentSummarySchema>;
