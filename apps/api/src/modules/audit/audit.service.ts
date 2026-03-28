import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type {
  AuditActorType,
  AuditChange,
  AuditEntityReference,
  AuditEntityType,
  AuditEvent,
  AuditEventListFilters,
  AuditEventListResponse,
  AuditEventType,
  Metadata
} from "@projectdoc/shared";

import { AuditRecordStoreService } from "./audit-record-store.service";

@Injectable()
export class AuditService {
  constructor(private readonly auditRecordStoreService: AuditRecordStoreService) {}

  buildEvent(
    eventType: AuditEventType,
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      actorType?: AuditActorType;
      actorId?: string;
      metadata?: Metadata;
      requestId?: string;
      occurredAt?: string;
      summary?: string;
      reason?: string;
      changes?: AuditChange[];
      relatedEntities?: AuditEntityReference[];
    }
  ): AuditEvent {
    return {
      id: randomUUID(),
      eventType,
      entityType,
      entityId,
      actorType: options?.actorType ?? "system",
      actorId: options?.actorId,
      requestId: options?.requestId,
      occurredAt: options?.occurredAt ?? new Date().toISOString(),
      summary: options?.summary,
      reason: options?.reason,
      changes: options?.changes ?? [],
      relatedEntities: options?.relatedEntities ?? [],
      metadata: options?.metadata ?? {}
    };
  }

  async recordEvent(
    eventType: AuditEventType,
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      actorType?: AuditActorType;
      actorId?: string;
      metadata?: Metadata;
      requestId?: string;
      occurredAt?: string;
      summary?: string;
      reason?: string;
      changes?: AuditChange[];
      relatedEntities?: AuditEntityReference[];
    }
  ): Promise<AuditEvent> {
    const event = this.buildEvent(eventType, entityType, entityId, options);
    return this.auditRecordStoreService.create(event);
  }

  async recordBuiltEvent(event: AuditEvent): Promise<AuditEvent> {
    return this.auditRecordStoreService.create(event);
  }

  async recordBuiltEvents(events: AuditEvent[]): Promise<AuditEvent[]> {
    return this.auditRecordStoreService.createMany(events);
  }

  async listRecentEvents(filters: AuditEventListFilters): Promise<AuditEventListResponse> {
    return this.auditRecordStoreService.listRecent(filters);
  }
}
