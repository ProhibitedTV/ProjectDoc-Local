import { Module } from "@nestjs/common";

import { DeterministicStubExtractorProvider } from "./deterministic-stub-extractor.provider";
import { FIELD_EXTRACTOR } from "./extraction-provider.token";
import { ExtractionService } from "./extraction.service";

@Module({
  providers: [
    DeterministicStubExtractorProvider,
    {
      provide: FIELD_EXTRACTOR,
      useExisting: DeterministicStubExtractorProvider
    },
    ExtractionService
  ],
  exports: [ExtractionService]
})
export class ExtractionModule {}
