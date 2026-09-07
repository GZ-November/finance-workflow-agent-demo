import type {
  CaseItem,
  DemoScenario,
  ExcelTemplate,
  ExtractedField,
  LaunchDoc,
} from "./types";

const PRIMARY_BOND_REQUEST_EMAIL: NonNullable<CaseItem["salesRequestEmail"]> = {
  subject: "[Open Bond Code] Primary Bank 2Y HKD",
  from: "Demo User <demo.user@example.com>",
  to: "Treasury Settlement <treasury.settlement@example.com>",
  date: "20 Jul 2026 15:30",
  body: "Dear TS,\n\nPlease help to create code for the attached bond in Summit.",
  table: [
    { key: "Type", value: "BOND" },
    { key: "Sub type", value: "OTH" },
    { key: "NBMCE", value: "8" },
    { key: "Exchange", value: "NOT LISTED" },
    { key: "Issue Amount", value: "HKD 200,000,000" },
    { key: "Country", value: "JP" },
    { key: "Coupon", value: "3.465%" },
  ],
  attachments: ["20260720 - Primary Bank - 2Y HKD Fixed Rate Note.docx"],
};

type ClientInputWorkbookConfig = {
  summitName: string;
  copiaName: string;
  usStock: boolean;
  basket: boolean;
  faceValue: string;
  businessDayCentres: string;
  comparableProduct: string;
  firstCallDate?: string;
  firstCallPage?: string;
  expiryDate?: string;
  expiryPage?: string;
};

/**
 * Fields confirmed from the client's Excel input-sheet walkthrough. Values
 * copied from source documents stay populated; the two client-confirmed
 * judgement fields are deliberately left blank for the Trader.
 */
function clientInputWorkbookFields(config: ClientInputWorkbookConfig): ExtractedField[] {
  return [
    { key: "launchOrPooling", label: "Launched or Pooling", value: "Launched", confidence: 100, sourcePage: "Sales email", sourceKind: "sales-email" },
    { key: "summitName", label: "Summit Name", value: config.summitName, confidence: 100, sourcePage: "Internal mapping", sourceKind: "rule-derived" },
    { key: "copiaName", label: "Copia Name", value: config.copiaName, confidence: 100, sourcePage: "Internal mapping", sourceKind: "rule-derived" },
    { key: "usStockYn", label: "US Stock (Y/N)", value: config.usStock ? "Y" : "N", confidence: 100, sourcePage: "Underlying mapping", sourceKind: "rule-derived" },
    { key: "path", label: "Path", value: config.usStock ? "US Stock" : "HK Stock", confidence: 100, sourcePage: "Product mapping", sourceKind: "rule-derived" },
    { key: "basketType", label: "Basket?", value: config.basket ? "Basket" : "Single", confidence: 100, sourcePage: "Underlying mapping", sourceKind: "rule-derived" },
    { key: "faceValue", label: "Face Value", value: config.faceValue, confidence: 98, sourcePage: "Term Sheet", sourceKind: "term-sheet" },
    { key: "minLaunchAmount", label: "Min. Amount in Launching", value: "", confidence: 0, sourcePage: "Trader input", manualRequired: true, sourceKind: "human-required" },
    ...(config.firstCallDate ? [{ key: "firstCallDate", label: "First Call Date", value: config.firstCallDate, confidence: 98, sourcePage: config.firstCallPage ?? "Term Sheet", sourceKind: "term-sheet" as const }] : []),
    ...(config.expiryDate ? [{ key: "expiryDate", label: "Expiry Date", value: config.expiryDate, confidence: 98, sourcePage: config.expiryPage ?? "Term Sheet", sourceKind: "term-sheet" as const }] : []),
    { key: "fixingBusinessDay", label: "Fixing Date Business Day", value: config.businessDayCentres, confidence: 98, sourcePage: "Term Sheet", sourceKind: "term-sheet" },
    { key: "paymentBusinessDay", label: "Payment Date Business Day", value: config.businessDayCentres, confidence: 98, sourcePage: "Term Sheet", sourceKind: "term-sheet" },
    { key: "comparableProduct", label: "Comparable Product", value: config.comparableProduct, confidence: 100, sourcePage: "Internal mapping", sourceKind: "rule-derived" },
    { key: "csaf", label: "CSAF", value: "Generated after risk selection", confidence: 100, sourcePage: "Internal mapping", sourceKind: "rule-derived" },
  ];
}

/* ================================================================
   ELI — Client A Basket (Sample 3, series SERIES-A-001)
   ================================================================ */
export const eliClientAFields: ExtractedField[] = [
  { key: "issuer", label: "Issuer", value: "Client A Bank Limited", confidence: 99, sourcePage: "p.3" },
  { key: "productType", label: "Product Type", value: "ELI", confidence: 99, sourcePage: "p.1" },
  { key: "currency", label: "Currency", value: "HKD", confidence: 99, sourcePage: "p.4" },
  { key: "underlyings", label: "Underlyings", value: "AAA.HK (Fictional Alpha), BBB.HK (Fictional Beta)", confidence: 99, sourcePage: "p.3" },
  { key: "issuePrice", label: "Issue Price", value: "100%", confidence: 99, sourcePage: "p.4" },
  { key: "couponRate", label: "Coupon", value: "13.08% p.a.", confidence: 99, sourcePage: "Application p.2" },
  { key: "couponFrequency", label: "Coupon Frequency", value: "Monthly", confidence: 99, sourcePage: "Application p.2" },
  { key: "strike", label: "Strike / Exercise Price", value: "79.00% of Initial", confidence: 99, sourcePage: "p.4" },
  { key: "knockIn", label: "Knock-in", value: "63.00% (At-Expiry)", confidence: 99, sourcePage: "Application p.2" },
  { key: "lotSize", label: "Lot Size", value: "HKD 10,000", confidence: 99, sourcePage: "p.4" },
  { key: "minSubscription", label: "Minimum Subscription", value: "HKD 100,000", confidence: 99, sourcePage: "Application p.1" },
  { key: "issueDate", label: "Issue Date", value: "03 Aug 2026", confidence: 99, sourcePage: "p.4" },
  { key: "maturityDate", label: "Maturity Date", value: "09 Apr 2027", confidence: 99, sourcePage: "p.4" },
  { key: "dayCount", label: "Day Count Method", value: "Act/365", confidence: 99, sourcePage: "Code template" },
  { key: "riskRating", label: "Product Risk Rating", value: "", confidence: 0, sourcePage: "Trader input", manualRequired: true },
  { key: "structure", label: "Structure", value: "Daily Autocall + At-Expiry Knock-in", confidence: 99, sourcePage: "p.1" },
  { key: "securitiesCode", label: "Series Number", value: "SERIES-A-001", confidence: 100, sourcePage: "p.4" },
  ...clientInputWorkbookFields({
    summitName: "Client A KO KI ELI [AAA+BBB]",
    copiaName: "Client A KI ELI linked to [AAA+BBB]",
    usStock: false,
    basket: true,
    faceValue: "HKD 10,000",
    businessDayCentres: "Hong Kong, New York",
    comparableProduct: "ELI_HKD_BKT_FC_KI",
  }),
];

/* ================================================================
   ELI — Client B Single (Sample 4)
   ================================================================ */
export const eliClientBFields: ExtractedField[] = [
  { key: "issuer", label: "Issuer", value: "Client B Bank Europe SE", confidence: 99, sourcePage: "p.3" },
  { key: "productType", label: "Product Type", value: "ELI", confidence: 99, sourcePage: "p.3" },
  { key: "currency", label: "Currency", value: "HKD", confidence: 99, sourcePage: "p.9" },
  { key: "underlyings", label: "Underlyings", value: "BBB.HK (Fictional Beta)", confidence: 99, sourcePage: "p.15" },
  { key: "issuePrice", label: "Issue Price", value: "100%", confidence: 99, sourcePage: "p.9" },
  { key: "couponRate", label: "Coupon", value: "10.08% p.a.", confidence: 99, sourcePage: "Application p.2" },
  { key: "couponFrequency", label: "Coupon Frequency", value: "Monthly", confidence: 99, sourcePage: "Application p.2" },
  { key: "strike", label: "Strike / Exercise Price", value: "95.00% of Initial", confidence: 99, sourcePage: "p.15" },
  { key: "knockIn", label: "Knock-in", value: "Not applicable", confidence: 99, sourcePage: "Application p.2" },
  { key: "lotSize", label: "Lot Size", value: "HKD 10,000", confidence: 99, sourcePage: "p.9" },
  { key: "minSubscription", label: "Minimum Subscription", value: "HKD 100,000", confidence: 99, sourcePage: "Application p.1" },
  { key: "tradeDate", label: "Trade Date", value: "24 Jun 2026", confidence: 99, sourcePage: "p.9" },
  { key: "issueDate", label: "Issue Date", value: "02 Jul 2026", confidence: 99, sourcePage: "p.9" },
  { key: "maturityDate", label: "Maturity Date", value: "07 Jan 2027", confidence: 99, sourcePage: "Code template" },
  { key: "dayCount", label: "Day Count Method", value: "Act/365", confidence: 99, sourcePage: "Code template" },
  { key: "riskRating", label: "Product Risk Rating", value: "", confidence: 0, sourcePage: "Trader input", manualRequired: true },
  { key: "structure", label: "Structure", value: "Daily Call, No Knock-in", confidence: 99, sourcePage: "p.3" },
  { key: "securitiesCode", label: "Series Number", value: "SERIES-B-001", confidence: 100, sourcePage: "p.3" },
  ...clientInputWorkbookFields({
    summitName: "Client B Daily Call ELI [CCC]",
    copiaName: "Client B ELI linked to [CCC]",
    usStock: false,
    basket: false,
    faceValue: "HKD 10,000",
    businessDayCentres: "Hong Kong",
    comparableProduct: "ELI_HKD_SGL_FC",
  }),
];

/* ================================================================
   Bond — Primary Bank 2Y HKD Fixed Rate Note (primary)
   ================================================================ */
export const bondFields: ExtractedField[] = [
  { key: "issuer", label: "Issuer", value: "Primary Bank", confidence: 99, sourcePage: "p.1" },
  { key: "productType", label: "Product Type", value: "Bond", confidence: 98, sourcePage: "p.1" },
  { key: "currency", label: "Currency", value: "HKD", confidence: 99, sourcePage: "p.1" },
  { key: "notional", label: "Notional", value: "HKD 200,000,000", confidence: 97, sourcePage: "p.1" },
  { key: "couponRate", label: "Coupon Rate", value: "3.465% p.a.", confidence: 95, sourcePage: "p.1" },
  { key: "couponFrequency", label: "Coupon Frequency", value: "Annually", confidence: 94, sourcePage: "p.1" },
  { key: "tradeDate", label: "Trade Date", value: "20 Jul 2026", confidence: 97, sourcePage: "p.1" },
  { key: "issueDate", label: "Issue Date", value: "28 Jul 2026", confidence: 97, sourcePage: "p.1" },
  { key: "maturityDate", label: "Maturity Date", value: "28 Jul 2028", confidence: 96, sourcePage: "p.1" },
  { key: "issuePrice", label: "Issue Price", value: "100%", confidence: 99, sourcePage: "p.1" },
  { key: "dayCount", label: "Day Count Method", value: "Act/365 (Fixed)", confidence: 88, sourcePage: "p.1" },
  { key: "denomination", label: "Denomination", value: "HKD 1,000,000", confidence: 93, sourcePage: "p.1" },
  { key: "riskRating", label: "Issuer Rating", value: "Aa1/AA/AAA (M/S&P/F)", confidence: 95, sourcePage: "p.1" },
  { key: "listing", label: "Listing", value: "None", confidence: 98, sourcePage: "p.1" },
];

/* ================================================================
   Launch documents — complete-set packs for the active ELI cases
   ================================================================ */
export function buildCompleteSetDocuments(
  scenario: "eli_client_a" | "eli_client_b",
): LaunchDoc[] {
  const common = [
    { id: "d2", name: "ELI Application Form.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:42", highlightFields: ["Key Product Terms"] },
    { id: "d3", name: "COPIA & Summit Code Setup.xlsx", kind: "xlsx" as const, status: "generated" as const, generatedAt: "10:43", highlightFields: ["Input Sheet", "COPIA Code", "Summit Code"] },
    { id: "d4", name: "ELI Transaction Related Disclosure.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:43", highlightFields: ["Issuer", "Distribution"] },
  ];
  if (scenario === "eli_client_a") {
    return [
      { id: "d1", name: "Client A Product Booklet EN.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:42", highlightFields: ["Product terms"] },
      ...common,
      { id: "d5", name: "Client A FDD EN.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:43", highlightFields: ["Issuer disclosure"] },
    ];
  }
  return [
    { id: "d1", name: "Client B Product Booklet EN.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:42", highlightFields: ["Product terms"] },
    ...common,
    { id: "d5", name: "Client B FDD EN.pdf", kind: "pdf" as const, status: "generated" as const, generatedAt: "10:43", highlightFields: ["Issuer disclosure"] },
  ];
}

/* ================================================================
   Excel templates — ELI (COPIA + Summit based on real data)
   ================================================================ */
function buildNewELITemplates(config: {
  name: string;
  copiaName: string;
  code: string;
  issuer: string;
  currency: string;
  faceValue: string;
  minimum: string;
  issueAmount: string;
  issueDate: string;
  firstCouponDate: string;
  maturityDate: string;
  coupon: string;
  dayCount: string;
  underlyings: string;
}): ExcelTemplate[] {
  const shared = [
    { field: "Securities Name", value: config.name, source: "ai" as const },
    { field: "Securities Code", value: config.code, source: "ai" as const },
    { field: "Issuer", value: config.issuer, source: "ai" as const },
    { field: "Product Type", value: "ELI", source: "ai" as const },
    { field: "Currency", value: config.currency, source: "ai" as const },
    { field: "Issue Price", value: "100%", source: "ai" as const },
    { field: "Lot Size", value: config.faceValue, source: "ai" as const },
    { field: "Minimum Subscription", value: config.minimum, source: "ai" as const },
    { field: "Risk Rating", value: "P5", source: "ai" as const },
  ];
  return [
    { id: "pcc", name: "Product Code Creation.xlsx", status: "generated", rows: shared },
    {
      id: "copia",
      name: "COPIA.xlsx",
      status: "generated",
      rows: [
        { field: "Securities Code", value: config.copiaName, source: "ai" },
        { field: "Securities Name", value: config.name, source: "ai" },
        { field: "ISIN / Common Code", value: "TBC", source: "manual" },
        { field: "Currency", value: config.currency, source: "ai" },
        { field: "Issuer", value: config.issuer, source: "ai" },
        { field: "Underlyings", value: config.underlyings, source: "ai" },
        { field: "Issue Date", value: config.issueDate, source: "ai" },
        { field: "Settlement Date", value: config.issueDate, source: "ai" },
        { field: "Maturity Date", value: config.maturityDate, source: "ai" },
        { field: "Coupon Frequency / Rate", value: `Monthly / ${config.coupon}`, source: "ai" },
        { field: "Day Count Method", value: config.dayCount, source: "ai" },
        { field: "Product Risk Rating", value: "P5", source: "ai" },
      ],
    },
    {
      id: "summit",
      name: "Summit.xlsx",
      status: "generated",
      rows: [
        { field: "Name", value: config.name, source: "ai" },
        { field: "Series Number", value: config.code, source: "ai" },
        { field: "Currency", value: config.currency, source: "ai" },
        { field: "Type / Sub Type", value: "OTHERS / ELI", source: "ai" },
        { field: "Issuer", value: config.issuer, source: "ai" },
        { field: "Face Value", value: config.faceValue, source: "ai" },
        { field: "Issue Amount", value: config.issueAmount, source: "ai" },
        { field: "Issue Date", value: config.issueDate, source: "ai" },
        { field: "Settlement Date", value: config.issueDate, source: "ai" },
        { field: "First Coupon Date", value: config.firstCouponDate, source: "ai" },
        { field: "Maturity Date", value: config.maturityDate, source: "ai" },
        { field: "Coupon Frequency / Rate", value: `Monthly / ${config.coupon}`, source: "ai" },
        { field: "Day Count Method", value: config.dayCount, source: "ai" },
        { field: "NBMCE", value: "8", source: "ai" },
      ],
    },
  ];
}

export const buildClientATemplates = () => buildNewELITemplates({
  name: "Client A KO KI ELI [AAA+BBB]",
  copiaName: "Client A KI ELI linked to [AAA+BBB]",
  code: "SERIES-A-001",
  issuer: "Client A Bank Limited",
  currency: "HKD",
  faceValue: "10,000",
  minimum: "100,000",
  issueAmount: "5,000,000",
  issueDate: "03 Aug 2026",
  firstCouponDate: "08 Sep 2026",
  maturityDate: "09 Apr 2027",
  coupon: "13.08% p.a.",
  dayCount: "Act/365",
  underlyings: "AAA.HK, BBB.HK",
});

export const buildClientBTemplates = () => buildNewELITemplates({
  name: "Client B Daily Call ELI [CCC]",
  copiaName: "Client B ELI linked to [CCC]",
  code: "SERIES-B-001",
  issuer: "Client B Bank Europe SE",
  currency: "HKD",
  faceValue: "10,000",
  minimum: "100,000",
  issueAmount: "5,000,000",
  issueDate: "02 Jul 2026",
  firstCouponDate: "06 Aug 2026",
  maturityDate: "07 Jan 2027",
  coupon: "10.08% p.a.",
  dayCount: "Act/365",
  underlyings: "BBB.HK",
});

/* ================================================================
   Excel templates — Bond (Primary)
   ================================================================ */
export function buildBondTemplates(): ExcelTemplate[] {
  return [
    {
      id: "pcc",
      name: "Bond Code Creation.xlsx",
      status: "generated",
      rows: [
        { field: "Securities Name", value: "Primary Bank 2Y HKD FRN", source: "ai" },
        { field: "Issuer", value: "Primary Bank", source: "ai" },
        { field: "Product Type", value: "Bond", source: "ai" },
        { field: "Currency", value: "HKD", source: "ai" },
        { field: "Notional", value: "HKD 200,000,000", source: "ai" },
        { field: "Coupon Rate", value: "3.465% p.a.", source: "ai" },
        { field: "Issue Date", value: "28 Jul 2026", source: "ai" },
        { field: "Maturity Date", value: "28 Jul 2028", source: "ai" },
        { field: "Issue Price", value: "100%", source: "ai" },
        { field: "Denomination", value: "HKD 1,000,000", source: "ai" },
        { field: "Risk Rating", value: "Aa1/AA/AAA", source: "ai" },
      ],
    },
    {
      id: "copia",
      name: "COPIA.xlsx",
      status: "generated",
      rows: [
        { field: "Securities Name", value: "Primary Bank 2Y HKD FRN", source: "ai" },
        { field: "ISIN / Common Code", value: "Pending issuer allocation", source: "manual" },
        { field: "Asset Class", value: "Fixed Income", source: "ai" },
        { field: "Issuer", value: "Primary Bank", source: "ai" },
        { field: "Currency", value: "HKD", source: "ai" },
        { field: "Issue Date", value: "28 Jul 2026", source: "ai" },
        { field: "Maturity Date", value: "28 Jul 2028", source: "ai" },
        { field: "Coupon Frequency / Rate", value: "Annually / 3.465%", source: "ai" },
        { field: "Day Count Method", value: "Act/365 (Fixed)", source: "ai" },
      ],
    },
    {
      id: "summit",
      name: "Summit.xlsx",
      status: "generated",
      rows: [
        { field: "Name", value: "Primary Bank 2Y HKD FRN", source: "ai" },
        { field: "Currency", value: "HKD", source: "ai" },
        { field: "Type / Sub Type", value: "Bond / Fixed Rate", source: "ai" },
        { field: "Issuer", value: "Primary Bank", source: "ai" },
        { field: "Notional", value: "200,000,000", source: "ai" },
        { field: "Issue Date", value: "28 Jul 2026", source: "ai" },
        { field: "Maturity Date", value: "28 Jul 2028", source: "ai" },
        { field: "Coupon Frequency / Rate", value: "Annually / 3.465%", source: "ai" },
        { field: "Day Count Method", value: "Act/365 (Fixed)", source: "ai" },
        { field: "Listed/Unlisted", value: "UNLISTED", source: "ai" },
      ],
    },
  ];
}

/* ================================================================
   Bond — Secondary Bond 3.875% 2027 (secondary, Market Data Source source)
   ================================================================ */
export const secondaryBondFields: ExtractedField[] = [
  { key: "issuer", label: "Issuer", value: "Secondary Issuer (Fictional)", confidence: 95, sourcePage: "Market Data Source" },
  { key: "productType", label: "Product Type", value: "Bond (Secondary)", confidence: 98, sourcePage: "Market Data Source" },
  { key: "currency", label: "Currency", value: "USD", confidence: 99, sourcePage: "Market Data Source" },
  { key: "couponRate", label: "Coupon Rate", value: "3.875% p.a.", confidence: 93, sourcePage: "Market Data Source" },
  { key: "issueDate", label: "Issue Date", value: "02 Jul 2025", confidence: 98, sourcePage: "Market Data Source" },
  { key: "firstCouponDate", label: "First Coupon Date", value: "04 Feb 2026", confidence: 96, sourcePage: "Market Data Source" },
  { key: "maturityDate", label: "Maturity Date", value: "04 Aug 2027", confidence: 96, sourcePage: "Market Data Source" },
  { key: "dayCount", label: "Day Count Method", value: "30/360", confidence: 97, sourcePage: "Market Data Source" },
  { key: "ratings", label: "Ratings (Moody's / S&P)", value: "Aa1 / AA+", confidence: 98, sourcePage: "Market Data Source" },
  { key: "minPiece", label: "Min Piece / Increment", value: "200,000 / 1,000", confidence: 96, sourcePage: "Market Data Source" },
  { key: "cusip", label: "CUSIP", value: "US00DEMO001", confidence: 99, sourcePage: "Market Data Source" },
  { key: "listing", label: "Exchange", value: "LISTED", confidence: 98, sourcePage: "Email" },
  { key: "nbmce", label: "NBMCE", value: "8", confidence: 99, sourcePage: "Email" },
];

export function buildSecondaryBondTemplates(): ExcelTemplate[] {
  return [
    {
      id: "pcc", name: "Bond Code Creation.xlsx", status: "generated",
      rows: [
        { field: "Securities Name", value: "Secondary Bond 3.875% 2027", source: "ai" },
        { field: "Issuer", value: "Secondary Issuer", source: "ai" },
        { field: "Product Type", value: "Bond", source: "ai" },
        { field: "Sub Type", value: "OTH", source: "ai" },
        { field: "Currency", value: "USD", source: "ai" },
        { field: "Coupon Rate", value: "3.875%", source: "ai" },
        { field: "Issue Date", value: "02 Jul 2025", source: "ai" },
        { field: "First Coupon Date", value: "04 Feb 2026", source: "ai" },
        { field: "Maturity Date", value: "04 Aug 2027", source: "ai" },
        { field: "Day Count Method", value: "30/360", source: "ai" },
        { field: "Ratings", value: "Aa1 / AA+", source: "ai" },
        { field: "Min Piece / Increment", value: "200,000 / 1,000", source: "ai" },
        { field: "CUSIP", value: "US00DEMO001", source: "ai" },
        {
          field: "NBMCE",
          value: "8",
          source: "manual",
          issue: true,
          issueReason: "Value 8 is outside the configured demo range for this secondary-bond setup.",
          expectedValue: "Integer from 0 to 5",
        },
        { field: "Exchange", value: "LISTED", source: "ai" },
      ],
    },
    {
      id: "copia", name: "COPIA.xlsx", status: "generated",
      rows: [
        { field: "Securities Name", value: "Secondary Bond 3.875% 2027", source: "ai" },
        { field: "ISIN / Common Code", value: "USUS00DEMO0012", source: "ai" },
        { field: "Asset Class", value: "Fixed Income", source: "ai" },
        { field: "Issuer", value: "Secondary Issuer", source: "ai" },
        { field: "Currency", value: "USD", source: "ai" },
        { field: "Issue Date", value: "02 Jul 2025", source: "ai" },
        { field: "Maturity Date", value: "04 Aug 2027", source: "ai" },
        { field: "Coupon Frequency / Rate", value: "Semi-Annual / 3.875%", source: "ai" },
        { field: "Day Count Method", value: "30/360", source: "ai" },
        { field: "Exchange", value: "LISTED", source: "ai" },
      ],
    },
    {
      id: "summit", name: "Summit.xlsx", status: "generated",
      rows: [
        { field: "Name", value: "Secondary Bond 3.875% 2027", source: "ai" },
        { field: "Currency", value: "USD", source: "ai" },
        { field: "Type / Sub Type", value: "BOND / OTH", source: "ai" },
        { field: "Issuer", value: "Secondary Issuer", source: "ai" },
        { field: "CUSIP", value: "US00DEMO001", source: "ai" },
        { field: "Issue Date", value: "02 Jul 2025", source: "ai" },
        { field: "First Coupon Date", value: "04 Feb 2026", source: "ai" },
        { field: "Maturity Date", value: "04 Aug 2027", source: "ai" },
        { field: "Coupon Frequency / Rate", value: "Semi-Annual / 3.875%", source: "ai" },
        { field: "Day Count Method", value: "30/360", source: "ai" },
        { field: "Min Piece / Increment", value: "200,000 / 1,000", source: "ai" },
        { field: "NBMCE", value: "8", source: "ai" },
        { field: "Exchange", value: "LISTED", source: "ai" },
      ],
    },
  ];
}

/* ================================================================
   Scenario builders
   ================================================================ */
export function buildScenarioCase(scenario: DemoScenario): CaseItem {
  if (scenario === "eli_client_a") {
    return {
      id: "CASE-2026-0727-014",
      productName: "Client A KO KI ELI [AAA+BBB]",
      issuer: "Client A",
      productType: "Unknown",
      currency: "HKD",
      underlyings: ["AAA.HK", "BBB.HK"],
      submittedTime: "27 Jul 2026 11:40",
      owner: "Demo Trader",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      sourceScenario: scenario,
    };
  }
  if (scenario === "eli_client_b") {
    return {
      id: "CASE-2026-0624-015",
      productName: "Client B Daily Call ELI [CCC]",
      issuer: "Client B Bank Europe SE",
      productType: "Unknown",
      currency: "HKD",
      underlyings: ["BBB.HK"],
      submittedTime: "24 Jun 2026 11:17",
      owner: "Demo Trader",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      sourceScenario: scenario,
    };
  }
  if (scenario === "bond_secondary") {
    return {
      id: "CASE-2026-0430-004",
      productName: "Secondary Bond 3.875% 2027",
      issuer: "Secondary Issuer (Fictional)",
      productType: "Unknown",
      currency: "USD",
      underlyings: [],
      submittedTime: "30 Apr 2026 15:15",
      owner: "Demo Investment",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      sourceScenario: scenario,
      salesRequestEmail: {
        subject: "[Open Bond Code] Secondary Bond 3.875% 2027",
        from: "Demo User <demo.user@example.com>",
        to: "Treasury Settlement <treasury.settlement@example.com>",
        date: "30 Apr 2026 15:15",
        body: "Dear TS, please help to create code for attached bond in Summit.",
        table: [
          { key: "Type", value: "BOND" },
          { key: "Sub type", value: "OTH" },
          { key: "NBMCE", value: "8" },
          { key: "Exchange", value: "LISTED" },
        ],
      },
    };
  }
  if (scenario === "sanction_hit") {
    return {
      id: "CASE-2026-SANCTION-001",
      productName: "Sanction Test ELI",
      issuer: "Client A Bank Limited",
      productType: "Unknown",
      currency: "HKD",
      underlyings: ["AAA.HK"],
      submittedTime: "27 Jul 2026 11:45",
      owner: "Demo Trader",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      sourceScenario: scenario,
    };
  }
  return {
    id: "CASE-2026-0720-003",
    productName: "Primary Bank 2Y HKD FRN",
    issuer: "Primary Bank",
    productType: "Unknown",
    currency: "HKD",
    underlyings: [],
    submittedTime: "20 Jul 2026 11:00",
    owner: "Demo Trader",
    classification: "pending",
    compliance: "pending",
    launchDocs: "not_required",
    productCode: "not_started",
    fields: [],
    documents: [],
    templates: [],
    sourceScenario: scenario,
  };
}

export function applyProcessingResult(c: CaseItem, scenario: DemoScenario): CaseItem {
  if (scenario === "eli_client_a") {
    return {
      ...c,
      productName: "Client A KO KI ELI [AAA+BBB]",
      issuer: "Client A Bank Limited",
      productType: "ELI",
      currency: "HKD",
      underlyings: ["AAA.HK", "BBB.HK"],
      classification: "classified",
      compliance: "clear",
      templateRule: "ELI_COMPLEX_V1",
      structure: "Complex ELI (Daily Autocall + At-Expiry Knock-in)",
      classificationReason: "Client A Basket DCDC ELI identified from Series Number SERIES-A-001",
      launchDocs: "trader_review",
      productCode: "not_started",
      fields: eliClientAFields,
      documents: buildCompleteSetDocuments(scenario),
      templates: buildClientATemplates(),
      realFiles: [],
    };
  }
  if (scenario === "eli_client_b") {
    return {
      ...c,
      productName: "Client B Daily Call ELI [CCC]",
      issuer: "Client B Bank Europe SE",
      productType: "ELI",
      currency: "HKD",
      underlyings: ["BBB.HK"],
      classification: "classified",
      compliance: "clear",
      templateRule: "ELI_STANDARD_V1",
      structure: "Standard ELI (Daily Call, No Knock-in)",
      classificationReason: "Client B ELI identified from Series Number SERIES-B-001",
      launchDocs: "trader_review",
      productCode: "not_started",
      fields: eliClientBFields,
      documents: buildCompleteSetDocuments(scenario),
      templates: buildClientBTemplates(),
      realFiles: [],
    };
  }
  if (scenario === "sanction_hit") {
    return {
      ...c,
      productName: "Sanction Test ELI",
      issuer: "Client A Bank Limited",
      productType: "ELI",
      currency: "HKD",
      underlyings: ["AAA.HK"],
      classification: "classified",
      compliance: "blocked",
      templateRule: "SANCTION_BLOCK_V1",
      structure: "Blocked by sanctions screening",
      classificationReason: "Demo sanction list match detected during screening",
      sanctionReason: "Demo Sanction List Match",
      sanctionHitUnderlying: "DEMO-SANCTIONED-ENTITY",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
    };
  }
  if (scenario === "bond_secondary") {
    return {
      ...c,
      productType: "Bond",
      classification: "classified",
      compliance: "clear",
      templateRule: "BOND_CODE_V1",
      structure: "Bond (Secondary)",
      classificationReason: "Secondary bond — previously traded on market. Sourced from market data screenshots + email.",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: secondaryBondFields,
      documents: [],
      templates: buildSecondaryBondTemplates(),
      realFiles: [],
    };
  }
  return {
    ...c,
    productType: "Bond",
    classification: "classified",
    compliance: "clear",
    templateRule: "BOND_CODE_V1",
    structure: "Bond",
    classificationReason: "Product family identified as Bond — ELI launch pack not required",
    launchDocs: "not_required",
    productCode: "not_started",
    fields: bondFields,
    documents: [],
    templates: buildBondTemplates(),
    realFiles: [],
  };
}

/* ================================================================
   Seeded dashboard cases (5)
   ================================================================ */
export function seedCases(): CaseItem[] {
  return [
    {
      id: "CASE-2026-0612-004",
      productName: "Client A KO KI ELI [AAA+BBB]",
      issuer: "Client A Bank Limited",
      productType: "ELI",
      currency: "HKD",
      underlyings: ["AAA.HK", "BBB.HK"],
      submittedTime: "12 Jun 2026 10:30",
      owner: "Demo Trader",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      isSeeded: true,
      sourceScenario: "eli_client_a",
      emailDetected: true,
      salesRequestEmail: {
        subject: "New ELI launch request — Client A Basket",
        from: "Demo Sales <demo.sales@example.com>",
        to: "Flow Products <flow-products@example.com>",
        date: "27 Jul 2026 11:42",
        body: "Dear Team,\n\nThe following Tranche is Pending for Approval:",
        table: [
          { key: "Trade Date", value: "27-Jul-2026" },
          { key: "Counterparty", value: "Client A" },
          { key: "Product", value: "ELIFC" },
          { key: "Currency", value: "HKD" },
          { key: "BBG Code 1", value: "AAA HK" },
          { key: "BBG Code 2", value: "BBB HK" },
          { key: "Strike", value: "79.00%" },
          { key: "KO Type", value: "Daily Call" },
          { key: "Coupon p.a.", value: "13.08%" },
          { key: "Tenor", value: "8M" },
          { key: "KI Type", value: "At-Expiry 63.00%" },
        ],
      },
      realFiles: [],
    },
    {
      ...buildScenarioCase("eli_client_b"),
      productType: "ELI",
      isSeeded: true,
      emailDetected: true,
      salesRequestEmail: {
        subject: "New ELI launch request — Client B Single",
        from: "Demo Sales <demo.sales@example.com>",
        to: "Flow Products <flow-products@example.com>",
        date: "24 Jun 2026 11:17",
        body: "Dear Team,\n\nThe following Tranche is Pending for Approval:",
        table: [
          { key: "Trade Date", value: "24-Jun-2026" },
          { key: "Counterparty", value: "Client B" },
          { key: "Product", value: "ELIFC" },
          { key: "Currency", value: "HKD" },
          { key: "BBG Code 1", value: "BBB HK" },
          { key: "Strike", value: "95.00%" },
          { key: "KO Type", value: "Daily Call" },
          { key: "KO", value: "100.00%" },
          { key: "Coupon p.a.", value: "10.08%" },
          { key: "Tenor", value: "6M" },
          { key: "KI Type", value: "None" },
        ],
      },
      realFiles: [],
    },
    {
      id: "CASE-2026-0728-013",
      productName: "Primary Bank 2Y HKD FRN",
      issuer: "Primary Bank",
      productType: "Bond",
      currency: "HKD",
      underlyings: [],
      submittedTime: "28 Jul 2026 09:30",
      owner: "Demo Trader",
      classification: "pending",
      compliance: "pending",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: [],
      documents: [],
      templates: [],
      isSeeded: true,
      sourceScenario: "bond_primary",
      salesRequestEmail: PRIMARY_BOND_REQUEST_EMAIL,
      realFiles: [],
    },
    {
      id: "CASE-2026-0420-008",
      productName: "Primary Bank 2Y HKD FRN",
      issuer: "Primary Bank",
      productType: "Bond",
      currency: "HKD",
      underlyings: [],
      submittedTime: "15 Jul 2026 16:00",
      owner: "Demo Trader",
      classification: "classified",
      compliance: "clear",
      launchDocs: "not_required",
      productCode: "code_created",
      fields: bondFields,
      documents: [],
      templates: buildBondTemplates().map((t) => ({ ...t, status: "approved" as const })),
      templateRule: "BOND_CODE_V1",
      structure: "Bond",
      classificationReason: "Product family = Bond",
      fieldsConfirmed: true,
      opsAlerted: true,
      traderNotified: true,
      productCodeResult: {
        code: "BDPRIMARY20260728A",
        createdTime: "21 Jul 2026 09:15",
        copiaRef: "BNHKPRI0001",
        summitRef: "PRI280728",
        createdBy: "Demo Operations",
      },
      isSeeded: true,
      realFiles: [],
    },
    {
      id: "CASE-2026-0430-012",
      productName: "Secondary Bond 3.875% 2027",
      issuer: "Secondary Issuer (Fictional)",
      productType: "Bond",
      currency: "USD",
      underlyings: [],
      submittedTime: "30 Apr 2026 15:15",
      owner: "Demo Investment",
      classification: "classified",
      compliance: "clear",
      launchDocs: "not_required",
      productCode: "not_started",
      fields: secondaryBondFields,
      documents: [],
      templates: buildSecondaryBondTemplates(),
      templateRule: "BOND_CODE_V1",
      structure: "Bond (Secondary)",
      classificationReason: "Secondary bond — the demo bank has not traded before. Source: market data screenshots + email request.",
      fieldsConfirmed: false,
      opsAlerted: false,
      traderNotified: false,
      salesRequestEmail: {
        subject: "[Open Bond Code] Secondary Bond 3.875% 2027",
        from: "Demo User <demo.user@example.com>",
        to: "Treasury Settlement; Operations Team",
        date: "30 Apr 2026 15:15",
        body: "Dear TS,\n\nPlease help to create code for the enclosed bond in Summit. The NBMCE must be marked as “8”. Please raise any adverse comment or mismatch with the record on your side.",
        table: [
          { key: "Type", value: "BOND" },
          { key: "Sub type", value: "OTH" },
          { key: "NBMCE", value: "8" },
          { key: "Exchange", value: "LISTED" },
          { key: "Issuer", value: "Secondary Issuer" },
          { key: "Currency", value: "USD" },
          { key: "Coupon", value: "3.875%" },
          { key: "Maturity", value: "04-Aug-2027" },
        ],
        attachments: ["image001.png", "image002.png", "image003.png", "image008.png"],
      },
      isSeeded: true,
      sourceScenario: "bond_secondary",
      realFiles: [],
    },
  ];
}

export const DEMO_PRODUCT_CODE_BOND = "BDPRIMARY20260728A";
