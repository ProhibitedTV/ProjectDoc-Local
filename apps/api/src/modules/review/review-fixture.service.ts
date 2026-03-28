import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type {
  ClassificationCandidate,
  ClassificationOutput,
  DocumentIngestionRecord,
  DocumentType,
  ExtractionFieldOutput,
  ExtractionOutput,
  ReviewItemRecord,
  ReviewedFieldValue,
  ReviewPriority,
  ReviewReason,
  ReviewTask
} from "@projectdoc/shared";
import { getDocumentFieldDefinitions } from "@projectdoc/shared";

type TemplateValues = Record<string, string | number | boolean | null>;

const documentTypeKeywords: Array<{ type: DocumentType; keywords: string[] }> = [
  { type: "certificate_of_insurance", keywords: ["certificate", "insurance", "coi"] },
  { type: "permit", keywords: ["permit"] },
  { type: "invoice", keywords: ["invoice", "bill"] },
  { type: "change_order", keywords: ["change-order", "change_order", "change order"] },
  { type: "lien_waiver", keywords: ["lien", "waiver"] },
  { type: "contract", keywords: ["contract", "agreement"] },
  { type: "inspection_report", keywords: ["inspection", "report"] }
];

const stableScore = (value: string) =>
  value.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);

const toTitle = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const inferDocumentType = (record: DocumentIngestionRecord): DocumentType => {
  const normalizedName = record.document.originalFilename.toLowerCase();

  for (const candidate of documentTypeKeywords) {
    if (candidate.keywords.some((keyword) => normalizedName.includes(keyword))) {
      return candidate.type;
    }
  }

  const fallbackTypes = documentTypeKeywords.map((candidate) => candidate.type);
  return fallbackTypes[stableScore(record.document.id) % fallbackTypes.length] ?? "unknown";
};

const buildTemplateValues = (documentType: DocumentType, record: DocumentIngestionRecord): TemplateValues => {
  const baseName = record.document.originalFilename.replace(/\.[^.]+$/, "");
  const normalizedBase = toTitle(baseName);
  const suffix = record.document.id.slice(0, 8).toUpperCase();

  switch (documentType) {
    case "invoice":
      return {
        invoice_number: `INV-${suffix}`,
        vendor_name: `${normalizedBase} Vendor`,
        invoice_date: "2026-03-20",
        due_date: "2026-04-19",
        purchase_order_number: `PO-${suffix.slice(0, 5)}`,
        subtotal_amount: 4860.45,
        total_amount: 5432.1
      };
    case "permit":
      return {
        permit_number: `PERM-${suffix}`,
        permit_type: "Electrical",
        issuing_authority: "City of Denver",
        site_address: "123 Main St, Denver, CO 80205",
        issue_date: "2026-03-10",
        expiration_date: "2026-09-10",
        applicant_name: `${normalizedBase} Construction`
      };
    case "certificate_of_insurance":
      return {
        insured_name: `${normalizedBase} Builders`,
        certificate_holder_name: "ProjectDoc Local Demo GC",
        producer_name: "Mountain West Insurance",
        policy_number: `POL-${suffix}`,
        policy_effective_date: "2026-01-01",
        policy_expiration_date: "2026-12-31",
        coverage_general_liability: true
      };
    case "change_order":
      return {
        change_order_number: `CO-${suffix}`,
        project_name: `${normalizedBase} Renovation`,
        vendor_name: `${normalizedBase} Subcontracting`,
        change_description: "Additional conduit and panel relocation required by field conditions.",
        net_change_amount: 1875,
        change_order_date: "2026-03-18",
        requested_by_name: "Jordan Lee"
      };
    case "lien_waiver":
      return {
        waiver_type: "Conditional Progress Waiver",
        claimant_name: `${normalizedBase} Interiors`,
        customer_name: "ProjectDoc Local Demo GC",
        project_name: `${normalizedBase} Tenant Finish`,
        amount_paid: 3200,
        through_date: "2026-03-15",
        signed_date: "2026-03-16"
      };
    case "contract":
      return {
        agreement_title: `${normalizedBase} Master Services Agreement`,
        contract_number: `CTR-${suffix}`,
        owner_name: "ProjectDoc Local Demo Owner",
        contractor_name: `${normalizedBase} Contractors`,
        effective_date: "2026-03-01",
        contract_value: 125000
      };
    case "inspection_report":
      return {
        report_number: `IR-${suffix}`,
        inspector_name: "Riley Morgan",
        inspection_date: "2026-03-22",
        inspected_entity_name: `${normalizedBase} Site`,
        site_address: "456 Market St, Denver, CO 80202",
        outcome: "Correction required"
      };
    case "unknown":
      return {};
  }
};

const buildCandidateList = (
  record: DocumentIngestionRecord,
  inferredType: DocumentType,
  confidence: number
): ClassificationCandidate[] => {
  const secondaryTypes = documentTypeKeywords
    .map((candidate) => candidate.type)
    .filter((documentType) => documentType !== inferredType)
    .slice(0, 2);

  const primaryKeyword = documentTypeKeywords.find((candidate) => candidate.type === inferredType)?.keywords[0];

  const primaryCandidate: ClassificationCandidate = {
    documentType: inferredType,
    confidence,
    matchedSignals: primaryKeyword ? [primaryKeyword] : [],
    citations: [
      {
        documentId: record.document.id,
        pageNumber: 1,
        excerpt: `${record.document.originalFilename} suggests ${toTitle(inferredType)}.`
      }
    ]
  };

  return [
    primaryCandidate,
    ...secondaryTypes.map((documentType, index) => ({
      documentType,
      confidence: Math.max(0.24 - index * 0.05, 0.1),
      matchedSignals: [],
      citations: []
    }))
  ];
};

@Injectable()
export class ReviewFixtureService {
  buildSeedRecord(record: DocumentIngestionRecord): ReviewItemRecord {
    const createdAt = new Date().toISOString();
    const inferredType = inferDocumentType(record);
    const templates = buildTemplateValues(inferredType, record);
    const fieldDefinitions = getDocumentFieldDefinitions(inferredType);
    const weakFieldIndex = fieldDefinitions.length > 0 ? stableScore(record.document.id) % fieldDefinitions.length : -1;
    const weakFieldReason: ReviewReason =
      fieldDefinitions[weakFieldIndex]?.required === true ? "missing_required_field" : "low_confidence";
    const classification = this.buildClassificationOutput(record, inferredType, createdAt);
    const extraction = this.buildExtractionOutput(
      record,
      inferredType,
      fieldDefinitions,
      templates,
      weakFieldIndex,
      weakFieldReason,
      createdAt
    );
    const reviewedFields = this.buildReviewedFields(record, extraction);
    const reason = extraction.missingRequiredFieldKeys.length > 0 ? "missing_required_field" : "low_confidence";
    const priority: ReviewPriority = extraction.missingRequiredFieldKeys.length > 0 ? "high" : "normal";
    const task: ReviewTask = {
      id: randomUUID(),
      documentId: record.document.id,
      processingRunId: record.processingRun.id,
      reason,
      priority,
      status: "open",
      createdAt
    };

    return {
      task,
      classification,
      extraction,
      reviewedFields,
      actions: [],
      auditEvents: [],
      createdAt,
      updatedAt: createdAt
    };
  }

  private buildClassificationOutput(
    record: DocumentIngestionRecord,
    inferredType: DocumentType,
    createdAt: string
  ): ClassificationOutput {
    const confidence = inferredType === "unknown" ? 0.42 : 0.74;

    return {
      documentId: record.document.id,
      processingRunId: record.processingRun.id,
      documentType: inferredType,
      confidence,
      method: "review_queue_stub",
      reasons: [
        inferredType === "unknown"
          ? "Filename and current metadata did not strongly indicate a supported document type."
          : `Filename and stub analysis suggest ${toTitle(inferredType)}.`
      ],
      candidates: buildCandidateList(record, inferredType, confidence),
      reviewRecommended: confidence < 0.8,
      reviewReasons: ["low_confidence"],
      provenance: {
        processingRunId: record.processingRun.id,
        provider: "api-review-fixture",
        providerVersion: "0.1.0",
        method: "filename_template_stub",
        createdAt
      },
      createdAt
    };
  }

  private buildExtractionOutput(
    record: DocumentIngestionRecord,
    inferredType: DocumentType,
    fieldDefinitions: ReturnType<typeof getDocumentFieldDefinitions>,
    templates: TemplateValues,
    weakFieldIndex: number,
    weakFieldReason: ReviewReason,
    createdAt: string
  ): ExtractionOutput {
    const fields: ExtractionFieldOutput[] = fieldDefinitions.map((definition, index) => {
      const forceWeakField = index === weakFieldIndex;
      const baseValue = templates[definition.fieldKey] ?? null;
      const value = forceWeakField && definition.required ? null : baseValue;
      const confidence = value === null ? 0.32 : forceWeakField ? 0.58 : definition.required ? 0.86 : 0.78;
      const reviewReasons = value === null ? [weakFieldReason] : forceWeakField ? ["low_confidence"] : [];

      return {
        fieldKey: definition.fieldKey,
        label: definition.label,
        valueType: definition.valueType,
        required: definition.required,
        value,
        normalizedText: value === null ? undefined : String(value),
        confidence,
        reviewRecommended: reviewReasons.length > 0,
        reviewReasons,
        citations: [
          {
            documentId: record.document.id,
            pageNumber: 1,
            excerpt:
              value === null
                ? `${definition.label}: review required`
                : `${definition.label}: ${String(value)}`
          }
        ],
        provenance: {
          processingRunId: record.processingRun.id,
          provider: "api-review-fixture",
          providerVersion: "0.1.0",
          method: "template_field_stub",
          createdAt
        }
      };
    });

    const missingRequiredFieldKeys = fields
      .filter((field) => field.required && field.value === null)
      .map((field) => field.fieldKey);
    const overallConfidence =
      fields.length > 0
        ? fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length
        : 0;

    return {
      documentId: record.document.id,
      processingRunId: record.processingRun.id,
      documentType: inferredType,
      schemaName: `${inferredType}.review_queue_stub`,
      schemaVersion: "0.1.0",
      overallConfidence,
      reviewRecommended: missingRequiredFieldKeys.length > 0 || fields.some((field) => field.reviewRecommended),
      reviewReasons: missingRequiredFieldKeys.length > 0 ? ["missing_required_field"] : ["low_confidence"],
      missingRequiredFieldKeys,
      warnings:
        inferredType === "unknown"
          ? ["Unknown documents stay review-first until a real classifier and extractor are connected."]
          : ["Machine output is currently stubbed for review workflow development."],
      fields,
      provenance: {
        processingRunId: record.processingRun.id,
        provider: "api-review-fixture",
        providerVersion: "0.1.0",
        method: "template_extraction_stub",
        createdAt
      },
      createdAt
    };
  }

  private buildReviewedFields(
    record: DocumentIngestionRecord,
    extraction: ExtractionOutput
  ): ReviewedFieldValue[] {
    return extraction.fields.map((field) => ({
      id: randomUUID(),
      documentId: record.document.id,
      fieldKey: field.fieldKey,
      fieldLabel: field.label,
      sourceExtractedFieldId: `${record.processingRun.id}:${field.fieldKey}`,
      machineValue: field.value,
      machineConfidence: field.confidence,
      authoritativeValue: field.value,
      authoritativeValueSource: "machine",
      reviewStatus: "unreviewed",
      citations: field.citations
    }));
  }
}
