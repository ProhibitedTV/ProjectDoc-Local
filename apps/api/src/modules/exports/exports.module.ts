import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { ExportJobStoreService } from "./export-job-store.service";
import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [AuditModule],
  controllers: [ExportsController],
  providers: [ExportJobStoreService, ExportsService],
  exports: [ExportsService]
})
export class ExportsModule {}
