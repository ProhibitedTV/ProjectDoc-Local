import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type { CreateExportJobRequest, ExportJob } from "@projectdoc/shared";

import { AuditService } from "../audit/audit.service";
import { ExportJobStoreService } from "./export-job-store.service";

@Injectable()
export class ExportsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly exportJobStoreService: ExportJobStoreService
  ) {}

  describeCapability() {
    return {
      formats: ["csv"],
      status: "audit_ready_stub",
      nextStep: "Replace the current development generator with approved-record CSV assembly."
    } as const;
  }

  async listExports(): Promise<ExportJob[]> {
    return this.exportJobStoreService.list();
  }

  async createCsvExport(input: CreateExportJobRequest): Promise<ExportJob> {
    const occurredAt = new Date().toISOString();
    const exportJob: ExportJob = {
      id: randomUUID(),
      requestedByUserId: input.requestedByUserId,
      format: "csv",
      status: "completed",
      filter: input.filter,
      rowCount: 0,
      createdAt: occurredAt,
      completedAt: occurredAt
    };

    await this.exportJobStoreService.create(exportJob);
    await this.auditService.recordBuiltEvents([
      this.auditService.buildEvent("export.requested", "export_job", exportJob.id, {
        actorType: "user",
        actorId: input.requestedByUserId,
        occurredAt,
        summary: "CSV export was requested.",
        reason: input.reason,
        metadata: {
          format: exportJob.format,
          filter: exportJob.filter
        }
      }),
      this.auditService.buildEvent("export.completed", "export_job", exportJob.id, {
        actorType: "user",
        actorId: input.requestedByUserId,
        occurredAt,
        summary: "CSV export job completed using the current development generator.",
        reason: input.reason,
        metadata: {
          format: exportJob.format,
          rowCount: exportJob.rowCount
        }
      })
    ]);

    return exportJob;
  }
}
