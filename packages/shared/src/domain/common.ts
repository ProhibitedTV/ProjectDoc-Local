import { z } from "zod";

export const entityIdSchema = z.string().min(1);
export type EntityId = z.infer<typeof entityIdSchema>;

export const timestampSchema = z.string().datetime({ offset: true });
export type Timestamp = z.infer<typeof timestampSchema>;

export const confidenceScoreSchema = z.number().min(0).max(1);
export type ConfidenceScore = z.infer<typeof confidenceScoreSchema>;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)])
);

export const metadataSchema = z.record(jsonValueSchema);
export type Metadata = z.infer<typeof metadataSchema>;

export const fieldValueSchema = jsonValueSchema;
export type FieldValue = z.infer<typeof fieldValueSchema>;

export const boundingBoxSchema = z
  .object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive()
  })
  .strict();

export type BoundingBox = z.infer<typeof boundingBoxSchema>;
