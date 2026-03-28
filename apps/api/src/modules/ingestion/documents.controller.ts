import type { MultipartFile } from "@fastify/multipart";
import type { FastifyRequest } from "fastify";
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req
} from "@nestjs/common";
import type { DocumentIngestionRecord, DocumentUploadResponse } from "@projectdoc/shared";

import { IngestionService } from "./ingestion.service";

type MultipartRequest = FastifyRequest & {
  file: () => Promise<MultipartFile | undefined>;
};

@Controller("documents")
export class DocumentsController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("upload")
  async uploadDocument(@Req() request: MultipartRequest): Promise<DocumentUploadResponse> {
    const file = await request.file();

    if (!file) {
      throw new BadRequestException("No file was received. Submit a multipart request with a 'file' field.");
    }

    const buffer = await file.toBuffer();

    return this.ingestionService.uploadDocument({
      fileName: file.filename,
      buffer,
      reportedMimeType: file.mimetype
    });
  }

  @Get(":documentId")
  async getDocument(@Param("documentId") documentId: string): Promise<DocumentIngestionRecord> {
    const record = await this.ingestionService.getDocument(documentId);

    if (!record) {
      throw new NotFoundException(`Document ${documentId} was not found.`);
    }

    return record;
  }

  @Get()
  async listDocuments(): Promise<DocumentIngestionRecord[]> {
    return this.ingestionService.listDocuments();
  }
}
