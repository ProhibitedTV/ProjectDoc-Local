import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AdminController } from "./admin.controller";
import { AdminSettingsStoreService } from "./admin-settings-store.service";
import { AdminService } from "./admin.service";

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
  providers: [AdminSettingsStoreService, AdminService],
  exports: [AdminService]
})
export class AdminModule {}
