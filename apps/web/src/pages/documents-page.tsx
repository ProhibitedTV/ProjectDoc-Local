import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { fetchDocuments } from "../lib/api-client";

const projectLabel = (projectId: string | undefined) => (projectId ? `Project ${projectId}` : "No project");

export function DocumentsPage() {
  const navigate = useNavigate();
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments
  });

  const documents = documentsQuery.data ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Documents</Typography>
          <Typography color="text.secondary">
            Review current intake records, lifecycle status, and source details before drilling into a document.
          </Typography>
        </div>
        <Chip
          label={
            documentsQuery.isLoading
              ? "Loading documents"
              : `${documents.length} document${documents.length === 1 ? "" : "s"}`
          }
          color={documents.length > 0 ? "info" : "default"}
        />
      </Stack>

      {documentsQuery.isLoading ? <LinearProgress /> : null}
      {documentsQuery.error ? <Alert severity="error">{documentsQuery.error.message}</Alert> : null}

      {documents.length === 0 && !documentsQuery.isLoading ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5">No documents yet</Typography>
          <Typography color="text.secondary">
            Upload a document to create the first intake record and unlock review, search, and audit flows.
          </Typography>
        </Paper>
      ) : null}

      <Stack spacing={2}>
        {documents.map((record) => (
          <Paper key={record.document.id} sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ md: "center" }}
              >
                <div>
                  <Typography variant="h5">{record.document.originalFilename}</Typography>
                  <Typography color="text.secondary">
                    {projectLabel(record.document.projectId)} - {record.document.sourceType} - {record.files.length} file
                    {record.files.length === 1 ? "" : "s"}
                  </Typography>
                </div>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={record.document.status} color={record.document.needsReview ? "warning" : "default"} />
                  <Chip label={record.document.documentType} variant="outlined" />
                  <Chip label={record.document.mimeType} variant="outlined" />
                </Stack>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Received {new Date(record.document.receivedAt).toLocaleString()}
              </Typography>

              <Button
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
                onClick={() => {
                  void navigate({
                    to: "/documents/$documentId",
                    params: { documentId: record.document.id }
                  });
                }}
              >
                Open Document
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
