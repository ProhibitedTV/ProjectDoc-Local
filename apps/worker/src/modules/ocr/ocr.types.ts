export type RawLocalOcrRegion = {
  engineId?: string;
  kind?: "block" | "line" | "word";
  text?: string;
  confidence?: number | null;
  boundingBox?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
};

export type RawLocalOcrPage = {
  pageNumber: number;
  text?: string;
  confidence?: number | null;
  width?: number | null;
  height?: number | null;
  regions?: RawLocalOcrRegion[];
};

export type RawLocalOcrOutput = {
  pages: RawLocalOcrPage[];
};
