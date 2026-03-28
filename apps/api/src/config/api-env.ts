import { loadApiEnv } from "@projectdoc/config";

export const getApiEnv = () => loadApiEnv(process.env);
