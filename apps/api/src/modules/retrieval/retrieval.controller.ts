import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import type { DocumentSearchFilters, DocumentSearchResponse, SearchableDocument } from "@projectdoc/shared";
import { documentSearchFiltersSchema } from "@projectdoc/shared";

import { RetrievalService } from "./retrieval.service";

@Controller("search")
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Get()
  async searchDocuments(
    @Query("query") query: string | undefined,
    @Query("documentType") documentType: DocumentSearchFilters["documentType"],
    @Query("status") status: DocumentSearchFilters["status"]
  ): Promise<DocumentSearchResponse> {
    return this.retrievalService.searchDocuments(this.parseFilters(query, documentType, status));
  }

  @Get("documents/:documentId")
  async getSearchableDocument(@Param("documentId") documentId: string): Promise<SearchableDocument> {
    return this.retrievalService.getSearchableDocument(documentId);
  }

  private parseFilters(
    query: string | undefined,
    documentType: DocumentSearchFilters["documentType"],
    status: DocumentSearchFilters["status"]
  ): DocumentSearchFilters {
    try {
      return documentSearchFiltersSchema.parse({
        query,
        documentType,
        status
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException("The search request payload was invalid.");
    }
  }
}
