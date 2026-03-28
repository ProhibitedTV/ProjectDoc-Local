import { Injectable } from "@nestjs/common";
import type {
  DocumentType,
  ExtractionFieldOutput,
  ExtractionInput,
  ExtractionOutput,
  FieldExtractor,
  FieldValue,
  ReviewReason,
  SourceCitation
} from "@projectdoc/shared";
import { getDocumentFieldDefinitions } from "@projectdoc/shared";

type FieldRule = {
  labels?: string[];
  patterns?: RegExp[];
  parser?: (raw: string) => FieldValue | null;
  confidence?: number;
};

type FieldMatch = {
  value: FieldValue | null;
  normalizedText?: string;
  confidence: number;
  citations: SourceCitation[];
};

const fieldRules: Partial<Record<DocumentType, Partial<Record<string, FieldRule>>>> = {
  certificate_of_insurance: {
    insured_name: { labels: ["Insured", "Insured Name"] },
    certificate_holder_name: { labels: ["Certificate Holder", "Certificate Holder Name"] },
    producer_name: { labels: ["Producer"] },
    policy_number: { labels: ["Policy Number"] },
    policy_effective_date: { labels: ["Policy Effective Date", "Effective Date"] },
    policy_expiration_date: { labels: ["Policy Expiration Date", "Expiration Date"] },
    coverage_general_liability: {
      labels: ["General Liability"],
      parser: (raw) => {
        const value = raw.trim().toLowerCase();
        if (["yes", "true", "included", "active"].includes(value)) {
          return true;
        }

        if (["no", "false", "not included", "inactive"].includes(value)) {
          return false;
        }

        return value.length > 0 ? true : null;
      },
      confidence: 0.75
    }
  },
  permit: {
    permit_number: { labels: ["Permit Number"] },
    permit_type: { labels: ["Permit Type"] },
    issuing_authority: { labels: ["Issuing Authority"] },
    site_address: { labels: ["Site Address", "Job Address"] },
    issue_date: { labels: ["Issue Date"] },
    expiration_date: { labels: ["Expiration Date"] },
    applicant_name: { labels: ["Applicant Name"] }
  },
  invoice: {
    invoice_number: { labels: ["Invoice Number", "Invoice #", "Invoice No"] },
    vendor_name: { labels: ["Vendor Name"] },
    invoice_date: { labels: ["Invoice Date"] },
    due_date: { labels: ["Due Date"] },
    purchase_order_number: { labels: ["Purchase Order Number", "PO Number", "PO #"] },
    subtotal_amount: { labels: ["Subtotal"], parser: parseCurrency },
    total_amount: { labels: ["Total Amount", "Amount Due", "Total Due"], parser: parseCurrency }
  },
  change_order: {
    change_order_number: { labels: ["Change Order Number", "CO Number"] },
    project_name: { labels: ["Project Name"] },
    vendor_name: { labels: ["Vendor Name"] },
    change_description: { labels: ["Change Description", "Description"] },
    net_change_amount: { labels: ["Net Change Amount"], parser: parseCurrency },
    change_order_date: { labels: ["Change Order Date"] },
    requested_by_name: { labels: ["Requested By"] }
  },
  lien_waiver: {
    waiver_type: { labels: ["Waiver Type"] },
    claimant_name: { labels: ["Claimant Name"] },
    customer_name: { labels: ["Customer Name", "Owner Name"] },
    project_name: { labels: ["Project Name"] },
    amount_paid: { labels: ["Amount Paid"], parser: parseCurrency },
    through_date: { labels: ["Through Date"] },
    signed_date: { labels: ["Signed Date"] }
  },
  contract: {
    agreement_title: {
      labels: ["Agreement Title"],
      patterns: [/^\s*(.+(?:agreement|contract).*)$/im]
    },
    contract_number: { labels: ["Contract Number", "Agreement Number"] },
    owner_name: { labels: ["Owner Name", "Customer Name"] },
    contractor_name: { labels: ["Contractor Name"] },
    effective_date: { labels: ["Effective Date"] },
    contract_value: { labels: ["Contract Value"], parser: parseCurrency }
  },
  inspection_report: {
    report_number: { labels: ["Report Number", "Inspection Report Number"] },
    inspector_name: { labels: ["Inspector Name"] },
    inspection_date: { labels: ["Inspection Date"] },
    inspected_entity_name: { labels: ["Inspected Entity", "Project Name"] },
    site_address: { labels: ["Site Address", "Inspection Address"] },
    outcome: { labels: ["Outcome", "Result"] }
  }
};

const buildPages = (input: ExtractionInput) =>
  input.pages.length > 0 ? input.pages : [{ pageNumber: 1, text: input.text, regions: [] }];

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildLabelPatterns = (labels: string[]): RegExp[] =>
  labels.map(
    (label) => new RegExp(`(?:^|\\n)\\s*${escapePattern(label)}\\s*[:#-]?\\s*(.+)$`, "im")
  );

function parseCurrency(raw: string): FieldValue | null {
  const normalized = raw.replace(/[$,]/g, "").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

const defaultParser = (raw: string): FieldValue | null => {
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
};

const excerptForMatch = (text: string, matchedText: string) => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const normalizedMatch = matchedText.replace(/\s+/g, " ").trim();
  const index = normalizedText.indexOf(normalizedMatch);

  if (index === -1) {
    return normalizedMatch;
  }

  const start = Math.max(0, index - 24);
  const end = Math.min(normalizedText.length, index + normalizedMatch.length + 48);
  return normalizedText.slice(start, end).trim();
};

const findFieldMatch = (
  input: ExtractionInput,
  rule: FieldRule | undefined
): FieldMatch => {
  const parser = rule?.parser ?? defaultParser;
  const confidence = rule?.confidence ?? 0.9;
  const patterns = [...(rule?.patterns ?? []), ...(rule?.labels ? buildLabelPatterns(rule.labels) : [])];
  const pages = buildPages(input);

  for (const page of pages) {
    for (const pattern of patterns) {
      const match = page.text.match(pattern);

      if (!match) {
        continue;
      }

      const rawValue = (match[1] ?? match[0]).trim();
      const value = parser(rawValue);

      return {
        value,
        normalizedText: rawValue,
        confidence: value === null ? 0 : confidence,
        citations: [
          {
            documentId: input.documentId,
            pageId: page.pageId,
            pageNumber: page.pageNumber,
            excerpt: excerptForMatch(page.text, match[0])
          }
        ]
      };
    }
  }

  return {
    value: null,
    confidence: 0,
    citations: []
  };
};

@Injectable()
export class DeterministicStubExtractorProvider implements FieldExtractor {
  readonly name = "deterministic-stub-extractor";
  private readonly version = "0.1.0";
  private readonly method = "label_value_stub";

  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    const createdAt = new Date().toISOString();
    const definitions = getDocumentFieldDefinitions(input.documentType);
    const provenance = {
      processingRunId: input.processingRunId,
      provider: this.name,
      providerVersion: this.version,
      method: this.method,
      createdAt
    };

    if (input.documentType === "unknown") {
      return {
        documentId: input.documentId,
        processingRunId: input.processingRunId,
        documentType: input.documentType,
        schemaName: "unknown.default",
        schemaVersion: "0.1.0",
        overallConfidence: 0,
        reviewRecommended: true,
        reviewReasons: ["low_confidence"],
        missingRequiredFieldKeys: [],
        warnings: ["Unknown documents are not extracted by the default stub extractor."],
        fields: [],
        provenance,
        createdAt
      };
    }

    const rulesForType = fieldRules[input.documentType] ?? {};
    const fields: ExtractionFieldOutput[] = definitions.map((definition) => {
      const match = findFieldMatch(input, rulesForType[definition.fieldKey]);
      const missingRequired = definition.required && match.value === null;
      const lowConfidence = match.value !== null && match.confidence < 0.75;
      const reviewReasons: ReviewReason[] = [
        ...(missingRequired ? (["missing_required_field"] as const) : []),
        ...(lowConfidence ? (["low_confidence"] as const) : [])
      ];

      return {
        fieldKey: definition.fieldKey,
        label: definition.label,
        valueType: definition.valueType,
        required: definition.required,
        value: match.value,
        normalizedText: match.normalizedText,
        confidence: match.confidence,
        reviewRecommended: reviewReasons.length > 0,
        reviewReasons,
        citations: match.citations,
        provenance
      };
    });

    const missingRequiredFieldKeys = fields
      .filter((field) => field.required && field.value === null)
      .map((field) => field.fieldKey);
    const nonZeroConfidenceFields = fields.filter((field) => field.confidence > 0);
    const overallConfidence =
      nonZeroConfidenceFields.length > 0
        ? nonZeroConfidenceFields.reduce((sum, field) => sum + field.confidence, 0) / nonZeroConfidenceFields.length
        : 0;
    const reviewRecommended = missingRequiredFieldKeys.length > 0 || fields.some((field) => field.reviewRecommended);
    const reviewReasons: ReviewReason[] = [
      ...(missingRequiredFieldKeys.length > 0 ? (["missing_required_field"] as const) : []),
      ...(overallConfidence < 0.7 ? (["low_confidence"] as const) : [])
    ];

    return {
      documentId: input.documentId,
      processingRunId: input.processingRunId,
      documentType: input.documentType,
      schemaName: `${input.documentType}.default`,
      schemaVersion: "0.1.0",
      overallConfidence,
      reviewRecommended,
      reviewReasons: [...new Set(reviewReasons)],
      missingRequiredFieldKeys,
      warnings:
        fields.filter((field) => field.value !== null).length === 0
          ? ["No labeled fields matched the current stub extraction rules."]
          : [],
      fields,
      provenance,
      createdAt
    };
  }
}
