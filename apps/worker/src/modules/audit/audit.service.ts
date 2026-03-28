import { Injectable } from "@nestjs/common";
import type { AuditEventType } from "@projectdoc/shared";

@Injectable()
export class AuditService {
  record(eventType: AuditEventType) {
    return {
      eventType,
      status: "stub"
    } as const;
  }
}
