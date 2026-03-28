import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchAdminSettings, fetchAuditEvents, updateAdminSettings } from "../lib/api-client";

const actorLabel = (actorType: string, actorId: string | undefined) =>
  actorType === "user" ? `User ${actorId ?? "unknown"}` : "System";

export function AdminPage() {
  const queryClient = useQueryClient();
  const [reviewConfidenceThreshold, setReviewConfidenceThreshold] = useState("0.80");
  const [watchedFolderEnabled, setWatchedFolderEnabled] = useState(false);
  const [reason, setReason] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings
  });
  const auditEventsQuery = useQuery({
    queryKey: ["audit-events", 25],
    queryFn: () => fetchAuditEvents({ limit: 25 })
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setReviewConfidenceThreshold(settingsQuery.data.reviewConfidenceThreshold.toFixed(2));
    setWatchedFolderEnabled(settingsQuery.data.watchedFolderEnabled);
  }, [settingsQuery.data]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: async () => {
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-events", 25] })
      ]);
    }
  });

  const parsedThreshold = Number(reviewConfidenceThreshold);
  const saveDisabled =
    reason.trim().length === 0 ||
    Number.isNaN(parsedThreshold) ||
    parsedThreshold < 0 ||
    parsedThreshold > 1 ||
    updateSettingsMutation.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <div>
          <Typography variant="h3">Admin</Typography>
          <Typography color="text.secondary">
            Inspect recent audit events and make explicit configuration changes with a reason.
          </Typography>
        </div>
        <Chip
          label={
            auditEventsQuery.isLoading
              ? "Loading audit trail"
              : auditEventsQuery.data
                ? `${auditEventsQuery.data.total} tracked event${auditEventsQuery.data.total === 1 ? "" : "s"}`
                : "Audit trail unavailable"
          }
          color={auditEventsQuery.data && auditEventsQuery.data.total > 0 ? "info" : "default"}
        />
      </Stack>

      {(settingsQuery.isLoading || auditEventsQuery.isLoading) ? <LinearProgress /> : null}
      {settingsQuery.error ? <Alert severity="error">{settingsQuery.error.message}</Alert> : null}
      {auditEventsQuery.error ? <Alert severity="error">{auditEventsQuery.error.message}</Alert> : null}
      {updateSettingsMutation.error ? (
        <Alert severity="error">{updateSettingsMutation.error.message}</Alert>
      ) : null}
      {updateSettingsMutation.isSuccess ? (
        <Alert severity="success">Settings saved and audit event recorded.</Alert>
      ) : null}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Instance settings</Typography>
          <TextField
            type="number"
            label="Review confidence threshold"
            value={reviewConfidenceThreshold}
            onChange={(event) => {
              setReviewConfidenceThreshold(event.target.value);
            }}
            inputProps={{
              min: 0,
              max: 1,
              step: 0.01
            }}
            helperText="Lower values reduce how often machine output gets routed for manual review."
          />
          <FormControlLabel
            control={
              <Switch
                checked={watchedFolderEnabled}
                onChange={(event) => {
                  setWatchedFolderEnabled(event.target.checked);
                }}
              />
            }
            label="Watched folder intake enabled"
          />
          <TextField
            label="Change reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            placeholder="Pilot site asked to enable watched folder intake."
            helperText="Required so operators can understand why a configuration changed."
          />
          <Button
            variant="contained"
            disabled={saveDisabled}
            sx={{ alignSelf: "flex-start" }}
            onClick={() => {
              void updateSettingsMutation.mutateAsync({
                actorId: "local-admin",
                reason: reason.trim(),
                reviewConfidenceThreshold: parsedThreshold,
                watchedFolderEnabled
              });
            }}
          >
            Save settings
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Typography variant="h5">Recent audit events</Typography>

        {auditEventsQuery.data?.events.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">No audit events yet</Typography>
            <Typography color="text.secondary">
              Upload a document or change a setting to start the operational trail.
            </Typography>
          </Paper>
        ) : null}

        {auditEventsQuery.data?.events.map((event) => (
          <Paper key={event.id} sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ md: "center" }}
              >
                <div>
                  <Typography variant="h6">{event.summary ?? event.eventType}</Typography>
                  <Typography color="text.secondary">
                    {new Date(event.occurredAt).toLocaleString()} - {actorLabel(event.actorType, event.actorId)}
                  </Typography>
                </div>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={event.eventType} color="info" />
                  <Chip label={`${event.entityType} ${event.entityId}`} variant="outlined" />
                </Stack>
              </Stack>

              {event.reason ? (
                <Typography color="text.secondary">Reason: {event.reason}</Typography>
              ) : null}

              {event.changes.length > 0 ? (
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">Changes</Typography>
                  {event.changes.map((change) => (
                    <Typography key={`${event.id}:${change.field}`} variant="body2" color="text.secondary">
                      {change.field}: {JSON.stringify(change.before ?? null)} to {JSON.stringify(change.after ?? null)}
                    </Typography>
                  ))}
                </Stack>
              ) : null}

              {event.relatedEntities.length > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Related:{" "}
                  {event.relatedEntities
                    .map((reference) => `${reference.entityType} ${reference.entityId}`)
                    .join(", ")}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
