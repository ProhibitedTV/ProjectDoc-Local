import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type {
  Document,
  DocumentPipelineStage,
  ProcessingRun,
  ProcessingTriggerType
} from "@projectdoc/shared";

import { DocumentLifecycleService } from "./document-lifecycle.service";
import type { DetectedMimeType } from "./mime-detection.service";

@Injectable()
export class PipelineOrchestratorService {
  constructor(private readonly documentLifecycleService: DocumentLifecycleService) {}

  initializePipeline(document: Document, detectedMimeType: DetectedMimeType): {
    document: Document;
    processingRun: ProcessingRun;
    pipelineStages: DocumentPipelineStage[];
  } {
    const processingRunId = randomUUID();
    const queuedDocument = this.documentLifecycleService.transitionStatus(document, "processing");
    const processingRun = this.createProcessingRun(queuedDocument.id, processingRunId, "upload");

    return {
      document: queuedDocument,
      processingRun,
      pipelineStages: [
        this.documentLifecycleService.createStage(
          "storage",
          "completed",
          "Original upload stored and document record created."
        ),
        detectedMimeType.requiresOcr
          ? this.documentLifecycleService.createStage("ocr", "queued", "Waiting for OCR worker handoff.")
          : this.documentLifecycleService.createStage(
              "ocr",
              "completed",
              "OCR is not required for text-native uploads."
            ),
        this.documentLifecycleService.createStage(
          "classification",
          detectedMimeType.requiresOcr ? "pending" : "queued",
          detectedMimeType.requiresOcr
            ? "Classification will queue after OCR produces text."
            : "Queued for document type classification."
        ),
        this.documentLifecycleService.createStage(
          "extraction",
          "pending",
          "Structured extraction will queue after classification completes."
        )
      ]
    };
  }

  private createProcessingRun(
    documentId: string,
    processingRunId: string,
    triggerType: ProcessingTriggerType
  ): ProcessingRun {
    return {
      id: processingRunId,
      documentId,
      triggerType,
      status: "queued",
      providerVersions: {},
      createdAt: new Date().toISOString()
    };
  }
}
