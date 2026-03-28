import { z } from "zod";

import {
  boundingBoxSchema,
  confidenceScoreSchema,
  entityIdSchema,
  fieldValueSchema,
  metadataSchema,
  timestampSchema
} from "./common";
import { type DocumentType, documentTypeSchema } from "./document";
import { provenanceSchema, sourceCitationSchema } from "./extraction";
import { reviewReasonSchema } from "./review";

export const analysisPageRegionSchema = z
  .object({
    regionId: entityIdSchema.optional(),
    text: z.string(),
    boundingBox: boundingBoxSchema.optional()
  })
  .strict();

export type AnalysisPageRegion = z.infer<typeof analysisPageRegionSchema>;

export const analysisPageSchema = z
  .object({
    pageId: entityIdSchema.optional(),
    pageNumber: z.number().int().positive(),
    text: z.string(),
    regions: z.array(analysisPageRegionSchema).default([])
  })
  .strict();

export type AnalysisPage = z.infer<typeof analysisPageSchema>;

export const classificationInputSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    text: z.string(),
    pages: z.array(analysisPageSchema).default([]),
    metadata: metadataSchema.default({})
  })
  .strict();

export type ClassificationInput = z.infer<typeof classificationInputSchema>;

export const classificationCandidateSchema = z
  .object({
    documentType: documentTypeSchema,
    confidence: confidenceScoreSchema,
    matchedSignals: z.array(z.string().min(1)).default([]),
    citations: z.array(sourceCitationSchema).default([])
  })
  .strict();

export type ClassificationCandidate = z.infer<typeof classificationCandidateSchema>;

export const classificationOutputSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    documentType: documentTypeSchema,
    confidence: confidenceScoreSchema,
    method: z.string().min(1),
    reasons: z.array(z.string().min(1)).default([]),
    candidates: z.array(classificationCandidateSchema).default([]),
    reviewRecommended: z.boolean(),
    reviewReasons: z.array(reviewReasonSchema).default([]),
    provenance: provenanceSchema,
    createdAt: timestampSchema
  })
  .strict();

export type ClassificationOutput = z.infer<typeof classificationOutputSchema>;

export const extractionFieldValueTypes = [
  "string",
  "text",
  "identifier",
  "date",
  "currency",
  "number",
  "boolean",
  "party_name",
  "address"
] as const;

export const extractionFieldValueTypeSchema = z.enum(extractionFieldValueTypes);
export type ExtractionFieldValueType = z.infer<typeof extractionFieldValueTypeSchema>;

export const documentFieldDefinitionSchema = z
  .object({
    documentType: documentTypeSchema,
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    valueType: extractionFieldValueTypeSchema,
    required: z.boolean(),
    description: z.string().min(1)
  })
  .strict();

export type DocumentFieldDefinition = z.infer<typeof documentFieldDefinitionSchema>;

export const extractionInputSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    documentType: documentTypeSchema,
    text: z.string(),
    pages: z.array(analysisPageSchema).default([]),
    metadata: metadataSchema.default({})
  })
  .strict();

export type ExtractionInput = z.infer<typeof extractionInputSchema>;

export const extractionFieldOutputSchema = z
  .object({
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    valueType: extractionFieldValueTypeSchema,
    required: z.boolean(),
    value: fieldValueSchema.nullable(),
    normalizedText: z.string().optional(),
    confidence: confidenceScoreSchema,
    reviewRecommended: z.boolean(),
    reviewReasons: z.array(reviewReasonSchema).default([]),
    citations: z.array(sourceCitationSchema).default([]),
    provenance: provenanceSchema
  })
  .strict();

export type ExtractionFieldOutput = z.infer<typeof extractionFieldOutputSchema>;

export const extractionOutputSchema = z
  .object({
    documentId: entityIdSchema,
    processingRunId: entityIdSchema,
    documentType: documentTypeSchema,
    schemaName: z.string().min(1),
    schemaVersion: z.string().min(1),
    overallConfidence: confidenceScoreSchema,
    reviewRecommended: z.boolean(),
    reviewReasons: z.array(reviewReasonSchema).default([]),
    missingRequiredFieldKeys: z.array(z.string().min(1)).default([]),
    warnings: z.array(z.string().min(1)).default([]),
    fields: z.array(extractionFieldOutputSchema),
    provenance: provenanceSchema,
    createdAt: timestampSchema
  })
  .strict();

export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;

export const documentFieldCatalog: Record<DocumentType, DocumentFieldDefinition[]> = {
  certificate_of_insurance: [
    {
      documentType: "certificate_of_insurance",
      fieldKey: "insured_name",
      label: "Insured Name",
      valueType: "party_name",
      required: true,
      description: "Named insured listed on the certificate."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "certificate_holder_name",
      label: "Certificate Holder",
      valueType: "party_name",
      required: true,
      description: "Party listed as the certificate holder."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "producer_name",
      label: "Producer",
      valueType: "party_name",
      required: false,
      description: "Broker or producer shown on the certificate."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "policy_number",
      label: "Policy Number",
      valueType: "identifier",
      required: true,
      description: "Policy number for the primary listed coverage."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "policy_effective_date",
      label: "Policy Effective Date",
      valueType: "date",
      required: false,
      description: "Effective date shown for the listed policy."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "policy_expiration_date",
      label: "Policy Expiration Date",
      valueType: "date",
      required: true,
      description: "Expiration date shown for the listed policy."
    },
    {
      documentType: "certificate_of_insurance",
      fieldKey: "coverage_general_liability",
      label: "General Liability Coverage",
      valueType: "boolean",
      required: false,
      description: "Whether general liability coverage is indicated."
    }
  ],
  permit: [
    {
      documentType: "permit",
      fieldKey: "permit_number",
      label: "Permit Number",
      valueType: "identifier",
      required: true,
      description: "Permit identifier assigned by the issuing authority."
    },
    {
      documentType: "permit",
      fieldKey: "permit_type",
      label: "Permit Type",
      valueType: "string",
      required: false,
      description: "Type of permit or work category."
    },
    {
      documentType: "permit",
      fieldKey: "issuing_authority",
      label: "Issuing Authority",
      valueType: "party_name",
      required: true,
      description: "Agency or municipality issuing the permit."
    },
    {
      documentType: "permit",
      fieldKey: "site_address",
      label: "Site Address",
      valueType: "address",
      required: false,
      description: "Address for the permitted work."
    },
    {
      documentType: "permit",
      fieldKey: "issue_date",
      label: "Issue Date",
      valueType: "date",
      required: false,
      description: "Date the permit was issued."
    },
    {
      documentType: "permit",
      fieldKey: "expiration_date",
      label: "Expiration Date",
      valueType: "date",
      required: true,
      description: "Date the permit expires."
    },
    {
      documentType: "permit",
      fieldKey: "applicant_name",
      label: "Applicant Name",
      valueType: "party_name",
      required: false,
      description: "Applicant or contractor named on the permit."
    }
  ],
  invoice: [
    {
      documentType: "invoice",
      fieldKey: "invoice_number",
      label: "Invoice Number",
      valueType: "identifier",
      required: true,
      description: "Invoice identifier from the vendor."
    },
    {
      documentType: "invoice",
      fieldKey: "vendor_name",
      label: "Vendor Name",
      valueType: "party_name",
      required: true,
      description: "Vendor or subcontractor issuing the invoice."
    },
    {
      documentType: "invoice",
      fieldKey: "invoice_date",
      label: "Invoice Date",
      valueType: "date",
      required: true,
      description: "Invoice issue date."
    },
    {
      documentType: "invoice",
      fieldKey: "due_date",
      label: "Due Date",
      valueType: "date",
      required: false,
      description: "Payment due date."
    },
    {
      documentType: "invoice",
      fieldKey: "purchase_order_number",
      label: "Purchase Order Number",
      valueType: "identifier",
      required: false,
      description: "PO number referenced by the invoice."
    },
    {
      documentType: "invoice",
      fieldKey: "subtotal_amount",
      label: "Subtotal Amount",
      valueType: "currency",
      required: false,
      description: "Subtotal before taxes or fees."
    },
    {
      documentType: "invoice",
      fieldKey: "total_amount",
      label: "Total Amount",
      valueType: "currency",
      required: true,
      description: "Total amount due on the invoice."
    }
  ],
  change_order: [
    {
      documentType: "change_order",
      fieldKey: "change_order_number",
      label: "Change Order Number",
      valueType: "identifier",
      required: true,
      description: "Identifier for the change order."
    },
    {
      documentType: "change_order",
      fieldKey: "project_name",
      label: "Project Name",
      valueType: "string",
      required: false,
      description: "Project name referenced by the change order."
    },
    {
      documentType: "change_order",
      fieldKey: "vendor_name",
      label: "Vendor Name",
      valueType: "party_name",
      required: false,
      description: "Vendor or subcontractor tied to the change."
    },
    {
      documentType: "change_order",
      fieldKey: "change_description",
      label: "Change Description",
      valueType: "text",
      required: true,
      description: "Description of the requested scope or pricing change."
    },
    {
      documentType: "change_order",
      fieldKey: "net_change_amount",
      label: "Net Change Amount",
      valueType: "currency",
      required: true,
      description: "Net amount added or deducted by the change order."
    },
    {
      documentType: "change_order",
      fieldKey: "change_order_date",
      label: "Change Order Date",
      valueType: "date",
      required: false,
      description: "Date associated with the change order."
    },
    {
      documentType: "change_order",
      fieldKey: "requested_by_name",
      label: "Requested By",
      valueType: "party_name",
      required: false,
      description: "Person requesting or approving the change."
    }
  ],
  lien_waiver: [
    {
      documentType: "lien_waiver",
      fieldKey: "waiver_type",
      label: "Waiver Type",
      valueType: "string",
      required: true,
      description: "Type of lien waiver or release."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "claimant_name",
      label: "Claimant Name",
      valueType: "party_name",
      required: true,
      description: "Party waiving lien rights."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "customer_name",
      label: "Customer Name",
      valueType: "party_name",
      required: false,
      description: "Owner, customer, or hiring party named on the waiver."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "project_name",
      label: "Project Name",
      valueType: "string",
      required: false,
      description: "Project named on the waiver."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "amount_paid",
      label: "Amount Paid",
      valueType: "currency",
      required: false,
      description: "Payment amount referenced by the waiver."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "through_date",
      label: "Through Date",
      valueType: "date",
      required: false,
      description: "Work-through or payment-through date."
    },
    {
      documentType: "lien_waiver",
      fieldKey: "signed_date",
      label: "Signed Date",
      valueType: "date",
      required: true,
      description: "Date the waiver was signed."
    }
  ],
  contract: [
    {
      documentType: "contract",
      fieldKey: "agreement_title",
      label: "Agreement Title",
      valueType: "string",
      required: true,
      description: "Title or heading of the agreement."
    },
    {
      documentType: "contract",
      fieldKey: "contract_number",
      label: "Contract Number",
      valueType: "identifier",
      required: false,
      description: "Contract number or agreement identifier."
    },
    {
      documentType: "contract",
      fieldKey: "owner_name",
      label: "Owner Name",
      valueType: "party_name",
      required: false,
      description: "Owner or customer party named in the agreement."
    },
    {
      documentType: "contract",
      fieldKey: "contractor_name",
      label: "Contractor Name",
      valueType: "party_name",
      required: true,
      description: "Prime contractor or signing contractor."
    },
    {
      documentType: "contract",
      fieldKey: "effective_date",
      label: "Effective Date",
      valueType: "date",
      required: true,
      description: "Date the contract becomes effective."
    },
    {
      documentType: "contract",
      fieldKey: "contract_value",
      label: "Contract Value",
      valueType: "currency",
      required: false,
      description: "Total contract value if explicitly stated."
    }
  ],
  inspection_report: [
    {
      documentType: "inspection_report",
      fieldKey: "report_number",
      label: "Report Number",
      valueType: "identifier",
      required: false,
      description: "Inspection report identifier."
    },
    {
      documentType: "inspection_report",
      fieldKey: "inspector_name",
      label: "Inspector Name",
      valueType: "party_name",
      required: true,
      description: "Inspector or agency representative."
    },
    {
      documentType: "inspection_report",
      fieldKey: "inspection_date",
      label: "Inspection Date",
      valueType: "date",
      required: true,
      description: "Date the inspection took place."
    },
    {
      documentType: "inspection_report",
      fieldKey: "inspected_entity_name",
      label: "Inspected Entity",
      valueType: "party_name",
      required: false,
      description: "Company, site, or project being inspected."
    },
    {
      documentType: "inspection_report",
      fieldKey: "site_address",
      label: "Site Address",
      valueType: "address",
      required: false,
      description: "Address of the inspected site."
    },
    {
      documentType: "inspection_report",
      fieldKey: "outcome",
      label: "Outcome",
      valueType: "string",
      required: true,
      description: "Inspection result such as pass, fail, or correction required."
    }
  ],
  unknown: []
};

export const getDocumentFieldDefinitions = (documentType: DocumentType): DocumentFieldDefinition[] =>
  documentFieldCatalog[documentType].map((definition) => ({ ...definition }));
