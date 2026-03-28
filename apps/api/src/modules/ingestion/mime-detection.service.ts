import { extname } from "node:path";

import { Injectable } from "@nestjs/common";

export type DetectedMimeType = {
  mimeType: string;
  preferredExtension: string;
  detectedBy: "signature" | "extension" | "reported";
  reportedMimeType?: string;
  isSupported: boolean;
  requiresOcr: boolean;
};

const extensionMimeMap: Record<string, Omit<DetectedMimeType, "detectedBy" | "reportedMimeType">> = {
  ".pdf": {
    mimeType: "application/pdf",
    preferredExtension: ".pdf",
    isSupported: true,
    requiresOcr: true
  },
  ".png": {
    mimeType: "image/png",
    preferredExtension: ".png",
    isSupported: true,
    requiresOcr: true
  },
  ".jpg": {
    mimeType: "image/jpeg",
    preferredExtension: ".jpg",
    isSupported: true,
    requiresOcr: true
  },
  ".jpeg": {
    mimeType: "image/jpeg",
    preferredExtension: ".jpg",
    isSupported: true,
    requiresOcr: true
  },
  ".tif": {
    mimeType: "image/tiff",
    preferredExtension: ".tif",
    isSupported: true,
    requiresOcr: true
  },
  ".tiff": {
    mimeType: "image/tiff",
    preferredExtension: ".tif",
    isSupported: true,
    requiresOcr: true
  },
  ".txt": {
    mimeType: "text/plain",
    preferredExtension: ".txt",
    isSupported: true,
    requiresOcr: false
  }
};

@Injectable()
export class MimeDetectionService {
  detect(fileName: string, buffer: Buffer, reportedMimeType?: string): DetectedMimeType {
    const bySignature = this.detectBySignature(buffer);

    if (bySignature) {
      return {
        ...bySignature,
        detectedBy: "signature",
        reportedMimeType
      };
    }

    if (reportedMimeType && Object.values(extensionMimeMap).some((entry) => entry.mimeType === reportedMimeType)) {
      const byReportedType = Object.values(extensionMimeMap).find((entry) => entry.mimeType === reportedMimeType);

      if (byReportedType) {
        return {
          ...byReportedType,
          detectedBy: "reported",
          reportedMimeType
        };
      }
    }

    const byExtension = extensionMimeMap[extname(fileName).toLowerCase()];

    if (byExtension) {
      return {
        ...byExtension,
        detectedBy: "extension",
        reportedMimeType
      };
    }

    return {
      mimeType: reportedMimeType || "application/octet-stream",
      preferredExtension: extname(fileName).toLowerCase() || ".bin",
      detectedBy: reportedMimeType ? "reported" : "extension",
      reportedMimeType,
      isSupported: false,
      requiresOcr: false
    };
  }

  private detectBySignature(buffer: Buffer): Omit<DetectedMimeType, "detectedBy" | "reportedMimeType"> | null {
    if (buffer.byteLength >= 4 && buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
      return extensionMimeMap[".pdf"];
    }

    if (
      buffer.byteLength >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return extensionMimeMap[".png"];
    }

    if (buffer.byteLength >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return extensionMimeMap[".jpg"];
    }

    if (
      buffer.byteLength >= 4 &&
      (buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
        buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a])))
    ) {
      return extensionMimeMap[".tif"];
    }

    return null;
  }
}
