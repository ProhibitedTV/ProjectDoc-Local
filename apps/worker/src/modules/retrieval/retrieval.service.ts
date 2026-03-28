import { Injectable } from "@nestjs/common";
import type { RetrievalChunk } from "@projectdoc/shared";

@Injectable()
export class RetrievalService {
  describeStage() {
    return {
      stage: "retrieval",
      mode: "stub",
      nextStep: "Create chunking, embeddings, and hybrid retrieval indexing."
    } as const;
  }

  buildSeedChunks(): RetrievalChunk[] {
    return [];
  }
}
