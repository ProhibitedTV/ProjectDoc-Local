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

describe("review queue flow", () => {
  let app: NestFastifyApplication;
  const storageRoot = join(process.cwd(), "data", "test-review", randomUUID());

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

  it("lists seeded review items and preserves corrections, follow-up, and approval actions", async () => {
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

    const queueResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/review-items`
    });

    expect(queueResponse.statusCode).toBe(200);
    const queuePayload = queueResponse.json();
    expect(queuePayload).toHaveLength(1);
    expect(queuePayload[0]).toMatchObject({
      documentId: uploadPayload.documentId,
      originalFilename: "sample-invoice.pdf",
      predictedDocumentType: "invoice",
      reviewStatus: "open"
    });

    const reviewTaskId = queuePayload[0].taskId as string;

    const detailResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}`
    });

    expect(detailResponse.statusCode).toBe(200);
    const detailPayload = detailResponse.json();
    expect(detailPayload.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: "invoice_number"
        })
      ])
    );

    const correctResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}/correct`,
      payload: {
        reviewerId: "reviewer_1",
        notes: "Confirmed against the vendor copy.",
        corrections: [
          {
            fieldKey: "invoice_number",
            authoritativeValue: "INV-9001"
          }
        ]
      }
    });

    expect(correctResponse.statusCode).toBe(201);
    const correctedPayload = correctResponse.json();
    expect(correctedPayload.task.status).toBe("in_progress");
    expect(correctedPayload.fields.find((field: { fieldKey: string }) => field.fieldKey === "invoice_number")).toMatchObject({
      authoritativeValue: "INV-9001",
      authoritativeValueSource: "human",
      reviewStatus: "corrected"
    });

    const followUpResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}/follow-up`,
      payload: {
        reviewerId: "reviewer_1",
        notes: "Need the signed backup from the subcontractor."
      }
    });

    expect(followUpResponse.statusCode).toBe(201);
    expect(followUpResponse.json().task.status).toBe("follow_up");

    const approveResponse = await app.inject({
      method: "POST",
      url: `/${apiEnv.API_PREFIX}/review-items/${reviewTaskId}/approve`,
      payload: {
        reviewerId: "reviewer_1",
        notes: "Approved after correction."
      }
    });

    expect(approveResponse.statusCode).toBe(201);
    const approvedPayload = approveResponse.json();
    expect(approvedPayload.task.status).toBe("resolved");
    expect(approvedPayload.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "approve" }),
        expect.objectContaining({ action: "correct" }),
        expect.objectContaining({ action: "needs_follow_up" })
      ])
    );
    expect(approvedPayload.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "review.approved" }),
        expect.objectContaining({ eventType: "review.corrected" }),
        expect.objectContaining({ eventType: "review.follow_up_requested" })
      ])
    );

    const documentResponse = await app.inject({
      method: "GET",
      url: `/${apiEnv.API_PREFIX}/documents/${uploadPayload.documentId}`
    });

    expect(documentResponse.statusCode).toBe(200);
    expect(documentResponse.json().document).toMatchObject({
      status: "approved",
      needsReview: false,
      documentType: "invoice"
    });
  });
});
