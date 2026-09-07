import type { ExtractedField } from "./types";

/**
 * The client input workbook is organised as a small number of operational
 * sections.  Keeping the order here means Trader Review and the Operations
 * comparison view use the same vocabulary and sequence as the workbook.
 */
export const CLIENT_EXTRACTED_FIELD_GROUPS = [
  {
    title: "Basic information",
    description: "Matches the client Excel input sheet",
    keys: ["issuer", "launchOrPooling", "securitiesCode", "summitName", "copiaName", "productType", "currency"],
  },
  {
    title: "Product & Underlying Classification",
    description: "Underlying and internal product mapping",
    keys: ["usStockYn", "underlyings", "path", "basketType", "structure", "listing"],
  },
  {
    title: "Subscription & Economics",
    description: "Deal size and launching controls",
    keys: ["faceValue", "issuePrice", "lotSize", "minSubscription", "issueAmount", "notional", "denomination", "minLaunchAmount"],
  },
  {
    title: "Investment Tenor",
    description: "Trade, call, expiry and settlement schedule",
    keys: ["tenor", "tradeDate", "issueDate", "firstCouponDate", "firstCallDate", "expiryDate", "maturityDate", "settlementDate", "fixingBusinessDay", "paymentBusinessDay", "dayCount"],
  },
  {
    title: "Payoff Terms",
    description: "Coupon, strike and payoff conditions",
    keys: ["structure", "strike", "knockIn", "couponRate", "couponFrequency"],
  },
  {
    title: "Risk & Controls",
    description: "Human determination and rule-based controls",
    keys: ["riskRating", "comparableProduct", "csaf", "riCheck", "piCheck"],
  },
] as const;

export type ExtractedSourceKind = "term-sheet" | "sales-email" | "rule-derived" | "human-required";

const sourceMeta: Record<string, { kind: ExtractedSourceKind; label: string }> = {
  launchOrPooling: { kind: "sales-email", label: "Copied from Sales Email" },
  summitName: { kind: "rule-derived", label: "Rule / mapping" },
  copiaName: { kind: "rule-derived", label: "Rule / mapping" },
  usStockYn: { kind: "rule-derived", label: "Rule / mapping" },
  path: { kind: "rule-derived", label: "Rule / mapping" },
  basketType: { kind: "rule-derived", label: "Rule / mapping" },
  comparableProduct: { kind: "rule-derived", label: "Rule / mapping" },
  csaf: { kind: "rule-derived", label: "Rule / mapping" },
  riCheck: { kind: "rule-derived", label: "Control rule" },
  piCheck: { kind: "rule-derived", label: "Control rule" },
  dayCount: { kind: "rule-derived", label: "Template rule" },
};

export function extractedSourceMeta(field: Pick<ExtractedField, "key" | "sourcePage" | "manualRequired" | "sourceKind">) {
  if (field.manualRequired) return { kind: "human-required" as const, label: "Manual determination required" };
  if ("sourceKind" in field && field.sourceKind) {
    if (field.sourceKind === "term-sheet") return { kind: field.sourceKind, label: "Copied from Term Sheet" };
    if (field.sourceKind === "sales-email") return { kind: field.sourceKind, label: "Copied from Sales Email" };
    if (field.sourceKind === "human-required") return { kind: field.sourceKind, label: "Manual determination required" };
    return { kind: field.sourceKind, label: "Rule / mapping" };
  }
  const override = sourceMeta[field.key];
  if (override) return override;
  if (field.key === "settlementDate" && !/^p\./i.test(field.sourcePage)) {
    return { kind: "rule-derived" as const, label: "Rule-derived" };
  }
  if (/code template|mapping|rule/i.test(field.sourcePage)) return { kind: "rule-derived" as const, label: "Rule / mapping" };
  if (/email/i.test(field.sourcePage)) return { kind: "sales-email" as const, label: "Copied from Sales Email" };
  return { kind: "term-sheet" as const, label: "Copied from Term Sheet" };
}

export function sourcePillClass(kind: ExtractedSourceKind) {
  if (kind === "human-required") return "bg-amber-50 text-amber-700";
  if (kind === "rule-derived") return "bg-violet-50 text-violet-700";
  if (kind === "sales-email") return "bg-sky-50 text-sky-700";
  return "bg-demo-light text-demo-blue";
}

export function sourcePageLabel(sourcePage: string) {
  return sourcePage.replace(/^p\./i, "Page ");
}

export function mergedSourceTag(field: Pick<ExtractedField, "key" | "sourcePage" | "manualRequired" | "sourceKind">) {
  const source = extractedSourceMeta(field);
  const page = sourcePageLabel(field.sourcePage).trim();
  const lowerLabel = source.label.toLowerCase();
  const lowerPage = page.toLowerCase();
  const skip =
    !page ||
    lowerLabel.includes(lowerPage) ||
    (source.kind === "term-sheet" && /^term sheet/.test(lowerPage)) ||
    (source.kind === "sales-email" && lowerPage.includes("email")) ||
    (source.kind === "rule-derived" && /mapping|rule|code template/.test(lowerPage)) ||
    source.kind === "human-required";
  return { kind: source.kind, text: skip ? source.label : `${source.label} · ${page}` };
}

export function manualFieldHint(key: string) {
  if (key === "riskRating") return "Determine from the product structure and the internal risk-rating rules.";
  if (key === "settlementDate") return "Final maturity date + 2 business days; check both Hong Kong and US holidays.";
  if (key === "minLaunchAmount") return "Enter the approved minimum launching amount for this case.";
  return "This value must be supplied by the Trader.";
}
