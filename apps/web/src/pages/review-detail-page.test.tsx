import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { ReviewDetailPageContent } from "./review-detail-page";

const fetchReviewItemMock = vi.fn();
const approveReviewItemMock = vi.fn();
const correctReviewItemMock = vi.fn();
const markReviewItemNeedsFollowUpMock = vi.fn();

const reviewDetailFixture = {
  task: {
    id: "task_1",
    documentId: "doc_1",
    processingRunId: "run_1",
    reason: "missing_required_field",
    priority: "high",
    status: "open",
    createdAt: "2026-03-28T12:00:00.000Z"
  },
  document: {
    id: "doc_1",
    originalFilename: "sample-invoice.pdf",
    mimeType: "application/pdf",
    sourceType: "upload",
    status: "needs_review",
    needsReview: true,
    receivedAt: "2026-03-28T12:00:00.000Z",
    updatedAt: "2026-03-28T12:05:00.000Z",
    metadata: {},
    pipelineStages: [
      {
        stage: "classification",
        status: "completed",
        message: "Stub classification output prepared for review queue development.",
        updatedAt: "2026-03-28T12:05:00.000Z"
      }
    ],
    fileCount: 1
  },
  classification: {
    documentId: "doc_1",
    processingRunId: "run_1",
    documentType: "invoice",
    confidence: 0.74,
    method: "review_queue_stub",
    reasons: ["Filename and stub analysis suggest Invoice."],
    candidates: [
      {
        documentType: "invoice",
        confidence: 0.74,
        matchedSignals: ["invoice"],
        citations: [
          {
            documentId: "doc_1",
            pageNumber: 1,
            excerpt: "sample-invoice.pdf suggests Invoice."
          }
        ]
      }
    ],
    reviewRecommended: true,
    reviewReasons: ["low_confidence"],
    provenance: {
      processingRunId: "run_1",
      provider: "api-review-fixture",
      providerVersion: "0.1.0",
      method: "filename_template_stub",
      createdAt: "2026-03-28T12:05:00.000Z"
    },
    createdAt: "2026-03-28T12:05:00.000Z"
  },
  extraction: {
    documentId: "doc_1",
    processingRunId: "run_1",
    documentType: "invoice",
    schemaName: "invoice.review_queue_stub",
    schemaVersion: "0.1.0",
    overallConfidence: 0.68,
    reviewRecommended: true,
    reviewReasons: ["missing_required_field"],
    missingRequiredFieldKeys: ["invoice_number"],
    warnings: ["Machine output is currently stubbed for review workflow development."],
    fields: [
      {
        fieldKey: "invoice_number",
        label: "Invoice Number",
        valueType: "identifier",
        required: true,
        value: null,
        confidence: 0.32,
        reviewRecommended: true,
        reviewReasons: ["missing_required_field"],
        citations: [
          {
            documentId: "doc_1",
            pageNumber: 1,
            excerpt: "Invoice Number: review required"
          }
        ],
        provenance: {
          processingRunId: "run_1",
          provider: "api-review-fixture",
          providerVersion: "0.1.0",
          method: "template_field_stub",
          createdAt: "2026-03-28T12:05:00.000Z"
        }
      }
    ],
    provenance: {
      processingRunId: "run_1",
      provider: "api-review-fixture",
      providerVersion: "0.1.0",
      method: "template_extraction_stub",
      createdAt: "2026-03-28T12:05:00.000Z"
    },
    createdAt: "2026-03-28T12:05:00.000Z"
  },
  fields: [
    {
      fieldKey: "invoice_number",
      label: "Invoice Number",
      description: "Invoice identifier from the vendor.",
      valueType: "identifier",
      required: true,
      machineValue: null,
      machineConfidence: 0.32,
      machineReviewRecommended: true,
      machineReviewReasons: ["missing_required_field"],
      authoritativeValue: null,
      authoritativeValueSource: "machine",
      reviewStatus: "unreviewed",
      citations: [
        {
          documentId: "doc_1",
          pageNumber: 1,
          excerpt: "Invoice Number: review required"
        }
      ],
      provenance: {
        processingRunId: "run_1",
        provider: "api-review-fixture",
        providerVersion: "0.1.0",
        method: "template_field_stub",
        createdAt: "2026-03-28T12:05:00.000Z"
      }
    }
  ],
  actions: [],
  auditEvents: []
};

vi.mock("../lib/api-client", () => ({
  fetchReviewItem: (reviewTaskId: string) => fetchReviewItemMock(reviewTaskId),
  approveReviewItem: (reviewTaskId: string, payload: unknown) => approveReviewItemMock(reviewTaskId, payload),
  correctReviewItem: (reviewTaskId: string, payload: unknown) => correctReviewItemMock(reviewTaskId, payload),
  markReviewItemNeedsFollowUp: (reviewTaskId: string, payload: unknown) =>
    markReviewItemNeedsFollowUpMock(reviewTaskId, payload)
}));

describe("ReviewDetailPageContent", () => {
  it("shows machine vs authoritative values and submits corrections explicitly", async () => {
    fetchReviewItemMock.mockResolvedValue(reviewDetailFixture);
    correctReviewItemMock.mockResolvedValue(reviewDetailFixture);

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <ReviewDetailPageContent reviewTaskId="task_1" />
        </QueryClientProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("sample-invoice.pdf")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Authoritative value"), {
      target: {
        value: "INV-2001"
      }
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Corrections" }));

    await waitFor(() => {
      expect(correctReviewItemMock).toHaveBeenCalledWith(
        "task_1",
        expect.objectContaining({
          reviewerId: "local-reviewer",
          corrections: [
            {
              fieldKey: "invoice_number",
              authoritativeValue: "INV-2001"
            }
          ]
        })
      );
    });

    expect(screen.getByText("Machine proposal")).toBeInTheDocument();
    expect(screen.getByText("Authoritative value")).toBeInTheDocument();
  });
});
