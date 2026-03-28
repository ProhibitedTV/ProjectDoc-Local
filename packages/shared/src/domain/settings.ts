import { z } from "zod";

import { confidenceScoreSchema, entityIdSchema, timestampSchema } from "./common";
import { exportFormatSchema } from "./export";

export const appSettingsSchema = z
  .object({
    id: z.literal("instance"),
    reviewConfidenceThreshold: confidenceScoreSchema,
    watchedFolderEnabled: z.boolean(),
    defaultExportFormat: exportFormatSchema,
    updatedAt: timestampSchema
  })
  .strict();

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const updateAppSettingsRequestSchema = z
  .object({
    actorId: entityIdSchema,
    reason: z.string().min(1),
    reviewConfidenceThreshold: confidenceScoreSchema.optional(),
    watchedFolderEnabled: z.boolean().optional(),
    defaultExportFormat: exportFormatSchema.optional()
  })
  .strict()
  .refine(
    (value) =>
      value.reviewConfidenceThreshold !== undefined ||
      value.watchedFolderEnabled !== undefined ||
      value.defaultExportFormat !== undefined,
    {
      message: "At least one settings field must be provided."
    }
  );

export type UpdateAppSettingsRequest = z.infer<typeof updateAppSettingsRequestSchema>;
