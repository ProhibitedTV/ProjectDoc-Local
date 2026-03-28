import { Module } from "@nestjs/common";

import { AuditController } from "./audit.controller";
import { AuditRecordStoreService } from "./audit-record-store.service";
import { AuditService } from "./audit.service";

@Module({
  controllers: [AuditController],
  providers: [AuditRecordStoreService, AuditService],
  exports: [AuditService]
})
export class AuditModule {}
