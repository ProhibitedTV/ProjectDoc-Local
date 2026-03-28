import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import { exportJobSchema, type ExportJob } from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class ExportJobStoreService {
  private get recordsRoot() {
    return join(getApiEnv().STORAGE_ROOT, "records", "exports");
  }

  async create(exportJob: ExportJob): Promise<ExportJob> {
    const parsedExportJob = exportJobSchema.parse(exportJob);
    await this.writeRecord(parsedExportJob);
    return parsedExportJob;
  }

  async list(): Promise<ExportJob[]> {
    try {
      const entries = await readdir(this.recordsRoot, { withFileTypes: true });
      const records = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map(async (entry) => {
            const raw = await readFile(join(this.recordsRoot, entry.name), "utf8");
            return exportJobSchema.parse(JSON.parse(raw));
          })
      );

      return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch (error) {
      if (this.isNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  private async writeRecord(exportJob: ExportJob) {
    await mkdir(this.recordsRoot, { recursive: true });

    const recordPath = this.getRecordPath(exportJob.id);
    const tempPath = `${recordPath}.tmp`;

    await writeFile(tempPath, `${JSON.stringify(exportJob, null, 2)}\n`, "utf8");
    await rename(tempPath, recordPath);
  }

  private getRecordPath(exportJobId: string) {
    return join(this.recordsRoot, `${exportJobId}.json`);
  }

  private isNotFound(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
