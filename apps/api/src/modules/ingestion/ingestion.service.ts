import { randomUUID } from "node:crypto";

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnsupportedMediaTypeException
} from "@nestjs/common";
import {
  documentUploadResponseSchema,
  type Document,
  type DocumentFile,
  type DocumentIngestionRecord,
  type DocumentPipelineStage,
  type DocumentUploadResponse
} from "@projectdoc/shared";

import { AuditService } from "../audit/audit.service";
import { DocumentRecordStoreService } from "./document-record-store.service";
import { FileStorageService } from "./file-storage.service";
import { MimeDetectionService, type DetectedMimeType } from "./mime-detection.service";
import { PipelineOrchestratorService } from "./pipeline-orchestrator.service";

export type UploadDocumentInput = {
  fileName: string;
  buffer: Buffer;
  reportedMimeType?: string;
};

@Injectable()
export class IngestionService {
  constructor(
    private readonly auditService: AuditService,
    private readonly documentRecordStoreService: DocumentRecordStoreService,
    private readonly fileStorageService: FileStorageService,
    private readonly mimeDetectionService: MimeDetectionService,
    private readonly pipelineOrchestratorService: PipelineOrchestratorService
  ) {}

  async uploadDocument(input: UploadDocumentInput): Promise<DocumentUploadResponse> {
    if (!input.fileName.trim()) {
      throw new BadRequestException("The uploaded file must include a filename.");
    }

    if (input.buffer.byteLength === 0) {
      throw new BadRequestException("The uploaded file was empty.");
    }

    const detectedMimeType = this.mimeDetectionService.detect(input.fileName, input.buffer, input.reportedMimeType);

    if (!detectedMimeType.isSupported) {
      throw new UnsupportedMediaTypeException(
        `Unsupported upload type for ${input.fileName}. Accepted files are PDF, PNG, JPEG, TIFF, and text.`
      );
    }

    const timestamp = new Date().toISOString();
    const initialDocument = this.buildInitialDocument(input.fileName, detectedMimeType, timestamp);
    let storedFilePath: string | undefined;

    try {
      const storedFile = await this.fileStorageService.saveIncomingFile({
        fileName: input.fileName,
        buffer: input.buffer,
        preferredExtension: detectedMimeType.preferredExtension
      });
      storedFilePath = storedFile.absolutePath;

      const documentFile = this.buildOriginalFileRecord(initialDocument.id, detectedMimeType.mimeType, storedFile, timestamp);
      const queuedWork = this.pipelineOrchestratorService.initializePipeline(initialDocument, detectedMimeType);

      const persistedRecord = await this.documentRecordStoreService.create({
        document: queuedWork.document,
        files: [documentFile],
        processingRun: queuedWork.processingRun,
        pipelineStages: queuedWork.pipelineStages
      });

      await this.auditService.recordBuiltEvents([
        this.auditService.buildEvent("document.ingested", "document", persistedRecord.document.id, {
          summary: "Document upload accepted and intake record created.",
          relatedEntities: [
            {
              entityType: "processing_run",
              entityId: persistedRecord.processingRun.id
            }
          ],
          metadata: {
            fileName: persistedRecord.document.originalFilename,
            mimeType: persistedRecord.document.mimeType,
            sourceType: persistedRecord.document.sourceType
          },
          occurredAt: timestamp
        }),
        ...this.buildPipelineStageEvents(
          persistedRecord.document.id,
          persistedRecord.processingRun.id,
          persistedRecord.pipelineStages,
          timestamp
        )
      ]);

      return documentUploadResponseSchema.parse({
        documentId: persistedRecord.document.id,
        processingRunId: persistedRecord.processingRun.id,
        documentStatus: persistedRecord.document.status,
        fileName: persistedRecord.document.originalFilename,
        mimeType: persistedRecord.document.mimeType,
        message: "File stored and queued for downstream processing.",
        pipelineStages: persistedRecord.pipelineStages
      });
    } catch (error) {
      if (storedFilePath) {
        await this.fileStorageService.removeAbsolutePath(storedFilePath);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof UnsupportedMediaTypeException
      ) {
        throw error;
      }

      throw new InternalServerErrorException("The document upload failed before the intake record could be finalized.");
    }
  }

  async getDocument(documentId: string): Promise<DocumentIngestionRecord | null> {
    return this.documentRecordStoreService.findById(documentId);
  }

  async listDocuments(): Promise<DocumentIngestionRecord[]> {
    return this.documentRecordStoreService.list();
  }

  private buildInitialDocument(fileName: string, detectedMimeType: DetectedMimeType, timestamp: string): Document {
    return {
      id: randomUUID(),
      sourceType: "upload",
      originalFilename: fileName,
      mimeType: detectedMimeType.mimeType,
      documentType: "unknown",
      status: "ingested",
      needsReview: false,
      receivedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [],
      metadata: {
        detectedBy: detectedMimeType.detectedBy,
        reportedMimeType: detectedMimeType.reportedMimeType ?? null,
        supported: detectedMimeType.isSupported
      }
    };
  }

  private buildOriginalFileRecord(
    documentId: string,
    mimeType: string,
    storedFile: Awaited<ReturnType<FileStorageService["saveIncomingFile"]>>,
    timestamp: string
  ): DocumentFile {
    return {
      id: randomUUID(),
      documentId,
      kind: "original",
      storagePath: storedFile.storagePath,
      sizeBytes: storedFile.sizeBytes,
      mimeType,
      sha256: storedFile.sha256,
      createdAt: timestamp
    };
  }

  private buildPipelineStageEvents(
    documentId: string,
    processingRunId: string,
    pipelineStages: DocumentPipelineStage[],
    occurredAt: string
  ) {
    return pipelineStages
      .filter((stage) => stage.stage === "storage" || stage.status === "queued" || stage.status === "completed")
      .map((stage) =>
        this.auditService.buildEvent("document.pipeline_stage_changed", "document", documentId, {
          summary: `${stage.stage} stage moved to ${stage.status}.`,
          occurredAt,
          changes: [
            {
              field: `pipelineStages.${stage.stage}`,
              after: stage.status
            }
          ],
          relatedEntities: [
            {
              entityType: "processing_run",
              entityId: processingRunId
            }
          ],
          metadata: {
            stage: stage.stage,
            status: stage.status,
            message: stage.message ?? null
          }
        })
      );
  }
}
