import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { fetchHealth } from "../lib/api-client";

const workflowCards = [
  {
    title: "Intake",
    body: "Drag-and-drop uploads and watched-folder ingestion should land in the same document lifecycle."
  },
  {
    title: "Review",
    body: "Low-confidence extractions, rule hits, and missing fields belong in a queue, not in ad hoc inboxes."
  },
  {
    title: "Retrieval",
    body: "Search and Q&A should resolve back to stored page evidence before they earn user trust."
  }
];

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Operations Dashboard</Typography>
          <Typography color="text.secondary">
            Single-machine MVP foundation for upload, review, retrieval, and admin workflows.
          </Typography>
        </div>
        <Chip
          color={healthQuery.data?.status === "ok" ? "success" : "default"}
          label={
            healthQuery.isLoading
              ? "Checking API health"
              : healthQuery.data
                ? `API ${healthQuery.data.status}`
                : "API unavailable"
          }
        />
      </Stack>

      {healthQuery.error ? (
        <Alert severity="warning">
          The dashboard could not reach the API health route. Start the API or confirm the web proxy settings.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, minmax(0, 1fr))"
          }
        }}
      >
        {workflowCards.map((card) => (
          <Box key={card.title}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">{card.title}</Typography>
                  <Typography color="text.secondary">{card.body}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">What the current foundation already separates</Typography>
            <Divider />
            <Typography color="text.secondary">
              The API owns web requests and state transitions. The worker owns OCR, classification,
              extraction, retrieval indexing, and export jobs. Shared types and config loaders live in
              workspace packages so the boundary is explicit early.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
