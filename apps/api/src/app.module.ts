import { Module } from "@nestjs/common";

import { AdminModule } from "./modules/admin/admin.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { HealthModule } from "./modules/health/health.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { ReviewModule } from "./modules/review/review.module";
import { RetrievalModule } from "./modules/retrieval/retrieval.module";

@Module({
  imports: [HealthModule, IngestionModule, ReviewModule, RetrievalModule, AuditModule, ExportsModule, AdminModule]
})
export class AppModule {}
