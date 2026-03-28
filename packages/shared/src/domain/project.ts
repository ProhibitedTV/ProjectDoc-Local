import { z } from "zod";

import { entityIdSchema, metadataSchema, timestampSchema } from "./common";

export const projectStatuses = ["active", "on_hold", "closed", "archived"] as const;
export const projectStatusSchema = z.enum(projectStatuses);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z
  .object({
    id: entityIdSchema,
    projectCode: z.string().min(1),
    projectName: z.string().min(1),
    status: projectStatusSchema,
    customerName: z.string().min(1).optional(),
    externalRef: z.string().min(1).optional(),
    metadata: metadataSchema.default({}),
    createdAt: timestampSchema,
    updatedAt: timestampSchema.optional()
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
