import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { DocumentDetailPage } from "./document-detail-page";

const fetchSearchableDocumentMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  fetchSearchableDocument: (documentId: string) => fetchSearchableDocumentMock(documentId)
}));

describe("DocumentDetailPage", () => {
  it("filters searchable content sections locally", async () => {
    fetchSearchableDocumentMock.mockResolvedValue({
      documentId: "doc_1",
      originalFilename: "permit-notes.txt",
      documentType: "permit",
      status: "processing",
      sourceType: "upload",
      receivedAt: "2026-03-28T12:00:00.000Z",
      metadata: {},
      sections: [
        {
          id: "doc_1:source:1",
          documentId: "doc_1",
          title: "Source text 1",
          source: "source_text",
          pageNumber: 1,
          text: "Permit Number: PERM-7781",
          citations: []
        },
        {
          id: "doc_1:field:1",
          documentId: "doc_1",
          title: "Applicant Name",
          source: "extracted_field",
          pageNumber: 1,
          text: "Applicant Name: ACME Electrical LLC",
          citations: []
        }
      ]
    });

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <DocumentDetailPage documentId="doc_1" />
        </QueryClientProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("permit-notes.txt")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filter sections"), {
      target: {
        value: "Applicant"
      }
    });

    expect(screen.getByText("Applicant Name")).toBeInTheDocument();
    expect(screen.queryByText("Source text 1")).not.toBeInTheDocument();
  });
});
