import { Module } from "@nestjs/common";

import { AuditModule } from "./modules/audit/audit.module";
import { ClassificationModule } from "./modules/classification/classification.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { ExtractionModule } from "./modules/extraction/extraction.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { RetrievalModule } from "./modules/retrieval/retrieval.module";
import { WorkerBootstrapService } from "./worker-bootstrap.service";

@Module({
  imports: [
    IngestionModule,
    OcrModule,
    ClassificationModule,
    ExtractionModule,
    RetrievalModule,
    AuditModule,
    ExportsModule
  ],
  providers: [WorkerBootstrapService]
})
export class WorkerModule {}
