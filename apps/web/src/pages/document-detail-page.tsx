import { useState } from "react";
import {
  Alert,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { fetchSearchableDocument } from "../lib/api-client";

const matchesSection = (query: string, text: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return text.toLowerCase().includes(normalizedQuery);
};

type DocumentDetailPageProps = {
  documentId: string;
};

export function DocumentDetailPage({ documentId }: DocumentDetailPageProps) {
  const [sectionQuery, setSectionQuery] = useState("");

  const documentQuery = useQuery({
    queryKey: ["searchable-document", documentId],
    queryFn: () => fetchSearchableDocument(documentId)
  });

  const filteredSections = documentQuery.data
    ? documentQuery.data.sections.filter((section) =>
        matchesSection(sectionQuery, `${section.title}\n${section.text}`)
      )
    : [];

  return (
    <Stack spacing={3}>
      {documentQuery.isLoading ? <LinearProgress /> : null}
      {documentQuery.error ? <Alert severity="error">{documentQuery.error.message}</Alert> : null}

      {documentQuery.data ? (
        <>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <div>
              <Typography variant="h3">{documentQuery.data.originalFilename}</Typography>
              <Typography color="text.secondary">
                {documentQuery.data.documentType} - {documentQuery.data.status} - {documentQuery.data.sourceType}
              </Typography>
            </div>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`Sections ${documentQuery.data.sections.length}`} color="info" />
              <Chip
                label={documentQuery.data.projectId ? `Project ${documentQuery.data.projectId}` : "No project"}
                variant="outlined"
              />
            </Stack>
          </Stack>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5">Search within document sections</Typography>
              <TextField
                fullWidth
                label="Filter sections"
                value={sectionQuery}
                onChange={(event) => {
                  setSectionQuery(event.target.value);
                }}
                placeholder="permit number, contractor, total amount"
              />
              <Typography variant="body2" color="text.secondary">
                Showing {filteredSections.length} of {documentQuery.data.sections.length} sections.
              </Typography>
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {filteredSections.map((section) => (
              <Paper key={section.id} sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.5}
                    alignItems={{ md: "center" }}
                  >
                    <div>
                      <Typography variant="h5">{section.title}</Typography>
                      <Typography color="text.secondary">
                        {section.pageNumber ? `Page ${String(section.pageNumber)}` : "Document-level"} - {section.source.replace("_", " ")}
                      </Typography>
                    </div>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={section.pageNumber ? `Page ${String(section.pageNumber)}` : "Document"} />
                      <Chip label={section.source.replace("_", " ")} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{section.text}</Typography>

                  {section.citations.length > 0 ? (
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Trace references</Typography>
                      {section.citations.map((citation, index) => (
                        <Typography key={`${section.id}:${String(index)}`} variant="body2" color="text.secondary">
                          Page {citation.pageNumber ?? "?"}: {citation.excerpt ?? "No excerpt"}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}

                  {section.provenance ? (
                    <Typography variant="body2" color="text.secondary">
                      Provenance: {section.provenance.provider} - {section.provenance.method}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
