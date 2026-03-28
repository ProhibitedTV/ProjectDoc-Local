import { Injectable } from "@nestjs/common";
import type { HealthCheckResponse } from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class HealthService {
  getStatus(): HealthCheckResponse {
    const apiEnv = getApiEnv();

    return {
      status: "ok",
      service: "api",
      version: "0.1.0",
      environment: apiEnv.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }
}
