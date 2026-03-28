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

describe("audit trail flow", () => {
  let app: NestFastifyApplication;
  const storageRoot = join(process.cwd(), "data", "test-audit", randomUUID());

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

  it("persists recent audit events across upload, review, export, and admin settings changes", async () => {
    const apiEnv = getApiEnv();
    const uploadBody = buildMultipartBody(
      "sample-invoice.pdf",
      "application/pdf",
      Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n")
    );

    const uploadResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/documents/upload`,
      payload: uploadBody.body,
      headers: {
        "content-type": `multipart/form-data; boundary=${uploadBody.boundary}`
      }
    });

    expect(uploadResponse.statusCode).toBe(201);
    const uploadPayload = uploadResponse.json();

    const documentAuditResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/audit-events?entityType=document&entityId=${uploadPayload.documentId}`
    });

    expect(documentAuditResponse.statusCode).toBe(200);
    const documentAuditPayload = documentAuditResponse.json();
    expect(documentAuditPayload.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "document.ingested" }),
        expect.objectContaining({ eventType: "document.pipeline_stage_changed" })
      ])
    );

    const queueResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/review-items`
    });

    expect(queueResponse.statusCode).toBe(200);
    const reviewTaskId = queueResponse.json()[0].taskId as string;

    const correctResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}/correct`,
      payload: {
        reviewerId: "reviewer_1",
        notes: "Matched to the signed vendor copy.",
        corrections: [
          {
            fieldKey: "invoice_number",
            authoritativeValue: "INV-5010"
          }
        ]
      }
    });

    expect(correctResponse.statusCode).toBe(201);

    const approveResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}/approve`,
      payload: {
        reviewerId: "reviewer_1",
        notes: "Approved after correction."
      }
    });

    expect(approveResponse.statusCode).toBe(201);

    const settingsResponse = await app.inject({
      method: "PATCH",
      url: `/${apiEnv.API_PREFIX}/admin/settings`,
      payload: {
        actorId: "admin_1",
        reason: "Pilot customer requested watched-folder intake.",
        watchedFolderEnabled: true
      }
    });

    expect(settingsResponse.statusCode).toBe(200);

    const exportResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/exports/csv`,
      payload: {
        requestedByUserId: "admin_1",
        reason: "Weekly accounting extract",
        filter: {
          status: "approved"
        }
      }
    });

    expect(exportResponse.statusCode).toBe(201);

    const recentAuditResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/audit-events?limit=50`
    });

    expect(recentAuditResponse.statusCode).toBe(200);
    const recentAuditPayload = recentAuditResponse.json();
    expect(recentAuditPayload.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "classification.generated" }),
        expect.objectContaining({ eventType: "extraction.generated" }),
        expect.objectContaining({ eventType: "review.corrected", actorId: "reviewer_1" }),
        expect.objectContaining({ eventType: "review.approved", actorId: "reviewer_1" }),
        expect.objectContaining({
          eventType: "admin.settings_changed",
          actorId: "admin_1",
          reason: "Pilot customer requested watched-folder intake.",
          changes: expect.arrayContaining([
            expect.objectContaining({ field: "watchedFolderEnabled", before: false, after: true })
          ])
        }),
        expect.objectContaining({ eventType: "export.requested", actorId: "admin_1" }),
        expect.objectContaining({ eventType: "export.completed", actorId: "admin_1" })
      ])
    );
  });
});
