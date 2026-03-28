import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import { appSettingsSchema, type AppSettings } from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class AdminSettingsStoreService {
  private get settingsPath() {
    return join(getApiEnv().STORAGE_ROOT, "records", "admin", "settings.json");
  }

  async load(): Promise<AppSettings | null> {
    try {
      const raw = await readFile(this.settingsPath, "utf8");
      return appSettingsSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      throw error;
    }
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    const parsedSettings = appSettingsSchema.parse(settings);
    const tempPath = `${this.settingsPath}.tmp`;

    await mkdir(join(getApiEnv().STORAGE_ROOT, "records", "admin"), { recursive: true });
    await writeFile(tempPath, `${JSON.stringify(parsedSettings, null, 2)}\n`, "utf8");
    await rename(tempPath, this.settingsPath);

    return parsedSettings;
  }

  private isNotFound(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
