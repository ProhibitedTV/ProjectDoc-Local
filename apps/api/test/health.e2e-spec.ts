import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";

import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { getApiEnv } from "../src/config/api-env";

describe("health route", () => {
  let app: NestFastifyApplication;
  const storageRoot = join(process.cwd(), "data", "test-health", randomUUID());

  beforeAll(async () => {
    process.env.STORAGE_ROOT = storageRoot;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  it("returns the API health payload", async () => {
    const apiEnv = getApiEnv();
    const response = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/health`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "api"
    });
  });
});
