export type HealthCheckResponse = {
  status: "ok";
  service: "api";
  version: string;
  environment: string;
  timestamp: string;
};
