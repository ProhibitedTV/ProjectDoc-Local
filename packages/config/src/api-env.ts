import { z } from "zod";

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().min(1).default("api"),
  DATABASE_URL: z.string().min(1).default("postgresql://projectdoc:projectdoc@localhost:5432/projectdoc_local"),
  STORAGE_ROOT: z.string().min(1).default("./data/storage"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  MODEL_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  MODEL_NAME: z.string().min(1).default("llama3.1:8b"),
  AUDIT_LOG_LEVEL: z.enum(["info", "debug"]).default("info")
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export const loadApiEnv = (raw: Record<string, string | undefined>): ApiEnv => apiEnvSchema.parse(raw);
