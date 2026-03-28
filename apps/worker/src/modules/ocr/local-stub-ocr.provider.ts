import { readFile } from "node:fs/promises";

import { Injectable } from "@nestjs/common";
import type { OcrProvider, OcrProviderInput, OcrResult } from "@projectdoc/shared";

import { normalizeLocalOcrOutput } from "./ocr-normalizer";
import type { RawLocalOcrOutput } from "./ocr.types";

@Injectable()
export class LocalStubOcrProvider implements OcrProvider {
  readonly name = "local-stub-ocr";
  private readonly version = "0.1.0";

  async run(input: OcrProviderInput): Promise<OcrResult> {
    const rawOutput =
      input.mimeType === "text/plain"
        ? await this.buildTextPassthroughOutput(input.sourceFilePath)
        : this.buildPlaceholderOutput();

    return normalizeLocalOcrOutput(input, rawOutput, {
      provider: this.name,
      providerVersion: this.version,
      method: input.mimeType === "text/plain" ? "local_stub_text_passthrough" : "local_stub_placeholder"
    });
  }

  private async buildTextPassthroughOutput(sourceFilePath: string): Promise<RawLocalOcrOutput> {
    const rawText = await readFile(sourceFilePath, "utf8");
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      pages: [
        {
          pageNumber: 1,
          text: lines.join("\n"),
          regions: lines.map((line, index) => ({
            engineId: `line-${index + 1}`,
            kind: "line",
            text: line
          }))
        }
      ]
    };
  }

  private buildPlaceholderOutput(): RawLocalOcrOutput {
    return {
      pages: [
        {
          pageNumber: 1,
          text: "",
          regions: []
        }
      ]
    };
  }
}
