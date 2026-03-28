import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import type { AuditEntityType, AuditEventListFilters, AuditEventListResponse, AuditEventType } from "@projectdoc/shared";
import { auditEventListFiltersSchema } from "@projectdoc/shared";

import { AuditService } from "./audit.service";

@Controller("audit-events")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async listRecentEvents(
    @Query("limit") limit: string | undefined,
    @Query("eventType") eventType: AuditEventType | undefined,
    @Query("entityType") entityType: AuditEntityType | undefined,
    @Query("entityId") entityId: string | undefined,
    @Query("actorId") actorId: string | undefined
  ): Promise<AuditEventListResponse> {
    return this.auditService.listRecentEvents(this.parseFilters(limit, eventType, entityType, entityId, actorId));
  }

  private parseFilters(
    limit: string | undefined,
    eventType: AuditEventType | undefined,
    entityType: AuditEntityType | undefined,
    entityId: string | undefined,
    actorId: string | undefined
  ): AuditEventListFilters {
    try {
      return auditEventListFiltersSchema.parse({
        limit: limit ? Number(limit) : undefined,
        eventType,
        entityType,
        entityId,
        actorId
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException("The audit event query was invalid.");
    }
  }
}
