import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import type { DocumentPipelineStage } from "@projectdoc/shared";

import { uploadDocument } from "../lib/api-client";

const stageColorMap: Record<DocumentPipelineStage["status"], "default" | "info" | "success" | "error" | "warning"> = {
  pending: "default",
  queued: "info",
  running: "warning",
  completed: "success",
  failed: "error"
};

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument
  });

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2.5}>
          <div>
            <Typography variant="h4">Upload</Typography>
            <Typography color="text.secondary">
              Store a local file, create the initial document record, and queue the downstream processing stages.
            </Typography>
          </div>

          <input
            aria-label="Select document file"
            accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.txt"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              uploadMutation.reset();
            }}
          />

          <Typography variant="body2" color="text.secondary">
            Accepted formats: PDF, PNG, JPEG, TIFF, and text. OCR, classification, and extraction are still development-stage worker steps, but the upload boundary and lifecycle records are already durable.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => {
                if (selectedFile) {
                  uploadMutation.mutate(selectedFile);
                }
              }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>

            {selectedFile ? (
              <Chip
                label={`${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)`}
                variant="outlined"
              />
            ) : null}
          </Stack>

          {uploadMutation.isPending ? <LinearProgress /> : null}
          {uploadMutation.error ? <Alert severity="error">{uploadMutation.error.message}</Alert> : null}
        </Stack>
      </Paper>

      {uploadMutation.data ? (
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Alert severity="success">{uploadMutation.data.message}</Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
              <Chip label={`Document ${uploadMutation.data.documentId}`} />
              <Chip label={`Status ${uploadMutation.data.documentStatus}`} color="info" />
              <Chip label={uploadMutation.data.mimeType} variant="outlined" />
            </Stack>

            <div>
              <Typography variant="h6">Queued Lifecycle</Typography>
              <Typography variant="body2" color="text.secondary">
                These stages are persisted with the document record so the future worker can update them without changing the upload boundary.
              </Typography>
            </div>

            <Stack spacing={1.5}>
              {uploadMutation.data.pipelineStages.map((stage) => (
                <Paper
                  key={stage.stage}
                  variant="outlined"
                  sx={{ p: 2, borderColor: "#ddd4c5", backgroundColor: "#fbfaf7" }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                  >
                    <div>
                      <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }}>
                        {stage.stage}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stage.message}
                      </Typography>
                    </div>
                    <Chip
                      label={stage.status}
                      color={stageColorMap[stage.status]}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}
