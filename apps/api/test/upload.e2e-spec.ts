import { randomUUID } from "node:crypto";
import { access, rm } from "node:fs/promises";
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

describe("document upload flow", () => {
  let app: NestFastifyApplication;
  const storageRoot = join(process.cwd(), "data", "test-upload", randomUUID());

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

  it("stores an uploaded file, creates a document record, and returns queued stages", async () => {
    const apiEnv = getApiEnv();
    const multipart = buildMultipartBody(
      "sample-invoice.pdf",
      "application/pdf",
      Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n")
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
    expect(uploadPayload.documentStatus).toBe("processing");
    expect(uploadPayload.mimeType).toBe("application/pdf");
    expect(uploadPayload.pipelineStages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "storage", status: "completed" }),
        expect.objectContaining({ stage: "ocr", status: "queued" }),
        expect.objectContaining({ stage: "classification", status: "pending" }),
        expect.objectContaining({ stage: "extraction", status: "pending" })
      ])
    );

    const recordResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/documents/${uploadPayload.documentId}`
    });

    expect(recordResponse.statusCode).toBe(200);

    const recordPayload = recordResponse.json();
    expect(recordPayload.document.originalFilename).toBe("sample-invoice.pdf");
    expect(recordPayload.document.status).toBe("processing");
    expect(recordPayload.files).toHaveLength(1);
    expect(recordPayload.processingRun.status).toBe("queued");

    const storedFilePath = join(storageRoot, recordPayload.files[0].storagePath);
    await expect(access(storedFilePath)).resolves.toBeUndefined();
  });

  it("rejects unsupported file types clearly", async () => {
    const apiEnv = getApiEnv();
    const multipart = buildMultipartBody(
      "script.exe",
      "application/octet-stream",
      Buffer.from("MZP")
    );

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/documents/upload`,
      payload: multipart.body,
      headers: {
        "content-type": `multipart/form-data; boundary=${multipart.boundary}`
      }
    });

    expect(uploadResponse.statusCode).toBe(415);
    expect(uploadResponse.json()).toMatchObject({
      message: expect.stringContaining("Unsupported upload type")
    });
  });
});
