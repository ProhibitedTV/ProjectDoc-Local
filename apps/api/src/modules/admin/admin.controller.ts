import { BadRequestException, Body, Controller, Get, Patch } from "@nestjs/common";
import type { AppSettings } from "@projectdoc/shared";
import { updateAppSettingsRequestSchema } from "@projectdoc/shared";

import { AdminService } from "./admin.service";

@Controller("admin/settings")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getSettings(): Promise<AppSettings> {
    return this.adminService.getSettings();
  }

  @Patch()
  async updateSettings(@Body() body: unknown): Promise<AppSettings> {
    try {
      return await this.adminService.updateSettings(updateAppSettingsRequestSchema.parse(body));
    } catch (error) {
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException("The admin settings update was invalid.");
    }
  }
}
