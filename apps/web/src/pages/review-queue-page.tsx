import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { ReviewPriority, ReviewQueueItem, ReviewTaskStatus } from "@projectdoc/shared";

import { fetchReviewQueue } from "../lib/api-client";

const priorityColorMap: Record<ReviewPriority, "default" | "success" | "warning" | "error" | "info"> = {
  low: "default",
  normal: "info",
  high: "warning",
  urgent: "error"
};

const statusColorMap: Record<ReviewTaskStatus, "default" | "warning" | "success" | "error" | "info"> = {
  open: "warning",
  in_progress: "info",
  follow_up: "error",
  resolved: "success",
  rejected: "default"
};

const reviewReasonLabelMap: Record<ReviewQueueItem["reason"], string> = {
  low_confidence: "Low confidence",
  missing_required_field: "Missing required field",
  conflicting_values: "Conflicting values",
  policy_rule_triggered: "Policy rule triggered",
  ocr_quality_issue: "OCR quality issue"
};

export function ReviewQueuePage() {
  const navigate = useNavigate();
  const reviewQueueQuery = useQuery({
    queryKey: ["review-items"],
    queryFn: fetchReviewQueue
  });

  const items = reviewQueueQuery.data ?? [];
  const openCount = items.filter((item) => item.reviewStatus === "open").length;
  const followUpCount = items.filter((item) => item.reviewStatus === "follow_up").length;
  const correctedCount = items.reduce((sum, item) => sum + item.correctedFieldCount, 0);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Review Queue</Typography>
          <Typography color="text.secondary">
            Reviewers confirm machine proposals, make explicit overrides, and leave a durable decision trail.
          </Typography>
        </div>
        <Chip
          color={items.length > 0 ? "warning" : "success"}
          label={reviewQueueQuery.isLoading ? "Loading queue" : `${items.length} active item${items.length === 1 ? "" : "s"}`}
        />
      </Stack>

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
        <Paper sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Open
          </Typography>
          <Typography variant="h4">{openCount}</Typography>
          <Typography color="text.secondary">Awaiting first reviewer action.</Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Follow-Up
          </Typography>
          <Typography variant="h4">{followUpCount}</Typography>
          <Typography color="text.secondary">Needs missing paperwork or external confirmation.</Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Corrected Fields
          </Typography>
          <Typography variant="h4">{correctedCount}</Typography>
          <Typography color="text.secondary">Human-authored overrides preserved in the current queue.</Typography>
        </Paper>
      </Box>

      {reviewQueueQuery.isLoading ? <LinearProgress /> : null}
      {reviewQueueQuery.error ? (
        <Alert severity="error">{reviewQueueQuery.error.message}</Alert>
      ) : null}

      {items.length === 0 && !reviewQueueQuery.isLoading ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5">No active review items</Typography>
          <Typography color="text.secondary">
            Upload a document to seed a stubbed review item, then come back here to inspect the machine output.
          </Typography>
        </Paper>
      ) : null}

      <Stack spacing={2}>
        {items.map((item) => (
          <Paper key={item.taskId} sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ md: "center" }}
              >
                <div>
                  <Typography variant="h5">{item.originalFilename}</Typography>
                  <Typography color="text.secondary">
                    {item.predictedDocumentType} with classification confidence {Math.round(item.classificationConfidence * 100)}%
                  </Typography>
                </div>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={item.reviewStatus.replace("_", " ")} color={statusColorMap[item.reviewStatus]} />
                  <Chip label={reviewReasonLabelMap[item.reason]} variant="outlined" />
                  <Chip label={`${item.priority} priority`} color={priorityColorMap[item.priority]} variant="outlined" />
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Extraction confidence {Math.round(item.extractionConfidence * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.unresolvedFieldCount} unresolved field{item.unresolvedFieldCount === 1 ? "" : "s"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.correctedFieldCount} corrected field{item.correctedFieldCount === 1 ? "" : "s"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updated {new Date(item.updatedAt).toLocaleString()}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                sx={{ alignSelf: "flex-start" }}
                onClick={() => {
                  void navigate({
                    to: "/review/$reviewTaskId",
                    params: { reviewTaskId: item.taskId }
                  });
                }}
              >
                Open Review
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
