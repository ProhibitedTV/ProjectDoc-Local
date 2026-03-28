import { useEffect, useState } from "react";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExtractionFieldValueType, ReviewFieldView, ReviewItemDetail } from "@projectdoc/shared";

import {
  approveReviewItem,
  correctReviewItem,
  fetchReviewItem,
  markReviewItemNeedsFollowUp
} from "../lib/api-client";

const LOCAL_REVIEWER_ID = "local-reviewer";

const serializeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const parseDraftValue = (
  rawValue: string,
  valueType: ExtractionFieldValueType
): string | number | boolean | null => {
  if (rawValue.trim() === "") {
    return null;
  }

  if (valueType === "currency" || valueType === "number") {
    const normalized = rawValue.replace(/[$,]/g, "").trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : rawValue;
  }

  if (valueType === "boolean") {
    if (rawValue === "true") {
      return true;
    }

    if (rawValue === "false") {
      return false;
    }
  }

  return rawValue;
};

const buildDraftState = (detail: ReviewItemDetail) =>
  Object.fromEntries(
    detail.fields.map((field) => [
      field.fieldKey,
      serializeValue(field.authoritativeValue ?? field.machineValue)
    ])
  );

const fieldStatusLabel = (field: ReviewFieldView) =>
  field.reviewStatus === "corrected"
    ? "Human override"
    : field.authoritativeValueSource === "human"
      ? "Human value"
      : "Machine value";

type ReviewDetailPageProps = {
  reviewTaskId: string;
};

export function ReviewDetailPageContent({ reviewTaskId }: ReviewDetailPageProps) {
  const queryClient = useQueryClient();
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState("");
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const reviewItemQuery = useQuery({
    queryKey: ["review-item", reviewTaskId],
    queryFn: () => fetchReviewItem(reviewTaskId)
  });

  useEffect(() => {
    if (reviewItemQuery.data) {
      setDraftValues(buildDraftState(reviewItemQuery.data));
      setReviewNotes("");
    }
  }, [reviewItemQuery.data]);

  const syncUpdatedDetail = (updatedDetail: ReviewItemDetail, message: string) => {
    queryClient.setQueryData(["review-item", reviewTaskId], updatedDetail);
    void queryClient.invalidateQueries({ queryKey: ["review-items"] });
    setDraftValues(buildDraftState(updatedDetail));
    setFeedback({ severity: "success", message });
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      approveReviewItem(reviewTaskId, {
        reviewerId: LOCAL_REVIEWER_ID,
        notes: reviewNotes.trim() || undefined
      }),
    onSuccess: (updatedDetail) => {
      syncUpdatedDetail(updatedDetail, "Review approved and document marked ready for downstream use.");
    },
    onError: (error: Error) => {
      setFeedback({ severity: "error", message: error.message });
    }
  });

  const correctMutation = useMutation({
    mutationFn: async () => {
      const currentDetail = reviewItemQuery.data;

      if (!currentDetail) {
        throw new Error("The review item has not loaded yet.");
      }

      const corrections: Array<{ fieldKey: string; authoritativeValue: string | number | boolean | null }> =
        currentDetail.fields
          .map((field) => {
            const parsedValue = parseDraftValue(draftValues[field.fieldKey] ?? "", field.valueType);
            const currentValue = field.authoritativeValue ?? field.machineValue;

            if (JSON.stringify(parsedValue) === JSON.stringify(currentValue)) {
              return null;
            }

            return {
              fieldKey: field.fieldKey,
              authoritativeValue: parsedValue
            };
          })
          .filter(
            (
              correction
            ): correction is { fieldKey: string; authoritativeValue: string | number | boolean | null } =>
              correction !== null
          );

      if (corrections.length === 0) {
        throw new Error("No field changes were detected.");
      }

      return correctReviewItem(reviewTaskId, {
        reviewerId: LOCAL_REVIEWER_ID,
        notes: reviewNotes.trim() || undefined,
        corrections
      });
    },
    onSuccess: (updatedDetail) => {
      syncUpdatedDetail(updatedDetail, "Corrections saved. The review remains open until you approve it.");
    },
    onError: (error: Error) => {
      setFeedback({ severity: "error", message: error.message });
    }
  });

  const followUpMutation = useMutation({
    mutationFn: () =>
      markReviewItemNeedsFollowUp(reviewTaskId, {
        reviewerId: LOCAL_REVIEWER_ID,
        notes: reviewNotes.trim() || "Follow-up required before approval.",
        fieldKeys:
          reviewItemQuery.data?.fields
            .filter((field) => field.reviewStatus === "unreviewed" && field.machineReviewRecommended)
            .map((field) => field.fieldKey) ?? []
      }),
    onSuccess: (updatedDetail) => {
      syncUpdatedDetail(updatedDetail, "Item marked for follow-up and kept in the queue.");
    },
    onError: (error: Error) => {
      setFeedback({ severity: "error", message: error.message });
    }
  });

  const isMutating = approveMutation.isPending || correctMutation.isPending || followUpMutation.isPending;
  const detail = reviewItemQuery.data;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Review Item</Typography>
          <Typography color="text.secondary">
            Confirm the machine proposal, make explicit overrides, and leave an auditable decision trail.
          </Typography>
        </div>
        <Chip
          label={detail ? detail.task.status.replace("_", " ") : "Loading"}
          color={
            detail?.task.status === "resolved"
              ? "success"
              : detail?.task.status === "follow_up"
                ? "error"
                : "warning"
          }
        />
      </Stack>

      {reviewItemQuery.isLoading ? <LinearProgress /> : null}
      {isMutating ? <LinearProgress color="secondary" /> : null}
      {reviewItemQuery.error ? <Alert severity="error">{reviewItemQuery.error.message}</Alert> : null}
      {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}

      {detail ? (
        <>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <div>
                  <Typography variant="h4">{detail.document.originalFilename}</Typography>
                  <Typography color="text.secondary">
                    Source {detail.document.sourceType} - {detail.document.mimeType} - received{" "}
                    {new Date(detail.document.receivedAt).toLocaleString()}
                  </Typography>
                </div>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={`Document ${detail.document.status}`} color="info" />
                  <Chip label={`Predicted ${detail.classification.documentType}`} variant="outlined" />
                  <Chip
                    label={`Classification ${Math.round(detail.classification.confidence * 100)}%`}
                    variant="outlined"
                  />
                  <Chip
                    label={`Extraction ${Math.round(detail.extraction.overallConfidence * 100)}%`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <Alert severity="info">
                The machine proposal and the authoritative value are shown separately on purpose. Approving
                accepts the current authoritative values. Correcting a field records a human override without
                deleting the original machine output.
              </Alert>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Review notes"
                  value={reviewNotes}
                  onChange={(event) => {
                    setReviewNotes(event.target.value);
                  }}
                />

                <Stack spacing={1.5} sx={{ minWidth: { md: 260 } }}>
                  <Button
                    variant="contained"
                    startIcon={<TaskAltOutlinedIcon />}
                    disabled={isMutating}
                    onClick={() => {
                      setFeedback(null);
                      approveMutation.mutate();
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditNoteOutlinedIcon />}
                    disabled={isMutating}
                    onClick={() => {
                      setFeedback(null);
                      correctMutation.mutate();
                    }}
                  >
                    Save Corrections
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ErrorOutlineOutlinedIcon />}
                    disabled={isMutating}
                    onClick={() => {
                      setFeedback(null);
                      followUpMutation.mutate();
                    }}
                  >
                    Mark Needs Follow-Up
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1.3fr 0.7fr"
              }
            }}
          >
            <Stack spacing={2}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5">Document metadata</Typography>
                  <Divider />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Typography color="text.secondary">
                      Needs review: {detail.document.needsReview ? "Yes" : "No"}
                    </Typography>
                    <Typography color="text.secondary">Files stored: {detail.document.fileCount}</Typography>
                    <Typography color="text.secondary">
                      Task reason: {detail.task.reason.replace(/_/g, " ")}
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {detail.document.pipelineStages.map((stage) => (
                      <Typography key={stage.stage} variant="body2" color="text.secondary">
                        {stage.stage}: {stage.status} {stage.message ? `- ${stage.message}` : ""}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5">Classification</Typography>
                  <Divider />
                  <Typography color="text.secondary">{detail.classification.reasons.join(" ")}</Typography>
                  <Stack spacing={1.5}>
                    {detail.classification.candidates.map((candidate) => (
                      <Paper key={candidate.documentType} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle1">
                            {candidate.documentType} - {Math.round(candidate.confidence * 100)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Signals:{" "}
                            {candidate.matchedSignals.length > 0
                              ? candidate.matchedSignals.join(", ")
                              : "none"}
                          </Typography>
                          {candidate.citations.map((citation, index) => (
                            <Typography
                              key={`${candidate.documentType}-${index}`}
                              variant="body2"
                              color="text.secondary"
                            >
                              Page {citation.pageNumber ?? "?"}: {citation.excerpt ?? "No excerpt"}
                            </Typography>
                          ))}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5">Extracted fields</Typography>
                  <Divider />
                  <Stack spacing={2}>
                    {detail.fields.map((field) => (
                      <Paper key={field.fieldKey} variant="outlined" sx={{ p: 2.5 }}>
                        <Stack spacing={2}>
                          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                            <div>
                              <Typography variant="h6">{field.label}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {field.description ?? field.fieldKey}
                              </Typography>
                            </div>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                              <Chip
                                label={field.required ? "Required" : "Optional"}
                                color={field.required ? "warning" : "default"}
                                variant="outlined"
                              />
                              <Chip
                                label={fieldStatusLabel(field)}
                                color={field.reviewStatus === "corrected" ? "success" : "default"}
                              />
                              <Chip
                                label={`Machine ${Math.round(field.machineConfidence * 100)}%`}
                                variant="outlined"
                              />
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gap: 2,
                              gridTemplateColumns: {
                                xs: "1fr",
                                lg: "repeat(2, minmax(0, 1fr))"
                              }
                            }}
                          >
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Stack spacing={1}>
                                <Typography variant="subtitle2">Machine proposal</Typography>
                                <Typography>{formatValue(field.machineValue)}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Review flags:{" "}
                                  {field.machineReviewReasons.length > 0
                                    ? field.machineReviewReasons.join(", ")
                                    : "none"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Provenance: {field.provenance.provider} - {field.provenance.method}
                                </Typography>
                              </Stack>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Stack spacing={1.5}>
                                <Typography variant="subtitle2">Authoritative value</Typography>
                                {field.valueType === "boolean" ? (
                                  <TextField
                                    select
                                    label="Authoritative value"
                                    value={draftValues[field.fieldKey] ?? ""}
                                    onChange={(event) => {
                                      setDraftValues((current) => ({
                                        ...current,
                                        [field.fieldKey]: event.target.value
                                      }));
                                    }}
                                  >
                                    <MenuItem value="">Unset</MenuItem>
                                    <MenuItem value="true">True</MenuItem>
                                    <MenuItem value="false">False</MenuItem>
                                  </TextField>
                                ) : (
                                  <TextField
                                    fullWidth
                                    label="Authoritative value"
                                    value={draftValues[field.fieldKey] ?? ""}
                                    onChange={(event) => {
                                      setDraftValues((current) => ({
                                        ...current,
                                        [field.fieldKey]: event.target.value
                                      }));
                                    }}
                                  />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                  Source: {field.authoritativeValueSource}
                                </Typography>
                              </Stack>
                            </Paper>
                          </Box>

                          <Stack spacing={0.75}>
                            <Typography variant="subtitle2">Citations</Typography>
                            {field.citations.map((citation, index) => (
                              <Typography key={`${field.fieldKey}-${index}`} variant="body2" color="text.secondary">
                                Page {citation.pageNumber ?? "?"}: {citation.excerpt ?? "No excerpt"}
                              </Typography>
                            ))}
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>

            <Stack spacing={2}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5">Review actions</Typography>
                  <Divider />
                  {detail.actions.length === 0 ? (
                    <Typography color="text.secondary">No review actions have been recorded yet.</Typography>
                  ) : (
                    detail.actions.map((action) => (
                      <Paper key={action.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={0.75}>
                          <Typography variant="subtitle1">{action.action.replace(/_/g, " ")}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(action.createdAt).toLocaleString()}
                          </Typography>
                          {action.fieldKey ? (
                            <Typography variant="body2" color="text.secondary">
                              Field: {action.fieldKey}
                            </Typography>
                          ) : null}
                          {action.notes ? (
                            <Typography variant="body2" color="text.secondary">
                              {action.notes}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h5">Audit trail</Typography>
                  <Divider />
                  {detail.auditEvents.length === 0 ? (
                    <Typography color="text.secondary">No audit events have been recorded yet.</Typography>
                  ) : (
                    detail.auditEvents.map((event) => (
                      <Paper key={event.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={0.75}>
                          <Typography variant="subtitle1">{event.eventType}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(event.occurredAt).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Actor: {event.actorType}
                            {event.actorId ? ` (${event.actorId})` : ""}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </>
      ) : null}
    </Stack>
  );
}
