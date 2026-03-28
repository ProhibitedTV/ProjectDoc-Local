import { Injectable, Logger } from "@nestjs/common";

import { workerEnv } from "./config/worker-env";
import { AuditService } from "./modules/audit/audit.service";
import { ClassificationService } from "./modules/classification/classification.service";
import { ExportsService } from "./modules/exports/exports.service";
import { ExtractionService } from "./modules/extraction/extraction.service";
import { IngestionService } from "./modules/ingestion/ingestion.service";
import { OcrService } from "./modules/ocr/ocr.service";
import { RetrievalService } from "./modules/retrieval/retrieval.service";

@Injectable()
export class WorkerBootstrapService {
  private readonly logger = new Logger(WorkerBootstrapService.name);

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly ocrService: OcrService,
    private readonly classificationService: ClassificationService,
    private readonly extractionService: ExtractionService,
    private readonly retrievalService: RetrievalService,
    private readonly auditService: AuditService,
    private readonly exportsService: ExportsService
  ) {}

  start() {
    this.ingestionService.startWatching();

    this.logger.log(
      JSON.stringify(
        {
          status: "ready",
          modelBaseUrl: workerEnv.MODEL_BASE_URL,
          stages: [
            this.ingestionService.describeStage(),
            { stage: "ocr", provider: this.ocrService.name },
            { stage: "classification", provider: this.classificationService.name },
            { stage: "extraction", provider: this.extractionService.name },
            this.retrievalService.describeStage(),
            this.exportsService.describeStage(),
            this.auditService.record("document.processing_started")
          ]
        },
        null,
        2
      )
    );
  }
}
