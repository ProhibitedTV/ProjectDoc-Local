import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { documentLifecycleStatuses, documentTypes, type DocumentSearchResponse } from "@projectdoc/shared";

import { searchDocuments } from "../lib/api-client";

const pageReferenceLabel = (pageNumber: number | undefined) =>
  pageNumber ? `Page ${String(pageNumber)}` : "Document-level";

const projectLabel = (projectId: string | undefined) => (projectId ? `Project ${projectId}` : "No project");

type ActiveSearch = {
  query: string;
  documentType: string;
  status: string;
};

const EmptySearchState = () => (
  <Paper sx={{ p: 4 }}>
    <Typography variant="h5">Start a search</Typography>
    <Typography color="text.secondary">
      Keyword search currently runs over locally available document sections, including text files,
      machine summaries, and extracted field summaries.
    </Typography>
  </Paper>
);

const EmptyResultsState = ({ response }: { response: DocumentSearchResponse }) => (
  <Paper sx={{ p: 4 }}>
    <Typography variant="h5">No matches found</Typography>
    <Typography color="text.secondary">
      No sections matched "{response.query}" with the current filters. Try a broader term or remove a
      filter.
    </Typography>
  </Paper>
);

export function SearchPage() {
  const navigate = useNavigate();
  const [queryInput, setQueryInput] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [activeSearch, setActiveSearch] = useState<ActiveSearch | null>(null);

  const searchQuery = useQuery({
    queryKey: ["document-search", activeSearch],
    queryFn: () =>
      searchDocuments({
        query: activeSearch!.query,
        documentType: activeSearch!.documentType || undefined,
        status: activeSearch!.status || undefined
      }),
    enabled: activeSearch !== null
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Search</Typography>
          <Typography color="text.secondary">
            Search locally available document content and open a traceable section-level detail view.
          </Typography>
        </div>
        <Chip
          label={
            searchQuery.isLoading
              ? "Searching"
              : searchQuery.data
                ? `${searchQuery.data.totalResults} result${searchQuery.data.totalResults === 1 ? "" : "s"}`
                : "Deterministic local search"
          }
          color={searchQuery.data && searchQuery.data.totalResults > 0 ? "success" : "default"}
        />
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Search criteria</Typography>
          <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Keyword query"
              value={queryInput}
              onChange={(event) => {
                setQueryInput(event.target.value);
              }}
              placeholder="invoice number, permit expiration, contractor name"
            />

            <TextField
              select
              label="Document type"
              value={documentType}
              onChange={(event) => {
                setDocumentType(event.target.value);
              }}
              sx={{ minWidth: { xl: 220 } }}
            >
              <MenuItem value="">All document types</MenuItem>
              {documentTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
              }}
              sx={{ minWidth: { xl: 220 } }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {documentLifecycleStatuses.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              disabled={queryInput.trim().length === 0 || searchQuery.isLoading}
              onClick={() => {
                setActiveSearch({
                  query: queryInput.trim(),
                  documentType,
                  status
                });
              }}
            >
              Search
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {searchQuery.isLoading ? <LinearProgress /> : null}
      {searchQuery.error ? <Alert severity="error">{searchQuery.error.message}</Alert> : null}

      {activeSearch === null ? <EmptySearchState /> : null}
      {searchQuery.data && searchQuery.data.totalResults === 0 ? <EmptyResultsState response={searchQuery.data} /> : null}

      {searchQuery.data?.results.length ? (
        <Stack spacing={2}>
          {searchQuery.data.results.map((result) => (
            <Paper key={`${result.documentId}:${result.sectionId}`} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                  alignItems={{ md: "center" }}
                >
                  <div>
                    <Typography variant="h5">{result.originalFilename}</Typography>
                    <Typography color="text.secondary">
                      {projectLabel(result.projectId)} - {result.documentType} - {result.status}
                    </Typography>
                  </div>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={pageReferenceLabel(result.pageNumber)} color="info" />
                    <Chip label={result.sectionSource.replace("_", " ")} variant="outlined" />
                    <Chip label={`Score ${result.score}`} variant="outlined" />
                  </Stack>
                </Stack>

                <Typography variant="subtitle2">{result.sectionTitle}</Typography>
                <Typography color="text.secondary">{result.snippet}</Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Matched terms: {result.matchedTerms.join(", ")}
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                    onClick={() => {
                      void navigate({
                        to: "/documents/$documentId",
                        params: { documentId: result.documentId }
                      });
                    }}
                  >
                    Open Document
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
