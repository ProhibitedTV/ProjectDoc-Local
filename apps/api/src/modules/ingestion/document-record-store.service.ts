import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable } from "@nestjs/common";
import { documentIngestionRecordSchema, type DocumentIngestionRecord } from "@projectdoc/shared";

import { getApiEnv } from "../../config/api-env";

@Injectable()
export class DocumentRecordStoreService {
  // This local JSON-backed store keeps the ingestion boundary stable until the Prisma-backed repository lands.
  private get recordsRoot() {
    return join(getApiEnv().STORAGE_ROOT, "records", "documents");
  }

  async create(record: DocumentIngestionRecord): Promise<DocumentIngestionRecord> {
    const parsedRecord = documentIngestionRecordSchema.parse(record);
    await this.writeRecord(parsedRecord);
    return parsedRecord;
  }

  async update(record: DocumentIngestionRecord): Promise<DocumentIngestionRecord> {
    const parsedRecord = documentIngestionRecordSchema.parse(record);
    await this.writeRecord(parsedRecord);
    return parsedRecord;
  }

  async findById(documentId: string): Promise<DocumentIngestionRecord | null> {
    try {
      const raw = await readFile(this.getRecordPath(documentId), "utf8");
      return documentIngestionRecordSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      throw error;
    }
  }

  async list(): Promise<DocumentIngestionRecord[]> {
    try {
      const entries = await readdir(this.recordsRoot, { withFileTypes: true });
      const records = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map(async (entry) => {
            const raw = await readFile(join(this.recordsRoot, entry.name), "utf8");
            return documentIngestionRecordSchema.parse(JSON.parse(raw));
          })
      );

      return records.sort((left, right) =>
        right.document.createdAt.localeCompare(left.document.createdAt)
      );
    } catch (error) {
      if (this.isNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  private async writeRecord(record: DocumentIngestionRecord) {
    await mkdir(this.recordsRoot, { recursive: true });

    const recordPath = this.getRecordPath(record.document.id);
    const tempPath = `${recordPath}.tmp`;

    await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(tempPath, recordPath);
  }

  private getRecordPath(documentId: string) {
    return join(this.recordsRoot, `${documentId}.json`);
  }

  private isNotFound(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
