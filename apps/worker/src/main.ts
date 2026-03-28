import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { WorkerBootstrapService } from "./worker-bootstrap.service";
import { WorkerModule } from "./worker.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ["error", "warn", "log", "debug"]
  });

  app.get(WorkerBootstrapService).start();
  Logger.log("Worker context bootstrapped.", "Bootstrap");
}

void bootstrap();
