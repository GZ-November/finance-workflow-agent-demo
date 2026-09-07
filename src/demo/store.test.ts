import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  COMBINED_PARTS,
  computeSettlementUpdate,
  DOWNSTREAM_FIELDS,
  formatDemoDate,
  mergeCombinedValue,
  parseDemoDate,
} from "./store";
import {
  bondFields,
  buildBondTemplates,
  buildClientBTemplates,
  buildClientATemplates,
  buildSecondaryBondTemplates,
  eliClientBFields,
  eliClientAFields,
  secondaryBondFields,
} from "./mock";
import type { ExcelTemplate, ExtractedField } from "./types";

describe("parseDemoDate", () => {
  it("parses the demo date format", () => {
    const d = parseDemoDate("04 Aug 2027");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2027);
    expect(d!.getMonth()).toBe(7);
    expect(d!.getDate()).toBe(4);
  });

  it("accepts single-digit days and extra whitespace", () => {
    const d = parseDemoDate(" 4 Aug 2027 ");
    expect(d!.getDate()).toBe(4);
  });

  it("rejects invalid formats and unknown months", () => {
    expect(parseDemoDate("2027-08-04")).toBeNull();
    expect(parseDemoDate("04 Foo 2027")).toBeNull();
    expect(parseDemoDate("August 4, 2027")).toBeNull();
    expect(parseDemoDate("")).toBeNull();
  });
});

describe("addBusinessDays", () => {
  it("adds days within the same week", () => {
    const wed = parseDemoDate("04 Aug 2027")!; // Wednesday
    expect(formatDemoDate(addBusinessDays(wed, 2))).toBe("06 Aug 2027"); // Friday
  });

  it("skips the weekend (Friday + 1 = Monday)", () => {
    const fri = parseDemoDate("06 Aug 2027")!; // Friday
    expect(formatDemoDate(addBusinessDays(fri, 1))).toBe("09 Aug 2027"); // Monday
  });

  it("skips the weekend (Friday + 2 = Tuesday)", () => {
    const fri = parseDemoDate("21 May 2027")!; // Friday — Client X maturity
    expect(formatDemoDate(addBusinessDays(fri, 2))).toBe("25 May 2027"); // Tuesday
  });

  it("matches the pre-filled US Stock settlement dates", () => {
    // Client X: maturity 21 May 2027 → 25 May 2027
    expect(formatDemoDate(addBusinessDays(parseDemoDate("21 May 2027")!, 2))).toBe("25 May 2027");
    // Sample Case: maturity 20 Jan 2027 → 22 Jan 2027
    expect(formatDemoDate(addBusinessDays(parseDemoDate("20 Jan 2027")!, 2))).toBe("22 Jan 2027");
  });

  it("does not mutate the input date", () => {
    const d = parseDemoDate("04 Aug 2027")!;
    addBusinessDays(d, 5);
    expect(formatDemoDate(d)).toBe("04 Aug 2027");
  });
});

describe("formatDemoDate", () => {
  it("round-trips through parseDemoDate", () => {
    for (const value of ["01 Jan 2026", "28 Jul 2026", "31 Dec 2027"]) {
      expect(formatDemoDate(parseDemoDate(value)!)).toBe(value);
    }
  });
});

describe("computeSettlementUpdate", () => {
  const usStockFields = [
    { key: "settlementDate", label: "US Stock Settlement Date", sourceKind: "rule-derived" },
  ];

  it("recalculates maturity + 2 business days for rule-derived US Stock fields", () => {
    expect(computeSettlementUpdate(usStockFields, "21 May 2027")).toBe("25 May 2027");
    expect(computeSettlementUpdate(usStockFields, "06 Aug 2027")).toBe("10 Aug 2027"); // Fri → Tue
  });

  it("returns null when the settlement field is term-sheet sourced", () => {
    const genericFields = [{ key: "settlementDate", label: "Settlement Date" }];
    expect(computeSettlementUpdate(genericFields, "21 May 2027")).toBeNull();
  });

  it("returns null for unparseable maturity values", () => {
    expect(computeSettlementUpdate(usStockFields, "not a date")).toBeNull();
  });
});

describe("mergeCombinedValue", () => {
  it("replaces only the rate part of Coupon Frequency / Rate", () => {
    expect(mergeCombinedValue("Monthly / 8.04% p.a.", "9.00% p.a.", COMBINED_PARTS.couponRate["Coupon Frequency / Rate"]))
      .toBe("Monthly / 9.00% p.a.");
  });

  it("replaces only the frequency part of Coupon Frequency / Rate", () => {
    expect(mergeCombinedValue("Monthly / 8.04% p.a.", "Quarterly", COMBINED_PARTS.couponFrequency["Coupon Frequency / Rate"]))
      .toBe("Quarterly / 8.04% p.a.");
  });

  it("replaces only the settlement part of Issue Date / Settlement Date", () => {
    expect(mergeCombinedValue("18 Jun 2026 / 18 Jun 2026", "20 Jun 2026", COMBINED_PARTS.settlementDate["Issue Date / Settlement Date"]))
      .toBe("18 Jun 2026 / 20 Jun 2026");
  });

  it("replaces the whole value when there is no combined part", () => {
    expect(mergeCombinedValue("Act/360", "Act/365", undefined)).toBe("Act/365");
    expect(mergeCombinedValue("100", "98.5", 1)).toBe("98.5");
  });
});

describe("DOWNSTREAM_FIELDS template row matching", () => {
  const scenarios: { name: string; fields: ExtractedField[]; templates: ExcelTemplate[] }[] = [
    { name: "ELI Client A Basket", fields: eliClientAFields, templates: buildClientATemplates() },
    { name: "ELI Client B Single", fields: eliClientBFields, templates: buildClientBTemplates() },
    { name: "Bond Primary", fields: bondFields, templates: buildBondTemplates() },
    { name: "Bond Secondary", fields: secondaryBondFields, templates: buildSecondaryBondTemplates() },
  ];

  for (const scenario of scenarios) {
    it(`${scenario.name}: every mapped extracted field reaches at least one template row`, () => {
      const allRowNames = new Set(scenario.templates.flatMap((t) => t.rows.map((r) => r.field)));
      const unmatched: string[] = [];
      for (const field of scenario.fields) {
        const targets = DOWNSTREAM_FIELDS[field.key];
        if (!targets) continue;
        if (!targets.some((name) => allRowNames.has(name))) {
          unmatched.push(`${field.key} -> [${targets.join(", ")}]`);
        }
      }
      // minLaunchAmount is a launch-control field with no product-code template row
      expect(unmatched.filter((entry) => !entry.startsWith("minLaunchAmount"))).toEqual([]);
    });
  }

  it("SECOND: new Market Data Source fields have matching rows in pcc and summit", () => {
    const [pcc, , summit] = buildSecondaryBondTemplates();
    for (const rowName of ["Issue Date", "First Coupon Date", "Day Count Method", "Maturity Date"]) {
      expect(pcc.rows.map((r) => r.field)).toContain(rowName);
      expect(summit.rows.map((r) => r.field)).toContain(rowName);
    }
    expect(summit.rows.map((r) => r.field)).toContain("CUSIP");
    expect(summit.rows.map((r) => r.field)).toContain("Min Piece / Increment");
    expect(pcc.rows.map((r) => r.field)).toContain("Ratings");
  });

  it("SECOND: combined coupon rows exist in copia and summit for part-wise merge", () => {
    const [, copia, summit] = buildSecondaryBondTemplates();
    for (const template of [copia, summit]) {
      const row = template.rows.find((r) => r.field === "Coupon Frequency / Rate");
      expect(row).toBeDefined();
      expect(row!.value).toContain("/");
    }
  });
});
