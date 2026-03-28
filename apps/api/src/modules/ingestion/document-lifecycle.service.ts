import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  canTransitionDocumentStatus,
  type Document,
  type DocumentLifecycleStatus,
  type DocumentPipelineStage,
  type DocumentPipelineStageName,
  type DocumentPipelineStageStatus
} from "@projectdoc/shared";

@Injectable()
export class DocumentLifecycleService {
  transitionStatus(document: Document, nextStatus: DocumentLifecycleStatus): Document {
    if (!canTransitionDocumentStatus(document.status, nextStatus)) {
      throw new InternalServerErrorException(
        `Invalid document status transition from ${document.status} to ${nextStatus}.`
      );
    }

    return {
      ...document,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };
  }

  createStage(
    stage: DocumentPipelineStageName,
    status: DocumentPipelineStageStatus,
    message: string
  ): DocumentPipelineStage {
    return {
      stage,
      status,
      message,
      updatedAt: new Date().toISOString()
    };
  }
}
