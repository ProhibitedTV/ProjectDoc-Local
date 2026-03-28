import { Module } from "@nestjs/common";

import { IngestionModule } from "../ingestion/ingestion.module";
import { ReviewModule } from "../review/review.module";
import { RetrievalController } from "./retrieval.controller";
import { RetrievalService } from "./retrieval.service";

@Module({
  imports: [IngestionModule, ReviewModule],
  controllers: [RetrievalController],
  providers: [RetrievalService],
  exports: [RetrievalService]
})
export class RetrievalModule {}
