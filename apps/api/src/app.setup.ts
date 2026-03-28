import multipart from "@fastify/multipart";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { getApiEnv } from "./config/api-env";

export async function configureApp(app: NestFastifyApplication) {
  const apiEnv = getApiEnv();

  await app.register(multipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: apiEnv.UPLOAD_MAX_BYTES
    }
  });

  app.enableCors();
  app.setGlobalPrefix(apiEnv.API_PREFIX);
}
