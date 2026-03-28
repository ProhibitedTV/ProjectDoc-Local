import { z } from "zod";

import { entityIdSchema, timestampSchema } from "./common";

export const userRoles = ["admin", "reviewer", "operator"] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatuses = ["invited", "active", "disabled"] as const;
export const userStatusSchema = z.enum(userStatuses);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userSchema = z
  .object({
    id: entityIdSchema,
    email: z.string().email(),
    displayName: z.string().min(1),
    role: userRoleSchema,
    status: userStatusSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema.optional(),
    lastLoginAt: timestampSchema.optional()
  })
  .strict();

export type User = z.infer<typeof userSchema>;
