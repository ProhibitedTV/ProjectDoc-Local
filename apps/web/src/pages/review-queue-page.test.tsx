import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { ReviewQueuePage } from "./review-queue-page";

const fetchReviewQueueMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  fetchReviewQueue: () => fetchReviewQueueMock()
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

describe("ReviewQueuePage", () => {
  it("renders active review items with confidence and counts", async () => {
    fetchReviewQueueMock.mockResolvedValue([
      {
        taskId: "task_1",
        documentId: "doc_1",
        originalFilename: "sample-invoice.pdf",
        documentStatus: "needs_review",
        reviewStatus: "open",
        priority: "high",
        reason: "missing_required_field",
        predictedDocumentType: "invoice",
        classificationConfidence: 0.74,
        extractionConfidence: 0.68,
        requiredFieldCount: 4,
        correctedFieldCount: 1,
        unresolvedFieldCount: 2,
        reviewRecommended: true,
        receivedAt: "2026-03-28T12:00:00.000Z",
        updatedAt: "2026-03-28T12:10:00.000Z"
      }
    ]);

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <ReviewQueuePage />
        </QueryClientProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("sample-invoice.pdf")).toBeInTheDocument();
    });

    expect(screen.getByText("Review Queue")).toBeInTheDocument();
    expect(screen.getByText(/invoice with classification confidence 74%/i)).toBeInTheDocument();
    expect(screen.getByText(/2 unresolved fields/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Review" })).toBeInTheDocument();
  });
});
