import { Injectable } from "@nestjs/common";
import type {
  ClassificationCandidate,
  ClassificationInput,
  ClassificationOutput,
  DocumentClassifier,
  DocumentType,
  ReviewReason,
  SourceCitation
} from "@projectdoc/shared";

const classifierSignals: Record<Exclude<DocumentType, "unknown">, string[]> = {
  certificate_of_insurance: ["certificate of insurance", "certificate holder", "insured", "producer"],
  permit: ["permit", "permit number", "issuing authority", "expiration date"],
  invoice: ["invoice", "invoice number", "invoice date", "total amount", "amount due"],
  change_order: ["change order", "change order number", "net change amount", "change description"],
  lien_waiver: ["lien waiver", "waiver and release", "claimant name", "signed date"],
  contract: ["contract", "agreement", "effective date", "contractor name"],
  inspection_report: ["inspection report", "inspector name", "inspection date", "outcome"]
};

type MatchedSignal = {
  signal: string;
  citation: SourceCitation | undefined;
};

const buildPages = (input: ClassificationInput) =>
  input.pages.length > 0 ? input.pages : [{ pageNumber: 1, text: input.text, regions: [] }];

const excerptForSignal = (text: string, signal: string) => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const signalIndex = normalizedText.toLowerCase().indexOf(signal);

  if (signalIndex === -1) {
    return normalizedText.slice(0, 120);
  }

  const start = Math.max(0, signalIndex - 24);
  const end = Math.min(normalizedText.length, signalIndex + signal.length + 48);
  return normalizedText.slice(start, end).trim();
};

const findSignalCitation = (
  documentId: string,
  pages: ReturnType<typeof buildPages>,
  signal: string
): SourceCitation | undefined => {
  const matchingPage = pages.find((page) => page.text.toLowerCase().includes(signal));

  if (!matchingPage) {
    return undefined;
  }

  return {
    documentId,
    pageId: matchingPage.pageId,
    pageNumber: matchingPage.pageNumber,
    excerpt: excerptForSignal(matchingPage.text, signal)
  };
};

@Injectable()
export class DeterministicStubClassifierProvider implements DocumentClassifier {
  readonly name = "deterministic-stub-classifier";
  private readonly version = "0.1.0";
  private readonly method = "keyword_rules_stub";

  async classify(input: ClassificationInput): Promise<ClassificationOutput> {
    const createdAt = new Date().toISOString();
    const pages = buildPages(input);
    const normalizedText = input.text.toLowerCase();

    const candidates = (Object.entries(classifierSignals) as [Exclude<DocumentType, "unknown">, string[]][])
      .map(([documentType, signals]) => {
        const matches: MatchedSignal[] = signals
          .filter((signal) => normalizedText.includes(signal))
          .map((signal) => ({
            signal,
            citation: findSignalCitation(input.documentId, pages, signal)
          }));

        if (matches.length === 0) {
          return null;
        }

        const confidence = Math.min(0.45 + (matches.length / signals.length) * 0.5, 0.95);
        const candidate: ClassificationCandidate = {
          documentType,
          confidence,
          matchedSignals: matches.map((match) => match.signal),
          citations: matches.flatMap((match) => (match.citation ? [match.citation] : []))
        };

        return candidate;
      })
      .filter((candidate): candidate is ClassificationCandidate => candidate !== null)
      .sort((left, right) => right.confidence - left.confidence);

    const primaryCandidate =
      candidates[0] ??
      ({
        documentType: "unknown",
        confidence: 0.2,
        matchedSignals: [],
        citations: []
      } satisfies ClassificationCandidate);

    const secondCandidate = candidates[1];
    const ambiguous = secondCandidate !== undefined && primaryCandidate.confidence - secondCandidate.confidence < 0.12;
    const reviewRecommended =
      primaryCandidate.documentType === "unknown" || primaryCandidate.confidence < 0.78 || ambiguous;
    const reviewReasons: ReviewReason[] = reviewRecommended ? ["low_confidence"] : [];

    return {
      documentId: input.documentId,
      processingRunId: input.processingRunId,
      documentType: primaryCandidate.documentType,
      confidence: primaryCandidate.confidence,
      method: this.method,
      reasons:
        primaryCandidate.matchedSignals.length > 0
          ? [`Matched signals: ${primaryCandidate.matchedSignals.join(", ")}`]
          : ["No document-type signals matched the current stub rules."],
      candidates: candidates.length > 0 ? candidates : [primaryCandidate],
      reviewRecommended,
      reviewReasons,
      provenance: {
        processingRunId: input.processingRunId,
        provider: this.name,
        providerVersion: this.version,
        method: this.method,
        createdAt
      },
      createdAt
    };
  }
}
