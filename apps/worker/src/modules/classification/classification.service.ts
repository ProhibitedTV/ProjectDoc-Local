import { Inject, Injectable } from "@nestjs/common";
import type { ClassificationInput, ClassificationOutput, DocumentClassifier } from "@projectdoc/shared";

import { DOCUMENT_CLASSIFIER } from "./classification-provider.token";

@Injectable()
export class ClassificationService implements DocumentClassifier {
  constructor(@Inject(DOCUMENT_CLASSIFIER) private readonly provider: DocumentClassifier) {}

  get name() {
    return this.provider.name;
  }

  // Classification stays behind a provider boundary so we can replace the stub without changing the worker contract.
  async classify(input: ClassificationInput): Promise<ClassificationOutput> {
    return this.provider.classify(input);
  }
}
