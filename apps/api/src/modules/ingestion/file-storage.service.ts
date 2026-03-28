import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

import { Injectable } from "@nestjs/common";

import { getApiEnv } from "../../config/api-env";

export type SaveIncomingFileInput = {
  fileName: string;
  buffer: Buffer;
  preferredExtension?: string;
};

export type SaveIncomingFileResult = {
  absolutePath: string;
  storagePath: string;
  sizeBytes: number;
  sha256: string;
  extension: string;
};

@Injectable()
export class FileStorageService {
  async saveIncomingFile(input: SaveIncomingFileInput): Promise<SaveIncomingFileResult> {
    const storageRoot = getApiEnv().STORAGE_ROOT;
    const extension = this.resolveExtension(input.fileName, input.preferredExtension);
    const now = new Date();
    const targetDirectory = join(
      storageRoot,
      "documents",
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0")
    );
    const absolutePath = join(targetDirectory, `${randomUUID()}${extension}`);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      absolutePath,
      storagePath: relative(storageRoot, absolutePath).replaceAll("\\", "/"),
      sizeBytes: input.buffer.byteLength,
      sha256: createHash("sha256").update(input.buffer).digest("hex"),
      extension
    };
  }

  async removeAbsolutePath(path: string): Promise<void> {
    await rm(path, { force: true });
  }

  resolveStoragePath(storagePath: string): string {
    return join(getApiEnv().STORAGE_ROOT, storagePath);
  }

  private resolveExtension(fileName: string, preferredExtension?: string) {
    if (preferredExtension && preferredExtension.startsWith(".")) {
      return preferredExtension;
    }

    const fileExtension = extname(fileName).toLowerCase();
    return fileExtension || ".bin";
  }
}
