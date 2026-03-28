import { Inject, Injectable } from "@nestjs/common";
import type { ExtractionInput, ExtractionOutput, FieldExtractor } from "@projectdoc/shared";

import { FIELD_EXTRACTOR } from "./extraction-provider.token";

@Injectable()
export class ExtractionService implements FieldExtractor {
  constructor(@Inject(FIELD_EXTRACTOR) private readonly provider: FieldExtractor) {}

  get name() {
    return this.provider.name;
  }

  // Extraction stays behind a provider boundary so we can plug in model-backed extractors later without changing callers.
  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    return this.provider.extract(input);
  }
}
