import { z } from "zod";

const webEnvSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default("ProjectDoc Local"),
  VITE_API_BASE_URL: z.string().min(1).default("/api")
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const loadWebEnv = (raw: Record<string, string | undefined>): WebEnv => webEnvSchema.parse(raw);
