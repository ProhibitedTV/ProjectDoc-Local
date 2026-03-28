import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import type { CreateExportJobRequest, ExportJob } from "@projectdoc/shared";
import { createExportJobRequestSchema } from "@projectdoc/shared";

import { ExportsService } from "./exports.service";

@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  async listExports(): Promise<ExportJob[]> {
    return this.exportsService.listExports();
  }

  @Post("csv")
  async createCsvExport(@Body() body: unknown): Promise<ExportJob> {
    try {
      return await this.exportsService.createCsvExport(createExportJobRequestSchema.parse(body));
    } catch (error) {
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException("The export request was invalid.");
    }
  }
}
