import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { DocumentsPage } from "./documents-page";

const fetchDocumentsMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  fetchDocuments: () => fetchDocumentsMock()
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

describe("DocumentsPage", () => {
  it("renders persisted intake records and navigates to document detail", async () => {
    fetchDocumentsMock.mockResolvedValue([
      {
        document: {
          id: "doc_1",
          sourceType: "upload",
          originalFilename: "permit-notes.txt",
          mimeType: "text/plain",
          documentType: "permit",
          status: "processing",
          needsReview: false,
          receivedAt: "2026-03-28T12:00:00.000Z",
          createdAt: "2026-03-28T12:00:00.000Z",
          updatedAt: "2026-03-28T12:00:00.000Z",
          tags: [],
          metadata: {}
        },
        files: [
          {
            id: "file_1",
            documentId: "doc_1",
            kind: "original",
            storagePath: "incoming/doc_1.txt",
            sizeBytes: 128,
            mimeType: "text/plain",
            createdAt: "2026-03-28T12:00:00.000Z"
          }
        ],
        processingRun: {
          id: "run_1",
          documentId: "doc_1",
          triggerType: "upload",
          status: "queued",
          providerVersions: {},
          createdAt: "2026-03-28T12:00:00.000Z"
        },
        pipelineStages: []
      }
    ]);

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <DocumentsPage />
        </QueryClientProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("permit-notes.txt")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open Document" }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/documents/$documentId",
      params: { documentId: "doc_1" }
    });
  });
});
