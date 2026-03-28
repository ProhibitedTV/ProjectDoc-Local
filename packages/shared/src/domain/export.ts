import { z } from "zod";

import { entityIdSchema, metadataSchema, timestampSchema } from "./common";

export const exportFormats = ["csv"] as const;
export const exportFormatSchema = z.enum(exportFormats);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportStatuses = ["queued", "running", "completed", "failed"] as const;
export const exportStatusSchema = z.enum(exportStatuses);
export type ExportStatus = z.infer<typeof exportStatusSchema>;

export const exportJobSchema = z
  .object({
    id: entityIdSchema,
    requestedByUserId: entityIdSchema,
    format: exportFormatSchema,
    status: exportStatusSchema,
    filter: metadataSchema.default({}),
    outputPath: z.string().min(1).optional(),
    rowCount: z.number().int().nonnegative().optional(),
    createdAt: timestampSchema,
    completedAt: timestampSchema.optional()
  })
  .strict();

export type ExportJob = z.infer<typeof exportJobSchema>;

export const createExportJobRequestSchema = z
  .object({
    requestedByUserId: entityIdSchema,
    filter: metadataSchema.default({}),
    reason: z.string().min(1).optional()
  })
  .strict();

export type CreateExportJobRequest = z.infer<typeof createExportJobRequestSchema>;
