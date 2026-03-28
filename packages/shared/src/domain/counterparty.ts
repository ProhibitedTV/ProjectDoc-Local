import { z } from "zod";

import { entityIdSchema, metadataSchema, timestampSchema } from "./common";

export const counterpartyTypes = [
  "vendor",
  "subcontractor",
  "carrier",
  "customer",
  "inspector",
  "other"
] as const;

export const counterpartyTypeSchema = z.enum(counterpartyTypes);
export type CounterpartyType = z.infer<typeof counterpartyTypeSchema>;

export const counterpartySchema = z
  .object({
    id: entityIdSchema,
    name: z.string().min(1),
    type: counterpartyTypeSchema,
    externalRef: z.string().min(1).optional(),
    metadata: metadataSchema.default({}),
    createdAt: timestampSchema,
    updatedAt: timestampSchema.optional()
  })
  .strict();

export type Counterparty = z.infer<typeof counterpartySchema>;
