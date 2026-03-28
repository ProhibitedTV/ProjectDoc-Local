import { Module } from "@nestjs/common";

import { DeterministicStubClassifierProvider } from "./deterministic-stub-classifier.provider";
import { DOCUMENT_CLASSIFIER } from "./classification-provider.token";
import { ClassificationService } from "./classification.service";

@Module({
  providers: [
    DeterministicStubClassifierProvider,
    {
      provide: DOCUMENT_CLASSIFIER,
      useExisting: DeterministicStubClassifierProvider
    },
    ClassificationService
  ],
  exports: [ClassificationService]
})
export class ClassificationModule {}
