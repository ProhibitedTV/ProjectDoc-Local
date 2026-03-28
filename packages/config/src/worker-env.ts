import { z } from "zod";

const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://projectdoc:projectdoc@localhost:5432/projectdoc_local"),
  STORAGE_ROOT: z.string().min(1).default("./data/storage"),
  WATCH_ROOT: z.string().min(1).default("./data/watch"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(10000),
  MODEL_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  MODEL_NAME: z.string().min(1).default("llama3.1:8b"),
  AUDIT_LOG_LEVEL: z.enum(["info", "debug"]).default("info")
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export const loadWorkerEnv = (raw: Record<string, string | undefined>): WorkerEnv =>
  workerEnvSchema.parse(raw);
