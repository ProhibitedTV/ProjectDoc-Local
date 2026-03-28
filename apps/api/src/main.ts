import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";

import { configureApp } from "./app.setup";
import { getApiEnv } from "./config/api-env";
import { AppModule } from "./app.module";

async function bootstrap() {
  const apiEnv = getApiEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: apiEnv.NODE_ENV !== "test"
    })
  );

  await configureApp(app);

  await app.listen({
    host: apiEnv.API_HOST,
    port: apiEnv.API_PORT
  });

  const logger = new Logger("Bootstrap");
  logger.log(`API ready at http://${apiEnv.API_HOST}:${apiEnv.API_PORT}/${apiEnv.API_PREFIX}`);
}

void bootstrap();
