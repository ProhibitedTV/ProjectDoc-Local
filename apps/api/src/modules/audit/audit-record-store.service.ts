import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import {
  auditEventListFiltersSchema,
  auditEventListResponseSchema,
  auditEventSchema,
  type AuditEvent,
  type AuditEventListFilters,
  type AuditEventListResponse
} from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class AuditRecordStoreService {
  private get recordsRoot() {
    return join(getApiEnv().STORAGE_ROOT, "records", "audit-events");
  }

  async create(event: AuditEvent): Promise<AuditEvent> {
    const parsedEvent = auditEventSchema.parse(event);
    await this.writeRecord(parsedEvent);
    return parsedEvent;
  }

  async createMany(events: AuditEvent[]): Promise<AuditEvent[]> {
    const parsedEvents = events.map((event) => auditEventSchema.parse(event));

    for (const event of parsedEvents) {
      await this.writeRecord(event);
    }

    return parsedEvents;
  }

  async listRecent(filters: AuditEventListFilters): Promise<AuditEventListResponse> {
    const parsedFilters = auditEventListFiltersSchema.parse(filters);
    const events = await this.listAll();
    const filteredEvents = events
      .filter((event) => {
        if (parsedFilters.eventType && event.eventType !== parsedFilters.eventType) {
          return false;
        }

        if (parsedFilters.entityType && event.entityType !== parsedFilters.entityType) {
          return false;
        }

        if (parsedFilters.entityId && event.entityId !== parsedFilters.entityId) {
          return false;
        }

        if (parsedFilters.actorId && event.actorId !== parsedFilters.actorId) {
          return false;
        }

        return true;
      })
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

    return auditEventListResponseSchema.parse({
      total: filteredEvents.length,
      events: filteredEvents.slice(0, parsedFilters.limit)
    });
  }

  private async listAll(): Promise<AuditEvent[]> {
    try {
      const entries = await readdir(this.recordsRoot, { withFileTypes: true });
      const events = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map(async (entry) => {
            const raw = await readFile(join(this.recordsRoot, entry.name), "utf8");
            return auditEventSchema.parse(JSON.parse(raw));
          })
      );

      return events;
    } catch (error) {
      if (this.isNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  private async writeRecord(event: AuditEvent) {
    await mkdir(this.recordsRoot, { recursive: true });

    const recordPath = this.getRecordPath(event.id);
    const tempPath = `${recordPath}.tmp`;

    await writeFile(tempPath, `${JSON.stringify(event, null, 2)}\n`, "utf8");
    await rename(tempPath, recordPath);
  }

  private getRecordPath(eventId: string) {
    return join(this.recordsRoot, `${eventId}.json`);
  }

  private isNotFound(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
