import { BadRequestException, Injectable } from "@nestjs/common";
import type { AppSettings, AuditChange, UpdateAppSettingsRequest } from "@projectdoc/shared";

import { AuditService } from "../audit/audit.service";
import { AdminSettingsStoreService } from "./admin-settings-store.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly adminSettingsStoreService: AdminSettingsStoreService,
    private readonly auditService: AuditService
  ) {}

  async getSettings(): Promise<AppSettings> {
    const existing = await this.adminSettingsStoreService.load();

    if (existing) {
      return existing;
    }

    const defaults = this.buildDefaultSettings();
    await this.adminSettingsStoreService.save(defaults);
    return defaults;
  }

  async updateSettings(input: UpdateAppSettingsRequest): Promise<AppSettings> {
    const currentSettings = await this.getSettings();
    const occurredAt = new Date().toISOString();
    const nextSettings: AppSettings = {
      ...currentSettings,
      reviewConfidenceThreshold:
        input.reviewConfidenceThreshold ?? currentSettings.reviewConfidenceThreshold,
      watchedFolderEnabled:
        input.watchedFolderEnabled ?? currentSettings.watchedFolderEnabled,
      defaultExportFormat: input.defaultExportFormat ?? currentSettings.defaultExportFormat,
      updatedAt: occurredAt
    };

    const changes = [
      currentSettings.reviewConfidenceThreshold !== nextSettings.reviewConfidenceThreshold
        ? {
            field: "reviewConfidenceThreshold",
            before: currentSettings.reviewConfidenceThreshold,
            after: nextSettings.reviewConfidenceThreshold
          }
        : null,
      currentSettings.watchedFolderEnabled !== nextSettings.watchedFolderEnabled
        ? {
            field: "watchedFolderEnabled",
            before: currentSettings.watchedFolderEnabled,
            after: nextSettings.watchedFolderEnabled
          }
        : null,
      currentSettings.defaultExportFormat !== nextSettings.defaultExportFormat
        ? {
            field: "defaultExportFormat",
            before: currentSettings.defaultExportFormat,
            after: nextSettings.defaultExportFormat
          }
        : null
    ].filter((change): change is AuditChange => change !== null);

    if (changes.length === 0) {
      throw new BadRequestException("No admin settings changed.");
    }

    const savedSettings = await this.adminSettingsStoreService.save(nextSettings);
    await this.auditService.recordEvent("admin.settings_changed", "system_config", savedSettings.id, {
      actorType: "user",
      actorId: input.actorId,
      occurredAt,
      summary: "Instance settings were updated.",
      reason: input.reason,
      changes,
      metadata: {
        changedFields: changes.map((change) => change.field)
      }
    });

    return savedSettings;
  }

  private buildDefaultSettings(): AppSettings {
    return {
      id: "instance",
      reviewConfidenceThreshold: 0.8,
      watchedFolderEnabled: false,
      defaultExportFormat: "csv",
      updatedAt: new Date().toISOString()
    };
  }
}
