import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { SearchPage } from "./search-page";

const searchDocumentsMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  searchDocuments: (filters: { query: string; documentType?: string; status?: string }) =>
    searchDocumentsMock(filters)
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

describe("SearchPage", () => {
  it("renders search results with traceable context", async () => {
    searchDocumentsMock.mockResolvedValue({
      query: "permit",
      filters: {
        documentType: "permit",
        status: "processing"
      },
      totalResults: 1,
      results: [
        {
          documentId: "doc_1",
          originalFilename: "permit-notes.txt",
          documentType: "permit",
          status: "processing",
          sectionId: "doc_1:source:1",
          sectionTitle: "Source text 1",
          sectionSource: "source_text",
          snippet: "Permit Number: PERM-7781",
          pageNumber: 1,
          matchedTerms: ["permit"],
          score: 17
        }
      ]
    });

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <SearchPage />
        </QueryClientProvider>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText("Keyword query"), {
      target: {
        value: "permit"
      }
    });

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByText("permit-notes.txt")).toBeInTheDocument();
    });

    expect(screen.getByText("Source text 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Permit Number: PERM-7781")).toBeInTheDocument();
  });
});
