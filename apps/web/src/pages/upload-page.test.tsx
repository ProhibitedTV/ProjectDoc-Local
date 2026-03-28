import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { UploadPage } from "./upload-page";

const uploadDocumentMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  uploadDocument: (file: File) => uploadDocumentMock(file)
}));

describe("UploadPage", () => {
  it("shows queued lifecycle feedback after a successful upload", async () => {
    uploadDocumentMock.mockResolvedValue({
      documentId: "doc_123",
      processingRunId: "run_123",
      documentStatus: "processing",
      fileName: "invoice.pdf",
      mimeType: "application/pdf",
      message: "File stored and queued for downstream processing.",
      pipelineStages: [
        {
          stage: "storage",
          status: "completed",
          message: "Original upload stored and document record created.",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          stage: "ocr",
          status: "queued",
          message: "Waiting for OCR worker handoff.",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ]
    });

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <UploadPage />
        </QueryClientProvider>
      </ThemeProvider>
    );

    const fileInput = screen.getByLabelText("Select document file");
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["%PDF-1.4"], "invoice.pdf", { type: "application/pdf" })]
      }
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload Document" }));

    await waitFor(() => {
      expect(screen.getByText("Queued Lifecycle")).toBeInTheDocument();
    });

    expect(screen.getByText("File stored and queued for downstream processing.")).toBeInTheDocument();
    expect(screen.getByText("Status processing")).toBeInTheDocument();
    expect(screen.getByText("Waiting for OCR worker handoff.")).toBeInTheDocument();
  });
});
