import { Module } from "@nestjs/common";

import { LocalStubOcrProvider } from "./local-stub-ocr.provider";
import { OCR_PROVIDER } from "./ocr-provider.token";
import { OcrService } from "./ocr.service";

@Module({
  providers: [
    LocalStubOcrProvider,
    {
      provide: OCR_PROVIDER,
      useExisting: LocalStubOcrProvider
    },
    OcrService
  ],
  exports: [OcrService, OCR_PROVIDER]
})
export class OcrModule {}
