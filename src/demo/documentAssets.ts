import type { CaseItem, LaunchDoc } from "./types";

export interface DocumentAsset {
  path: string;
  previewKind: "pdf" | "xlsx";
}

// This public edition uses browser-rendered summaries; original files are excluded.
export function getLaunchDocumentAsset(c: CaseItem, doc: LaunchDoc): DocumentAsset | undefined {
  void c;
  void doc;
  return undefined;
}
