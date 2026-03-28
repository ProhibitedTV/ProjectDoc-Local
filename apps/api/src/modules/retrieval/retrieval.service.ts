import { readFile } from "node:fs/promises";

import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  DocumentContentSection,
  DocumentIngestionRecord,
  DocumentSearchFilters,
  DocumentSearchResponse,
  DocumentSearchResult,
  ReviewItemRecord,
  SearchableDocument
} from "@projectdoc/shared";

import { DocumentRecordStoreService } from "../ingestion/document-record-store.service";
import { FileStorageService } from "../ingestion/file-storage.service";
import { ReviewFixtureService } from "../review/review-fixture.service";
import { ReviewRecordStoreService } from "../review/review-record-store.service";

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

const countOccurrences = (haystack: string, needle: string) => {
  if (!needle) {
    return 0;
  }

  let start = 0;
  let count = 0;

  while (true) {
    const index = haystack.indexOf(needle, start);

    if (index === -1) {
      return count;
    }

    count += 1;
    start = index + needle.length;
  }
};

const buildSnippet = (text: string, terms: string[]) => {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (normalizedText.length === 0) {
    return "No searchable content was available for this section.";
  }

  const firstHitIndex = terms.reduce((closest, term) => {
    const index = normalizedText.toLowerCase().indexOf(term);

    if (index === -1) {
      return closest;
    }

    if (closest === -1) {
      return index;
    }

    return Math.min(closest, index);
  }, -1);

  if (firstHitIndex === -1) {
    return normalizedText.slice(0, 180);
  }

  const start = Math.max(0, firstHitIndex - 48);
  const end = Math.min(normalizedText.length, firstHitIndex + 132);
  return normalizedText.slice(start, end).trim();
};

const formatFieldValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "Not extracted";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

@Injectable()
export class RetrievalService {
  constructor(
    private readonly documentRecordStoreService: DocumentRecordStoreService,
    private readonly fileStorageService: FileStorageService,
    private readonly reviewFixtureService: ReviewFixtureService,
    private readonly reviewRecordStoreService: ReviewRecordStoreService
  ) {}

  async searchDocuments(filters: DocumentSearchFilters): Promise<DocumentSearchResponse> {
    const documents = await this.documentRecordStoreService.list();
    const queryTerms = [...new Set(tokenize(filters.query))];
    const results: Array<DocumentSearchResult & { receivedAt: string }> = [];

    for (const documentRecord of documents) {
      const searchableDocument = await this.buildSearchableDocument(documentRecord);

      if (filters.documentType && searchableDocument.documentType !== filters.documentType) {
        continue;
      }

      if (filters.status && searchableDocument.status !== filters.status) {
        continue;
      }

      for (const section of searchableDocument.sections) {
        const searchableText = `${section.title}\n${section.text}`.toLowerCase();
        const matchedTerms = queryTerms.filter((term) => searchableText.includes(term));

        if (matchedTerms.length === 0) {
          continue;
        }

        const rawTermScore = matchedTerms.reduce(
          (sum, term) => sum + countOccurrences(searchableText, term),
          0
        );
        const sourceBoost =
          section.source === "source_text"
            ? 6
            : section.source === "extracted_field"
              ? 4
              : section.source === "classification"
                ? 2
                : 1;

        results.push({
          documentId: searchableDocument.documentId,
          originalFilename: searchableDocument.originalFilename,
          projectId: searchableDocument.projectId,
          documentType: searchableDocument.documentType,
          status: searchableDocument.status,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionSource: section.source,
          snippet: buildSnippet(section.text, matchedTerms),
          pageNumber: section.pageNumber,
          matchedTerms,
          score: matchedTerms.length * 10 + rawTermScore + sourceBoost,
          receivedAt: searchableDocument.receivedAt
        });
      }
    }

    const sortedResults = results
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return right.receivedAt.localeCompare(left.receivedAt);
      })
      .map(({ receivedAt: _receivedAt, ...result }) => result);

    return {
      query: filters.query,
      filters: {
        documentType: filters.documentType,
        status: filters.status
      },
      totalResults: sortedResults.length,
      results: sortedResults
    };
  }

  async getSearchableDocument(documentId: string): Promise<SearchableDocument> {
    const documentRecord = await this.documentRecordStoreService.findById(documentId);

    if (!documentRecord) {
      throw new NotFoundException(`Document ${documentId} was not found.`);
    }

    return this.buildSearchableDocument(documentRecord);
  }

  describeCapability() {
    return {
      features: ["keyword_search", "document_content_sections", "page_citations"],
      status: "mvp_local_search",
      nextStep: "Add PostgreSQL full-text indexing, then hybrid semantic retrieval with stored citations."
    } as const;
  }

  private async buildSearchableDocument(documentRecord: DocumentIngestionRecord): Promise<SearchableDocument> {
    const machineRecord =
      (await this.reviewRecordStoreService.findByDocumentId(documentRecord.document.id)) ??
      this.reviewFixtureService.buildSeedRecord(documentRecord);
    const effectiveDocumentType =
      documentRecord.document.documentType === "unknown"
        ? machineRecord.classification.documentType
        : documentRecord.document.documentType;
    const sections = await this.buildSections(documentRecord, machineRecord);

    return {
      documentId: documentRecord.document.id,
      originalFilename: documentRecord.document.originalFilename,
      projectId: documentRecord.document.projectId,
      documentType: effectiveDocumentType,
      status: documentRecord.document.status,
      sourceType: documentRecord.document.sourceType,
      receivedAt: documentRecord.document.receivedAt,
      metadata: documentRecord.document.metadata,
      sections
    };
  }

  private async buildSections(
    documentRecord: DocumentIngestionRecord,
    machineRecord: ReviewItemRecord
  ): Promise<DocumentContentSection[]> {
    const sections: DocumentContentSection[] = [
      {
        id: `${documentRecord.document.id}:metadata`,
        documentId: documentRecord.document.id,
        title: "Document metadata",
        source: "metadata",
        text: [
          `Filename: ${documentRecord.document.originalFilename}`,
          `Status: ${documentRecord.document.status}`,
          `Source: ${documentRecord.document.sourceType}`,
          `Project: ${documentRecord.document.projectId ?? "Unassigned"}`
        ].join("\n"),
        citations: []
      },
      {
        id: `${documentRecord.document.id}:classification`,
        documentId: documentRecord.document.id,
        title: "Classification summary",
        source: "classification",
        pageNumber: machineRecord.classification.candidates[0]?.citations[0]?.pageNumber,
        text: [
          `Predicted type: ${machineRecord.classification.documentType}`,
          ...machineRecord.classification.reasons
        ].join("\n"),
        citations:
          machineRecord.classification.candidates.flatMap((candidate) => candidate.citations).slice(0, 3),
        provenance: machineRecord.classification.provenance
      }
    ];

    const originalFile = documentRecord.files.find((file) => file.kind === "original");

    if (originalFile && documentRecord.document.mimeType === "text/plain") {
      const absolutePath = this.fileStorageService.resolveStoragePath(originalFile.storagePath);
      const fileText = await readFile(absolutePath, "utf8");
      const sourceSections = fileText
        .split(/\r?\n\r?\n+/)
        .map((section) => section.trim())
        .filter((section) => section.length > 0)
        .map((section, index) => ({
          id: `${documentRecord.document.id}:source:${String(index + 1)}`,
          documentId: documentRecord.document.id,
          title: `Source text ${String(index + 1)}`,
          source: "source_text" as const,
          pageNumber: 1,
          text: section,
          citations: [
            {
              documentId: documentRecord.document.id,
              pageNumber: 1,
              excerpt: buildSnippet(section, tokenize(section).slice(0, 4))
            }
          ]
        }));

      sections.push(...sourceSections);
    }

    sections.push(
      ...machineRecord.extraction.fields.map((field, index) => ({
        id: `${documentRecord.document.id}:field:${String(index + 1)}`,
        documentId: documentRecord.document.id,
        title: field.label,
        source: "extracted_field" as const,
        pageNumber: field.citations[0]?.pageNumber,
        text: [
          `${field.label}: ${formatFieldValue(field.value)}`,
          field.reviewRecommended
            ? `Review required because ${field.reviewReasons.join(", ")}.`
            : "No review flag was raised for this field."
        ].join("\n"),
        citations: field.citations,
        provenance: field.provenance
      }))
    );

    return sections;
  }
}
