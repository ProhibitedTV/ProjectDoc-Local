import { z } from "zod";

import { entityIdSchema, metadataSchema, timestampSchema } from "./common";
import { documentLifecycleStatusSchema, documentSourceTypeSchema, documentTypeSchema } from "./document";
import { provenanceSchema, sourceCitationSchema } from "./extraction";

export const searchSectionSources = [
  "source_text",
  "metadata",
  "classification",
  "extracted_field"
] as const;

export const searchSectionSourceSchema = z.enum(searchSectionSources);
export type SearchSectionSource = z.infer<typeof searchSectionSourceSchema>;

export const documentSearchFiltersSchema = z
  .object({
    query: z.string().min(1),
    documentType: documentTypeSchema.optional(),
    status: documentLifecycleStatusSchema.optional()
  })
  .strict();

export type DocumentSearchFilters = z.infer<typeof documentSearchFiltersSchema>;

export const documentContentSectionSchema = z
  .object({
    id: entityIdSchema,
    documentId: entityIdSchema,
    title: z.string().min(1),
    source: searchSectionSourceSchema,
    pageNumber: z.number().int().positive().optional(),
    text: z.string(),
    citations: z.array(sourceCitationSchema).default([]),
    provenance: provenanceSchema.optional()
  })
  .strict();

export type DocumentContentSection = z.infer<typeof documentContentSectionSchema>;

export const documentSearchResultSchema = z
  .object({
    documentId: entityIdSchema,
    originalFilename: z.string().min(1),
    projectId: entityIdSchema.optional(),
    documentType: documentTypeSchema,
    status: documentLifecycleStatusSchema,
    sectionId: entityIdSchema,
    sectionTitle: z.string().min(1),
    sectionSource: searchSectionSourceSchema,
    snippet: z.string().min(1),
    pageNumber: z.number().int().positive().optional(),
    matchedTerms: z.array(z.string().min(1)).default([]),
    score: z.number().nonnegative()
  })
  .strict();

export type DocumentSearchResult = z.infer<typeof documentSearchResultSchema>;

export const documentSearchResponseSchema = z
  .object({
    query: z.string().min(1),
    filters: z
      .object({
        documentType: documentTypeSchema.optional(),
        status: documentLifecycleStatusSchema.optional()
      })
      .strict(),
    totalResults: z.number().int().nonnegative(),
    results: z.array(documentSearchResultSchema)
  })
  .strict();

export type DocumentSearchResponse = z.infer<typeof documentSearchResponseSchema>;

export const searchableDocumentSchema = z
  .object({
    documentId: entityIdSchema,
    originalFilename: z.string().min(1),
    projectId: entityIdSchema.optional(),
    documentType: documentTypeSchema,
    status: documentLifecycleStatusSchema,
    sourceType: documentSourceTypeSchema,
    receivedAt: timestampSchema,
    metadata: metadataSchema.default({}),
    sections: z.array(documentContentSectionSchema)
  })
  .strict();

export type SearchableDocument = z.infer<typeof searchableDocumentSchema>;
