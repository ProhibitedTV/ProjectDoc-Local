import type { FieldValue } from "../domain/common";
import type {
  ClassificationInput,
  ClassificationOutput,
  ExtractionFieldOutput,
  ExtractionInput,
  ExtractionOutput,
  OcrPage,
  OcrProviderInput,
  OcrRegion,
  OcrResult
} from "../domain";
import type { SourceCitation } from "../domain/extraction";

export type SourceReference = Omit<SourceCitation, "documentId"> & {
  documentId?: string;
};

export type {
  ClassificationInput,
  ClassificationOutput,
  ExtractionFieldOutput,
  ExtractionInput,
  ExtractionOutput,
  OcrPage,
  OcrProviderInput,
  OcrRegion,
  OcrResult
};

export type ClassificationResult = ClassificationOutput;

export type ExtractionField = {
  key: string;
  label: string;
  value: FieldValue;
  confidence: number;
  source: SourceReference[];
};

export type ExtractionResult = ExtractionOutput;

export type RetrievalChunk = {
  documentId: string;
  pageNumber: number;
  score: number;
  text: string;
};

export type Citation = {
  documentId: string;
  pageNumber: number;
  excerpt: string;
};

export type AnswerResult = {
  answer: string;
  citations: Citation[];
  confidence: number;
};

export interface OcrProvider {
  readonly name: string;
  run(input: OcrProviderInput): Promise<OcrResult>;
}

export interface DocumentClassifier {
  readonly name: string;
  classify(input: ClassificationInput): Promise<ClassificationOutput>;
}

export interface FieldExtractor {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
}

export interface EmbeddingProvider {
  readonly name: string;
  embed(chunks: string[]): Promise<number[][]>;
}

export interface AnswerGenerator {
  readonly name: string;
  answer(question: string, chunks: RetrievalChunk[]): Promise<AnswerResult>;
}
