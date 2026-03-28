import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { appTheme } from "../theme";
import { AdminPage } from "./admin-page";

const fetchAdminSettingsMock = vi.fn();
const fetchAuditEventsMock = vi.fn();
const updateAdminSettingsMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  fetchAdminSettings: () => fetchAdminSettingsMock(),
  fetchAuditEvents: () => fetchAuditEventsMock(),
  updateAdminSettings: (payload: unknown) => updateAdminSettingsMock(payload)
}));

describe("AdminPage", () => {
  it("shows recent audit events and records settings updates with an explicit reason", async () => {
    fetchAdminSettingsMock.mockResolvedValue({
      id: "instance",
      reviewConfidenceThreshold: 0.8,
      watchedFolderEnabled: false,
      defaultExportFormat: "csv",
      updatedAt: "2026-03-28T12:00:00.000Z"
    });
    fetchAuditEventsMock.mockResolvedValue({
      total: 1,
      events: [
        {
          id: "event_1",
          eventType: "document.ingested",
          entityType: "document",
          entityId: "doc_1",
          actorType: "system",
          occurredAt: "2026-03-28T12:01:00.000Z",
          summary: "Document upload accepted and intake record created.",
          reason: undefined,
          changes: [],
          relatedEntities: [],
          metadata: {}
        }
      ]
    });
    updateAdminSettingsMock.mockResolvedValue({
      id: "instance",
      reviewConfidenceThreshold: 0.8,
      watchedFolderEnabled: true,
      defaultExportFormat: "csv",
      updatedAt: "2026-03-28T12:05:00.000Z"
    });

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient()}>
          <AdminPage />
        </QueryClientProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Recent audit events")).toBeInTheDocument();
    });

    expect(screen.getByText("Document upload accepted and intake record created.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Watched folder intake enabled"));
    fireEvent.change(screen.getByLabelText("Change reason"), {
      target: {
        value: "Pilot customer requested watched-folder intake."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => {
      expect(updateAdminSettingsMock).toHaveBeenCalledWith({
        actorId: "local-admin",
        reason: "Pilot customer requested watched-folder intake.",
        reviewConfidenceThreshold: 0.8,
        watchedFolderEnabled: true
      });
    });
  });
});
