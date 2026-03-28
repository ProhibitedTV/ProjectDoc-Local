import { Inject, Injectable } from "@nestjs/common";
import type { OcrProvider, OcrProviderInput, OcrResult } from "@projectdoc/shared";

import { OCR_PROVIDER } from "./ocr-provider.token";

@Injectable()
export class OcrService implements OcrProvider {
  constructor(@Inject(OCR_PROVIDER) private readonly provider: OcrProvider) {}

  get name() {
    return this.provider.name;
  }

  // OCR stays behind a provider boundary so we can swap runtimes without changing the pipeline contract.
  async run(input: OcrProviderInput): Promise<OcrResult> {
    return this.provider.run(input);
  }
}
