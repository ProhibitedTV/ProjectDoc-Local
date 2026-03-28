import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { DocumentLifecycleService } from "./document-lifecycle.service";
import { DocumentRecordStoreService } from "./document-record-store.service";
import { DocumentsController } from "./documents.controller";
import { FileStorageService } from "./file-storage.service";
import { IngestionService } from "./ingestion.service";
import { MimeDetectionService } from "./mime-detection.service";
import { PipelineOrchestratorService } from "./pipeline-orchestrator.service";

@Module({
  imports: [AuditModule],
  controllers: [DocumentsController],
  providers: [
    DocumentLifecycleService,
    DocumentRecordStoreService,
    FileStorageService,
    IngestionService,
    MimeDetectionService,
    PipelineOrchestratorService
  ],
  exports: [IngestionService, DocumentRecordStoreService]
})
export class IngestionModule {}
