import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";

import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { getApiEnv } from "../src/config/api-env";

const buildMultipartBody = (fileName: string, contentType: string, payload: Buffer) => {
  const boundary = `----projectdoc-${randomUUID()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    boundary,
    body: Buffer.concat([head, payload, tail])
  };
};

describe("search flow", () => {
  let app: NestFastifyApplication;
  const storageRoot = join(process.cwd(), "data", "test-search", randomUUID());

  beforeAll(async () => {
    process.env.STORAGE_ROOT = storageRoot;
    process.env.UPLOAD_MAX_BYTES = String(10 * 1024 * 1024);

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

  it("searches local sections with filters and returns traceable document detail", async () => {
    const apiEnv = getApiEnv();
    const multipart = buildMultipartBody(
      "permit-notes.txt",
      "text/plain",
      Buffer.from(
        "Permit Number: PERM-7781\nApplicant Name: ACME Electrical LLC\nExpiration Date: 2026-09-10\n"
      )
    );

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/documents/upload`,
      payload: multipart.body,
      headers: {
        "content-type": `multipart/form-data; boundary=${multipart.boundary}`
      }
    });

    expect(uploadResponse.statusCode).toBe(201);
    const uploadPayload = uploadResponse.json();

    const searchResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/search?query=permit&documentType=permit&status=processing`
    });

    expect(searchResponse.statusCode).toBe(200);
    const searchPayload = searchResponse.json();
    expect(searchPayload.totalResults).toBeGreaterThan(0);
    expect(searchPayload.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          documentId: uploadPayload.documentId,
          originalFilename: "permit-notes.txt",
          documentType: "permit",
          status: "processing",
          pageNumber: 1
        })
      ])
    );

    const detailResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/search/documents/${uploadPayload.documentId}`
    });

    expect(detailResponse.statusCode).toBe(200);
    const detailPayload = detailResponse.json();
    expect(detailPayload).toMatchObject({
      documentId: uploadPayload.documentId,
      originalFilename: "permit-notes.txt",
      documentType: "permit",
      status: "processing"
    });
    expect(detailPayload.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "source_text",
          pageNumber: 1
        }),
        expect.objectContaining({
          source: "classification"
        }),
        expect.objectContaining({
          source: "extracted_field"
        })
      ])
    );
  });
});
