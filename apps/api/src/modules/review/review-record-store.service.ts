import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import { reviewItemRecordSchema, type ReviewItemRecord } from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class ReviewRecordStoreService {
  private get recordsRoot() {
    return join(getApiEnv().STORAGE_ROOT, "records", "review-items");
  }

  async create(record: ReviewItemRecord): Promise<ReviewItemRecord> {
    const parsed = reviewItemRecordSchema.parse(record);
    await this.writeRecord(parsed);
    return parsed;
  }

  async update(record: ReviewItemRecord): Promise<ReviewItemRecord> {
    const parsed = reviewItemRecordSchema.parse(record);
    await this.writeRecord(parsed);
    return parsed;
  }

  async findByTaskId(taskId: string): Promise<ReviewItemRecord | null> {
    try {
      const raw = await readFile(this.getRecordPath(taskId), "utf8");
      return reviewItemRecordSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      throw error;
    }
  }

  async findByDocumentId(documentId: string): Promise<ReviewItemRecord | null> {
    const records = await this.list();
    return records.find((record) => record.task.documentId === documentId) ?? null;
  }

  async list(): Promise<ReviewItemRecord[]> {
    try {
      const entries = await readdir(this.recordsRoot, { withFileTypes: true });
      const records = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map(async (entry) => {
            const raw = await readFile(join(this.recordsRoot, entry.name), "utf8");
            return reviewItemRecordSchema.parse(JSON.parse(raw));
          })
      );

      return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    } catch (error) {
      if (this.isNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  private async writeRecord(record: ReviewItemRecord) {
    await mkdir(this.recordsRoot, { recursive: true });

    const recordPath = this.getRecordPath(record.task.id);
    const tempPath = `${recordPath}.tmp`;

    await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(tempPath, recordPath);
  }

  private getRecordPath(taskId: string) {
    return join(this.recordsRoot, `${taskId}.json`);
  }

  private isNotFound(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
