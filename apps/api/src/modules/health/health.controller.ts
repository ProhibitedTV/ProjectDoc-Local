import { Controller, Get } from "@nestjs/common";
import type { HealthCheckResponse } from "@projectdoc/shared";

import { HealthService } from "./health.service";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  getStatus(): HealthCheckResponse {
    return this.healthService.getStatus();
  }
}
