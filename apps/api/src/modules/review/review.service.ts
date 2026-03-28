import { randomUUID } from "node:crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ApproveReviewItemRequest,
  AuditEvent,
  CorrectReviewItemRequest,
  DocumentIngestionRecord,
  DocumentPipelineStage,
  FieldValue,
  FollowUpReviewItemRequest,
  Metadata,
  ReviewAction,
  ReviewCorrection,
  ReviewFieldView,
  ReviewItemDetail,
  ReviewItemRecord,
  ReviewQueueItem,
  ReviewedFieldValue
} from "@projectdoc/shared";
import { getDocumentFieldDefinitions } from "@projectdoc/shared";

import { AuditService } from "../audit/audit.service";
import { DocumentRecordStoreService } from "../ingestion/document-record-store.service";
import { ReviewFixtureService } from "./review-fixture.service";
import { ReviewRecordStoreService } from "./review-record-store.service";

const valueEquals = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

@Injectable()
export class ReviewService {
  constructor(
    private readonly auditService: AuditService,
    private readonly documentRecordStoreService: DocumentRecordStoreService,
    private readonly reviewFixtureService: ReviewFixtureService,
    private readonly reviewRecordStoreService: ReviewRecordStoreService
  ) {}

  async listQueueItems(): Promise<ReviewQueueItem[]> {
    await this.ensureSeededReviewRecords();
    const documents = await this.documentRecordStoreService.list();
    const reviewRecords = await this.reviewRecordStoreService.list();

    return reviewRecords
      .filter((record) => record.task.status !== "resolved" && record.task.status !== "rejected")
      .map((record) => {
        const documentRecord = documents.find((document) => document.document.id === record.task.documentId);

        if (!documentRecord) {
          throw new NotFoundException(`Document ${record.task.documentId} was not found for review task ${record.task.id}.`);
        }

        return this.toQueueItem(documentRecord, record);
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async getReviewItem(reviewTaskId: string): Promise<ReviewItemDetail> {
    await this.ensureSeededReviewRecords();
    const record = await this.reviewRecordStoreService.findByTaskId(reviewTaskId);

    if (!record) {
      throw new NotFoundException(`Review item ${reviewTaskId} was not found.`);
    }

    const documentRecord = await this.documentRecordStoreService.findById(record.task.documentId);

    if (!documentRecord) {
      throw new NotFoundException(`Document ${record.task.documentId} was not found for review item ${reviewTaskId}.`);
    }

    return this.toDetail(documentRecord, record);
  }

  async approveReviewItem(reviewTaskId: string, input: ApproveReviewItemRequest): Promise<ReviewItemDetail> {
    const { documentRecord, reviewRecord } = await this.loadReviewAggregate(reviewTaskId);
    const occurredAt = new Date().toISOString();

    reviewRecord.task = {
      ...reviewRecord.task,
      status: "resolved",
      completedAt: occurredAt
    };
    reviewRecord.reviewedFields = reviewRecord.reviewedFields.map((field) => ({
      ...field,
      reviewStatus: field.authoritativeValueSource === "human" ? "corrected" : "accepted",
      reviewerId: input.reviewerId,
      reviewedAt: occurredAt,
      notes: input.notes ?? field.notes
    }));

    const reviewAction = this.buildReviewAction({
      reviewTaskId,
      documentId: reviewRecord.task.documentId,
      userId: input.reviewerId,
      action: "approve",
      notes: input.notes,
      createdAt: occurredAt
    });
    const auditEvent = this.buildReviewAuditEvent(
      "review.approved",
      reviewRecord.task.id,
      input.reviewerId,
      {
        documentId: reviewRecord.task.documentId,
        approvedFieldCount: reviewRecord.reviewedFields.length
      },
      occurredAt,
      {
        summary: "Reviewer approved the document output.",
        reason: input.notes,
        relatedEntities: [
          {
            entityType: "document",
            entityId: reviewRecord.task.documentId
          }
        ]
      }
    );
    const documentAuditEvent = this.auditService.buildEvent("document.approved", "document", reviewRecord.task.documentId, {
      actorType: "user",
      actorId: input.reviewerId,
      occurredAt,
      summary: "Document was approved after human review.",
      reason: input.notes,
      relatedEntities: [
        {
          entityType: "review_task",
          entityId: reviewRecord.task.id
        }
      ],
      metadata: {
        reviewTaskId: reviewRecord.task.id
      }
    });

    reviewRecord.actions = [reviewAction, ...reviewRecord.actions];
    reviewRecord.auditEvents = [documentAuditEvent, auditEvent, ...reviewRecord.auditEvents];
    reviewRecord.updatedAt = occurredAt;

    const updatedDocumentRecord: DocumentIngestionRecord = {
      ...documentRecord,
      document: {
        ...documentRecord.document,
        documentType: reviewRecord.classification.documentType,
        status: "approved",
        needsReview: false,
        updatedAt: occurredAt
      }
    };

    await this.reviewRecordStoreService.update(reviewRecord);
    await this.documentRecordStoreService.update(updatedDocumentRecord);
    await this.auditService.recordBuiltEvents([auditEvent, documentAuditEvent]);

    return this.toDetail(updatedDocumentRecord, reviewRecord);
  }

  async correctReviewItem(reviewTaskId: string, input: CorrectReviewItemRequest): Promise<ReviewItemDetail> {
    const { documentRecord, reviewRecord } = await this.loadReviewAggregate(reviewTaskId);
    const occurredAt = new Date().toISOString();
    const correctionsByField = new Map(input.corrections.map((correction) => [correction.fieldKey, correction]));
    const originalReviewedFields = [...reviewRecord.reviewedFields];
    const correctedActions: ReviewAction[] = [];

    reviewRecord.reviewedFields = reviewRecord.reviewedFields.map((field) => {
      const correction = correctionsByField.get(field.fieldKey);

      if (!correction) {
        return field;
      }

      const correctedField = this.applyCorrection(field, correction, input.reviewerId, input.notes, occurredAt);
      correctedActions.push(
        this.buildReviewAction({
          reviewTaskId,
          documentId: reviewRecord.task.documentId,
          userId: input.reviewerId,
          action: "correct",
          fieldKey: field.fieldKey,
          beforeValue: field.authoritativeValue,
          afterValue: correctedField.authoritativeValue,
          notes: correction.notes ?? input.notes,
          createdAt: occurredAt,
          reviewedFieldValueId: field.id
        })
      );

      return correctedField;
    });

    if (correctedActions.length === 0) {
      throw new BadRequestException("No matching review fields were found for the supplied corrections.");
    }

    reviewRecord.task = {
      ...reviewRecord.task,
      status: "in_progress",
      completedAt: undefined
    };
    reviewRecord.actions = [...correctedActions, ...reviewRecord.actions];
    reviewRecord.auditEvents = [
      this.buildReviewAuditEvent(
        "review.corrected",
        reviewRecord.task.id,
        input.reviewerId,
        {
          documentId: reviewRecord.task.documentId,
          correctedFieldKeys: input.corrections.map((correction) => correction.fieldKey)
        },
        occurredAt,
        {
          summary: "Reviewer corrected one or more authoritative values.",
          reason: input.notes,
          changes: input.corrections.map((correction) => {
            const originalField = originalReviewedFields.find((field) => field.fieldKey === correction.fieldKey);

            return {
              field: correction.fieldKey,
              before: originalField?.authoritativeValue,
              after: correction.authoritativeValue
            };
          }),
          relatedEntities: [
            {
              entityType: "document",
              entityId: reviewRecord.task.documentId
            }
          ]
        }
      ),
      ...reviewRecord.auditEvents
    ];
    reviewRecord.updatedAt = occurredAt;

    const updatedDocumentRecord: DocumentIngestionRecord = {
      ...documentRecord,
      document: {
        ...documentRecord.document,
        documentType: reviewRecord.classification.documentType,
        status: "needs_review",
        needsReview: true,
        updatedAt: occurredAt
      }
    };

    await this.reviewRecordStoreService.update(reviewRecord);
    await this.documentRecordStoreService.update(updatedDocumentRecord);
    await this.auditService.recordBuiltEvent(reviewRecord.auditEvents[0]);

    return this.toDetail(updatedDocumentRecord, reviewRecord);
  }

  async markNeedsFollowUp(reviewTaskId: string, input: FollowUpReviewItemRequest): Promise<ReviewItemDetail> {
    const { documentRecord, reviewRecord } = await this.loadReviewAggregate(reviewTaskId);
    const occurredAt = new Date().toISOString();

    reviewRecord.task = {
      ...reviewRecord.task,
      status: "follow_up",
      priority: "high",
      completedAt: undefined
    };
    reviewRecord.actions = [
      this.buildReviewAction({
        reviewTaskId,
        documentId: reviewRecord.task.documentId,
        userId: input.reviewerId,
        action: "needs_follow_up",
        notes: input.notes,
        createdAt: occurredAt
      }),
      ...reviewRecord.actions
    ];
    reviewRecord.auditEvents = [
      this.buildReviewAuditEvent(
        "review.follow_up_requested",
        reviewRecord.task.id,
        input.reviewerId,
        {
          documentId: reviewRecord.task.documentId,
          fieldKeys: input.fieldKeys
        },
        occurredAt,
        {
          summary: "Reviewer marked the item for follow-up.",
          reason: input.notes,
          relatedEntities: [
            {
              entityType: "document",
              entityId: reviewRecord.task.documentId
            }
          ]
        }
      ),
      ...reviewRecord.auditEvents
    ];
    reviewRecord.updatedAt = occurredAt;

    const updatedDocumentRecord: DocumentIngestionRecord = {
      ...documentRecord,
      document: {
        ...documentRecord.document,
        documentType: reviewRecord.classification.documentType,
        status: "needs_review",
        needsReview: true,
        updatedAt: occurredAt
      }
    };

    await this.reviewRecordStoreService.update(reviewRecord);
    await this.documentRecordStoreService.update(updatedDocumentRecord);
    await this.auditService.recordBuiltEvent(reviewRecord.auditEvents[0]);

    return this.toDetail(updatedDocumentRecord, reviewRecord);
  }

  private async ensureSeededReviewRecords() {
    const documentRecords = await this.documentRecordStoreService.list();

    for (const documentRecord of documentRecords) {
      await this.ensureSeededReviewRecord(documentRecord);
    }
  }

  private async ensureSeededReviewRecord(documentRecord: DocumentIngestionRecord): Promise<ReviewItemRecord> {
    const existing = await this.reviewRecordStoreService.findByDocumentId(documentRecord.document.id);

    if (existing) {
      return existing;
    }

    const seedRecord = this.reviewFixtureService.buildSeedRecord(documentRecord);
    const updatedDocumentRecord = this.markDocumentReadyForReview(
      documentRecord,
      seedRecord.updatedAt,
      seedRecord.classification.documentType
    );
    const seededAuditEvents = [
      this.auditService.buildEvent("classification.generated", "document", documentRecord.document.id, {
        summary: "Classification output was generated for review.",
        occurredAt: seedRecord.createdAt,
        relatedEntities: [
          {
            entityType: "processing_run",
            entityId: documentRecord.processingRun.id
          },
          {
            entityType: "review_task",
            entityId: seedRecord.task.id
          }
        ],
        metadata: {
          predictedDocumentType: seedRecord.classification.documentType,
          confidence: seedRecord.classification.confidence,
          method: seedRecord.classification.method
        }
      }),
      this.auditService.buildEvent("extraction.generated", "document", documentRecord.document.id, {
        summary: "Structured field extraction output was generated for review.",
        occurredAt: seedRecord.createdAt,
        relatedEntities: [
          {
            entityType: "processing_run",
            entityId: documentRecord.processingRun.id
          },
          {
            entityType: "review_task",
            entityId: seedRecord.task.id
          }
        ],
        metadata: {
          documentType: seedRecord.extraction.documentType,
          overallConfidence: seedRecord.extraction.overallConfidence,
          fieldCount: seedRecord.extraction.fields.length
        }
      }),
      this.auditService.buildEvent("document.flagged_for_review", "document", documentRecord.document.id, {
        summary: "Document was flagged for human review.",
        occurredAt: seedRecord.createdAt,
        relatedEntities: [
          {
            entityType: "review_task",
            entityId: seedRecord.task.id
          }
        ],
        metadata: {
          reviewTaskId: seedRecord.task.id,
          predictedDocumentType: seedRecord.classification.documentType,
          extractionConfidence: seedRecord.extraction.overallConfidence
        }
      }),
      ...this.buildPipelineStageAuditEvents(documentRecord, updatedDocumentRecord, seedRecord.createdAt)
    ];

    const persistedReviewRecord = {
      ...seedRecord,
      auditEvents: [...seededAuditEvents, ...seedRecord.auditEvents]
    };

    await this.reviewRecordStoreService.create(persistedReviewRecord);
    await this.documentRecordStoreService.update(updatedDocumentRecord);
    await this.auditService.recordBuiltEvents(seededAuditEvents);

    return persistedReviewRecord;
  }

  private async loadReviewAggregate(reviewTaskId: string) {
    await this.ensureSeededReviewRecords();
    const reviewRecord = await this.reviewRecordStoreService.findByTaskId(reviewTaskId);

    if (!reviewRecord) {
      throw new NotFoundException(`Review item ${reviewTaskId} was not found.`);
    }

    const documentRecord = await this.documentRecordStoreService.findById(reviewRecord.task.documentId);

    if (!documentRecord) {
      throw new NotFoundException(`Document ${reviewRecord.task.documentId} was not found.`);
    }

    return { documentRecord, reviewRecord };
  }

  private markDocumentReadyForReview(
    documentRecord: DocumentIngestionRecord,
    occurredAt: string,
    documentType: DocumentIngestionRecord["document"]["documentType"]
  ): DocumentIngestionRecord {
    return {
      ...documentRecord,
      document: {
        ...documentRecord.document,
        documentType,
        status: "needs_review",
        needsReview: true,
        updatedAt: occurredAt
      },
      processingRun: {
        ...documentRecord.processingRun,
        status: "completed",
        completedAt: occurredAt
      },
      pipelineStages: documentRecord.pipelineStages.map((stage) => {
        if (stage.stage === "classification") {
          return {
            ...stage,
            status: "completed",
            message: "Stub classification output prepared for review queue development.",
            updatedAt: occurredAt
          };
        }

        if (stage.stage === "extraction") {
          return {
            ...stage,
            status: "completed",
            message: "Stub extraction output prepared for reviewer verification.",
            updatedAt: occurredAt
          };
        }

        if (stage.stage === "ocr" && stage.status !== "completed") {
          return {
            ...stage,
            status: "completed",
            message: "OCR placeholder output marked complete for review queue development.",
            updatedAt: occurredAt
          };
        }

        return stage;
      })
    };
  }

  private toQueueItem(documentRecord: DocumentIngestionRecord, reviewRecord: ReviewItemRecord): ReviewQueueItem {
    return {
      taskId: reviewRecord.task.id,
      documentId: reviewRecord.task.documentId,
      originalFilename: documentRecord.document.originalFilename,
      documentStatus: documentRecord.document.status,
      reviewStatus: reviewRecord.task.status,
      priority: reviewRecord.task.priority,
      reason: reviewRecord.task.reason,
      predictedDocumentType: reviewRecord.classification.documentType,
      classificationConfidence: reviewRecord.classification.confidence,
      extractionConfidence: reviewRecord.extraction.overallConfidence,
      requiredFieldCount: reviewRecord.extraction.fields.filter((field) => field.required).length,
      correctedFieldCount: reviewRecord.reviewedFields.filter((field) => field.reviewStatus === "corrected").length,
      unresolvedFieldCount: reviewRecord.reviewedFields.filter((field) => field.reviewStatus === "unreviewed").length,
      reviewRecommended: reviewRecord.classification.reviewRecommended || reviewRecord.extraction.reviewRecommended,
      receivedAt: documentRecord.document.receivedAt,
      updatedAt: reviewRecord.updatedAt
    };
  }

  private toDetail(documentRecord: DocumentIngestionRecord, reviewRecord: ReviewItemRecord): ReviewItemDetail {
    const fieldDefinitions = getDocumentFieldDefinitions(reviewRecord.classification.documentType);
    const fields: ReviewFieldView[] = reviewRecord.extraction.fields.map((machineField) => {
      const reviewedField = reviewRecord.reviewedFields.find((field) => field.fieldKey === machineField.fieldKey);
      const definition = fieldDefinitions.find((field) => field.fieldKey === machineField.fieldKey);

      return {
        fieldKey: machineField.fieldKey,
        label: machineField.label,
        description: definition?.description,
        valueType: machineField.valueType,
        required: machineField.required,
        sourceExtractedFieldId: reviewedField?.sourceExtractedFieldId,
        machineValue: machineField.value,
        machineNormalizedText: machineField.normalizedText,
        machineConfidence: machineField.confidence,
        machineReviewRecommended: machineField.reviewRecommended,
        machineReviewReasons: machineField.reviewReasons,
        authoritativeValue: reviewedField?.authoritativeValue ?? machineField.value,
        authoritativeValueSource: reviewedField?.authoritativeValueSource ?? "machine",
        reviewStatus: reviewedField?.reviewStatus ?? "unreviewed",
        reviewerId: reviewedField?.reviewerId,
        reviewedAt: reviewedField?.reviewedAt,
        notes: reviewedField?.notes,
        citations: reviewedField?.citations ?? machineField.citations,
        provenance: machineField.provenance
      };
    });

    return {
      task: reviewRecord.task,
      document: {
        id: documentRecord.document.id,
        originalFilename: documentRecord.document.originalFilename,
        mimeType: documentRecord.document.mimeType,
        sourceType: documentRecord.document.sourceType,
        status: documentRecord.document.status,
        needsReview: documentRecord.document.needsReview,
        receivedAt: documentRecord.document.receivedAt,
        updatedAt: documentRecord.document.updatedAt,
        metadata: documentRecord.document.metadata,
        pipelineStages: documentRecord.pipelineStages,
        fileCount: documentRecord.files.length
      },
      classification: reviewRecord.classification,
      extraction: reviewRecord.extraction,
      fields,
      actions: [...reviewRecord.actions].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      auditEvents: [...reviewRecord.auditEvents].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    };
  }

  private applyCorrection(
    field: ReviewedFieldValue,
    correction: ReviewCorrection,
    reviewerId: string,
    fallbackNotes: string | undefined,
    occurredAt: string
  ): ReviewedFieldValue {
    const authoritativeValueSource = valueEquals(correction.authoritativeValue, field.machineValue) ? "machine" : "human";
    const reviewStatus = authoritativeValueSource === "human" ? "corrected" : "accepted";

    return {
      ...field,
      authoritativeValue: correction.authoritativeValue,
      authoritativeValueSource,
      reviewStatus,
      reviewerId,
      reviewedAt: occurredAt,
      notes: correction.notes ?? fallbackNotes ?? field.notes
    };
  }

  private buildReviewAction(input: {
    reviewTaskId: string;
    documentId: string;
    userId: string;
    action: ReviewAction["action"];
    createdAt: string;
    reviewedFieldValueId?: string;
    fieldKey?: string;
    beforeValue?: FieldValue;
    afterValue?: FieldValue;
    notes?: string;
  }): ReviewAction {
    return {
      id: randomUUID(),
      reviewTaskId: input.reviewTaskId,
      documentId: input.documentId,
      reviewedFieldValueId: input.reviewedFieldValueId,
      userId: input.userId,
      action: input.action,
      fieldKey: input.fieldKey,
      beforeValue: input.beforeValue,
      afterValue: input.afterValue,
      notes: input.notes,
      createdAt: input.createdAt
    };
  }

  private buildReviewAuditEvent(
    eventType: AuditEvent["eventType"],
    reviewTaskId: string,
    actorId: string,
    metadata: Metadata,
    occurredAt: string,
    options?: {
      summary?: string;
      reason?: string;
      changes?: AuditEvent["changes"];
      relatedEntities?: AuditEvent["relatedEntities"];
    }
  ) {
    return this.auditService.buildEvent(eventType, "review_task", reviewTaskId, {
      actorType: "user",
      actorId,
      metadata,
      occurredAt,
      summary: options?.summary,
      reason: options?.reason,
      changes: options?.changes,
      relatedEntities: options?.relatedEntities
    });
  }

  private buildPipelineStageAuditEvents(
    currentRecord: DocumentIngestionRecord,
    updatedRecord: DocumentIngestionRecord,
    occurredAt: string
  ) {
    return updatedRecord.pipelineStages.flatMap((updatedStage) => {
      const previousStage = currentRecord.pipelineStages.find((stage) => stage.stage === updatedStage.stage);

      if (!previousStage || !this.didStageChange(previousStage, updatedStage)) {
        return [];
      }

      return [
        this.auditService.buildEvent("document.pipeline_stage_changed", "document", currentRecord.document.id, {
          occurredAt,
          summary: `${updatedStage.stage} stage moved from ${previousStage.status} to ${updatedStage.status}.`,
          changes: [
            {
              field: `pipelineStages.${updatedStage.stage}`,
              before: previousStage.status,
              after: updatedStage.status
            }
          ],
          relatedEntities: [
            {
              entityType: "processing_run",
              entityId: currentRecord.processingRun.id
            }
          ],
          metadata: {
            stage: updatedStage.stage,
            fromStatus: previousStage.status,
            toStatus: updatedStage.status,
            message: updatedStage.message ?? null
          }
        })
      ];
    });
  }

  private didStageChange(previousStage: DocumentPipelineStage, updatedStage: DocumentPipelineStage) {
    return previousStage.status !== updatedStage.status || previousStage.message !== updatedStage.message;
  }
}
