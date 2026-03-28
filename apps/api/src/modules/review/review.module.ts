import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { IngestionModule } from "../ingestion/ingestion.module";
import { ReviewController } from "./review.controller";
import { ReviewFixtureService } from "./review-fixture.service";
import { ReviewRecordStoreService } from "./review-record-store.service";
import { ReviewService } from "./review.service";

@Module({
  imports: [AuditModule, IngestionModule],
  controllers: [ReviewController],
  providers: [ReviewFixtureService, ReviewRecordStoreService, ReviewService],
  exports: [ReviewService, ReviewFixtureService, ReviewRecordStoreService]
})
export class ReviewModule {}
