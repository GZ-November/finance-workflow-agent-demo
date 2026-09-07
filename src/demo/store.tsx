import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AuditEvent,
  CaseItem,
  DemoScenario,
  Notification,
  OverallStatus,
  PageId,
  Role,
  EmailDraft,
} from "./types";
import {
  applyProcessingResult,
  buildScenarioCase,
  DEMO_PRODUCT_CODE_BOND,
  seedCases,
} from "./mock";
import { buildLaunchEmailDraft } from "./launchEmail";

export function overallStatus(c: CaseItem): OverallStatus {
  if (c.compliance === "blocked") return "Blocked";
  if (c.classification === "pending" && c.productCode === "not_started") return "New";
  if (c.classification === "pending") return "Processing";
  const isBond = c.productType === "Bond";
  if (isBond) {
    if (c.productCode === "code_created") return "Completed";
    if (!c.fieldsConfirmed && c.classification === "classified") return "Trader Review";
    if (c.productCode === "operations_review") return "Operations Review";
    return "In Progress";
  }
  const docDone = c.launchDocs === "launch_email_sent";
  const codeDone = c.productCode === "code_created";
  if (docDone && codeDone) return "Completed";
  if (c.launchDocs === "launch_email_sent") return "In Progress";
  if (c.launchDocs === "trader_review") return "Trader Review";
  if (c.productCode === "operations_review" && c.launchDocs === "not_required")
    return "Operations Review";
  return "In Progress";
}

export function nowStamp(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  }).format(d).replace(",", "");
}

const DEMO_MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const DEMO_MONTH_NAMES = Object.keys(DEMO_MONTHS);

export function parseDemoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const month = DEMO_MONTHS[match[2]];
  if (month === undefined) return null;
  return new Date(Number(match[3]), month, Number(match[1]));
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) remaining -= 1;
  }
  return result;
}

export function formatDemoDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${DEMO_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function issuerSystemCodes(issuer: string): { key: string; copia: string; summit: string } {
  const name = issuer.toUpperCase();
  if (name.includes("CLIENT A")) return { key: "CLTA", copia: "CLTA", summit: "CLTA" };
  if (name.includes("CLIENT B")) return { key: "CLTB", copia: "CLTB", summit: "CLTB" };
  if (name.includes("PRIMARY")) return { key: "PRIM", copia: "PRIM", summit: "PRIM" };
  if (name.includes("SECOND")) return { key: "SECO", copia: "SECO", summit: "SECO" };
  const alnum = issuer.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return { key: alnum, copia: alnum.slice(0, 3), summit: alnum.slice(0, 4) };
}

function deriveSystemCodes(target: CaseItem, allCases: CaseItem[]): { copiaRef: string; summitRef: string } {
  const issuerCodes = issuerSystemCodes(target.issuer);
  const productPrefix = target.productType === "ELI" ? "EI" : target.productType === "Bond" ? "BN" : target.productType.slice(0, 2).toUpperCase();
  const currencyCode = target.currency.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  const nth = allCases.filter((c) =>
    c.id !== target.id &&
    c.productType === target.productType &&
    issuerSystemCodes(c.issuer).key === issuerCodes.key &&
    c.productCodeResult
  ).length + 1;
  const copiaRef = `${productPrefix}${currencyCode}${issuerCodes.copia}${String(nth).padStart(4, "0")}`;
  const maturityValue =
    target.fields.find((f) => f.key === "maturityDate")?.value ??
    target.templates.flatMap((t) => t.rows).find((row) => /maturity date/i.test(row.field))?.value ??
    "";
  const maturity = parseDemoDate(maturityValue);
  const endDate = maturity
    ? `${String(maturity.getDate()).padStart(2, "0")}${String(maturity.getMonth() + 1).padStart(2, "0")}${String(maturity.getFullYear()).slice(2)}`
    : "000000";
  const summitRef = `${issuerCodes.summit}${endDate}`;
  return { copiaRef, summitRef };
}

export const DOWNSTREAM_FIELDS: Record<string, string[]> = {
  issuer: ["Issuer"],
  productType: ["Product Type", "Type / Sub Type"],
  currency: ["Currency"],
  underlyings: ["Underlyings"],
  notional: ["Notional", "Issue Amount"],
  issueAmount: ["Issue Amount"],
  couponRate: ["Coupon Rate", "Coupon Frequency / Rate"],
  couponFrequency: ["Coupon Frequency", "Coupon Frequency / Rate"],
  issueDate: ["Issue Date"],
  settlementDate: ["Settlement Date", "Issue Date / Settlement Date"],
  maturityDate: ["Maturity Date"],
  firstCouponDate: ["First Coupon Date"],
  issuePrice: ["Issue Price"],
  dayCount: ["Day Count Method"],
  denomination: ["Denomination", "Face Value"],
  faceValue: ["Face Value"],
  lotSize: ["Lot Size"],
  minSubscription: ["Minimum Subscription"],
  riskRating: ["Risk Rating", "Product Risk Rating"],
  minLaunchAmount: ["Min. Amount in Launching"],
  listing: ["Listing", "Listed/Unlisted", "Exchange"],
  securitiesCode: ["Securities Code", "Series Number"],
  summitName: ["Name", "Securities Name"],
  nbmce: ["NBMCE"],
};

export const COMBINED_PARTS: Record<string, Record<string, number>> = {
  couponRate: { "Coupon Frequency / Rate": 1 },
  couponFrequency: { "Coupon Frequency / Rate": 0 },
  productType: { "Type / Sub Type": 1 },
  issueDate: { "Issue Date / Settlement Date": 0 },
  settlementDate: { "Issue Date / Settlement Date": 1 },
};

export function mergeCombinedValue(current: string, value: string, partIdx?: number): string {
  if (partIdx === undefined || !current.includes("/")) return value;
  const parts = current.split("/").map((part) => part.trim());
  if (parts.length <= partIdx) return value;
  parts[partIdx] = value;
  return parts.join(" / ");
}

export function computeSettlementUpdate(
  fields: { key: string; label: string; sourceKind?: string }[],
  newMaturity: string
): string | null {
  const settlementField = fields.find(
    (f) => f.key === "settlementDate" && (f.sourceKind === "rule-derived" || /us stock/i.test(f.label))
  );
  const parsed = parseDemoDate(newMaturity);
  if (!settlementField || !parsed) return null;
  return formatDemoDate(addBusinessDays(parsed, 2));
}

interface Store {
  role: Role;
  page: PageId;
  productCodeOnly: boolean;
  cases: CaseItem[];
  activeCaseId: string | null;
  scenario: DemoScenario | null;
  notifications: Notification[];
  audit: AuditEvent[];
  recordAudit: (entry: AuditRecordInput) => void;
  setRole: (r: Role) => void;
  go: (p: PageId) => void;
  beginNewLaunch: () => void;
  beginProductCodeLaunch: () => void;
  openCase: (id: string) => void;
  startScenario: (s: DemoScenario, fileName: string) => void;
  finishProcessing: () => void;
  updateCase: (id: string, patch: Partial<CaseItem>) => void;
  editField: (caseId: string, key: string, value: string) => void;
  setManualInputDone: (caseId: string) => void;
  approveLaunchPack: (caseId: string) => void;
  saveOutlookDraft: (caseId: string) => void;
  updateEmailDraft: (caseId: string, draft: EmailDraft) => void;
  sendLaunchEmail: (caseId: string, draft: EmailDraft) => void;
  editTemplateRow: (caseId: string, tplId: string, rowIdx: number, value: string) => void;
  approveTemplate: (caseId: string, tplId: string) => void;
  completeUpload: (caseId: string) => void;
  notifyTrader: (caseId: string) => void;
  confirmFields: (caseId: string) => void;
  markNotificationsRead: () => void;
  resetDemo: () => void;
  activeCase: CaseItem | null;
}

export type AuditRecordInput = Omit<AuditEvent, "id" | "time" | "timestamp">;

const AUDIT_STORAGE_KEY = "demo-demo-audit-v2";

function loadAudit(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(AUDIT_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((event) => event?.id && event?.timestamp && event?.action) : [];
  } catch {
    return [];
  }
}

const Ctx = createContext<Store | null>(null);

let seq = 100;
const nid = (p: string) => `${p}-${++seq}`;

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("trader");
  const [page, go] = useState<PageId>("dashboard");
  const [cases, setCases] = useState<CaseItem[]>(seedCases());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Store["scenario"]>(null);
  const [productCodeOnly, setProductCodeOnly] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>(loadAudit);

  useEffect(() => {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(audit));
  }, [audit]);

  const beginNewLaunch = useCallback(() => {
    setProductCodeOnly(false);
    setActiveCaseId(null);
    setScenario(null);
    go("upload");
  }, []);
  const beginProductCodeLaunch = useCallback(() => {
    setProductCodeOnly(true);
    setActiveCaseId(null);
    setScenario(null);
    setRoleState("operations");
    go("upload");
  }, []);
  const recordAudit = useCallback((entry: AuditRecordInput) => {
    const timestamp = new Date().toISOString();
    setAudit((prev) => [{
      ...entry,
      id: `${nid("ev")}-${Date.now()}`,
      time: nowStamp(),
      timestamp,
    }, ...prev]);
  }, []);

  const addAudit = useCallback((
    actor: string,
    action: string,
    detail: string,
    tone: AuditEvent["tone"] = "info",
    context: Partial<Pick<AuditEvent, "category" | "caseId" | "productName" | "metadata">> = {},
  ) => {
    recordAudit({
      actor,
      action,
      detail,
      tone,
      category: context.category ?? "case",
      caseId: context.caseId,
      productName: context.productName,
      metadata: context.metadata,
    });
  }, [recordAudit]);

  const setRole = useCallback((nextRole: Role) => {
    if (nextRole === role) return;
    recordAudit({
      actor: role === "operations" ? "Demo Operations" : "Trader",
      action: "Workspace role changed",
      detail: `Workspace changed from ${role === "operations" ? "Operations" : "Trader"} to ${nextRole === "operations" ? "Operations" : "Trader"}`,
      tone: "info",
      category: "system",
      metadata: { previousRole: role, newRole: nextRole },
    });
    setRoleState(nextRole);
  }, [recordAudit, role]);

  const notify = useCallback((title: string, body: string, tone: Notification["tone"] = "info") => {
    setNotifications((prev) => [{ id: nid("nt"), time: nowStamp(), title, body, read: false, tone }, ...prev]);
  }, []);

  const updateCase = useCallback((id: string, patch: Partial<CaseItem>) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const openCase = useCallback(
    (id: string) => {
      setProductCodeOnly(false);
      setActiveCaseId(id);
      const c = cases.find((x) => x.id === id);
      if (c) {
        addAudit(
          role === "operations" ? "Demo Operations" : c.owner,
          "Case opened",
          `${c.productName} opened from the ${role === "operations" ? "Operations" : "Trader"} workspace`,
          "info",
          { category: "case", caseId: c.id, productName: c.productName },
        );
      }
      if (c?.classification === "pending") {
        const inferred: DemoScenario =
          c.sourceScenario ??
          (c.productType === "Bond" || c.issuer === "Primary Bank" ? "bond_primary" :
          c.issuer === "Client A Bank Limited" ? "eli_client_a" : "eli_client_b");
        setScenario(inferred);
        go("upload");
      } else if (c?.compliance === "blocked") go("sanctionBlocked");
      else if (c?.productType === "Bond") go("bondRoute");
      else go("caseWorkspace");
    },
    [addAudit, cases, role]
  );

  const startScenario = useCallback(
    (s: DemoScenario, fileName: string) => {
      const existing = activeCaseId ? cases.find((item) => item.id === activeCaseId) : null;
      const generated = buildScenarioCase(s);
      const baseCase = existing
        ? {
            ...generated,
            id: existing.id,
            submittedTime: existing.submittedTime,
            owner: existing.owner,
            salesRequestEmail: existing.salesRequestEmail ?? generated.salesRequestEmail,
            emailDetected: existing.emailDetected,
          }
        : generated;
      const c = productCodeOnly
        ? {
            ...baseCase,
            id: existing?.id ?? nid("CASE-OPG"),
            owner: "Demo Operations",
            salesRequestEmail: undefined,
            emailDetected: false,
          }
        : baseCase;
      setCases((prev) => [c, ...prev.filter((existing) => existing.id !== c.id)]);
      setActiveCaseId(c.id);
      setScenario(s);
      addAudit(
        productCodeOnly ? "Demo Operations" : c.owner,
        "Source document uploaded",
        `${fileName} uploaded and attached to the Case`,
        "info",
        {
          category: "document",
          caseId: c.id,
          productName: c.productName,
          metadata: { fileName, scenario: s },
        },
      );
      go("processing");
    },
    [activeCaseId, cases, addAudit, productCodeOnly]
  );

  const finishProcessing = useCallback(() => {
    if (!activeCaseId || !scenario) return;
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== activeCaseId) return c;
        const processed = applyProcessingResult(c, scenario);
        return productCodeOnly && processed.compliance !== "blocked"
          ? {
              ...processed,
              owner: "Demo Operations",
              fieldsConfirmed: true,
              launchDocs: "not_required",
              productCode: "operations_review",
              opsAlerted: false,
            }
          : processed;
      })
    );
    const productName = cases.find((x) => x.id === activeCaseId)?.productName ?? "the case";
    if (scenario === "sanction_hit") {
      addAudit("AI Agent", "Sanctions screening", `${productName} matched a demo sanction record — case blocked`, "danger", {
        category: "security", caseId: activeCaseId, productName,
      });
    } else if (scenario === "bond_primary" || scenario === "bond_secondary") {
      addAudit("AI Agent", "Classification complete", `${productName} classified as Bond — routed to Product Code Creation`, "success", {
        category: "case", caseId: activeCaseId, productName, metadata: { classification: "Bond" },
      });
      addAudit("AI Agent", "Templates generated", "COPIA and Summit templates prepared for Operations", "success", {
        category: "template", caseId: activeCaseId, productName,
      });
    } else {
      const isComplex = scenario === "eli_client_a";
      addAudit("AI Agent", "Classification complete", `${productName} classified as ${isComplex ? "Complex" : "Standard"} ELI — screening completed`, "success", {
        category: "case", caseId: activeCaseId, productName, metadata: { classification: isComplex ? "Complex ELI" : "Standard ELI" },
      });
      addAudit("AI Agent", "Launch documents generated", "Customer-facing launch documents and downstream templates generated from the reviewed source data", "success", {
        category: "document", caseId: activeCaseId, productName,
      });
    }
  }, [activeCaseId, scenario, addAudit, cases, productCodeOnly]);

  const editField = useCallback(
    (caseId: string, key: string, value: string) => {
      const targetCase = cases.find((item) => item.id === caseId);
      const targetField = targetCase?.fields.find((field) => field.key === key);
      if (!targetCase || !targetField || targetField.value === value) return;
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const settlementUpdate = key === "maturityDate" ? computeSettlementUpdate(c.fields, value) : null;
          const updates: { names: string[]; value: string; parts?: Record<string, number> }[] = [
            { names: DOWNSTREAM_FIELDS[key] ?? [], value, parts: COMBINED_PARTS[key] },
          ];
          if (settlementUpdate) {
            updates.push({
              names: ["Settlement Date", "Issue Date / Settlement Date"],
              value: settlementUpdate,
              parts: { "Issue Date / Settlement Date": 1 },
            });
          }
          return {
            ...c,
            ...(key === "issuer" ? { issuer: value } : {}),
            ...(key === "currency" ? { currency: value } : {}),
            ...(key === "underlyings" ? { underlyings: value.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
            fields: c.fields.map((f) => {
              if (f.key === key) return { ...f, value, edited: true, confidence: 100 };
              if (settlementUpdate && f.key === "settlementDate") {
                return { ...f, value: settlementUpdate, edited: true, confidence: 100 };
              }
              return f;
            }),
            templates: c.templates.map((template) => ({
              ...template,
              rows: template.rows.map((row) => {
                const update = updates.find((candidate) => candidate.names.includes(row.field));
                if (!update) return row;
                return {
                  ...row,
                  value: mergeCombinedValue(row.value, update.value, update.parts?.[row.field]),
                  source: "manual" as const,
                  issue: false,
                  reviewed: true,
                };
              }),
            })),
          };
        })
      );
      addAudit(
        targetCase.owner,
        targetField.manualRequired ? "Manual field completed" : "Extracted field edited",
        `${targetField.label} changed from "${targetField.value || "blank"}" to "${value || "blank"}"`,
        targetField.manualRequired ? "warning" : "info",
        {
          category: "field",
          caseId,
          productName: targetCase.productName,
          metadata: { field: targetField.label, previousValue: targetField.value, newValue: value },
        },
      );
    },
    [addAudit, cases]
  );

  const setManualInputDone = useCallback(
    (caseId: string) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                manualInputDone: true,
                documents: c.documents.map((d) => (d.status === "needs_input" ? { ...d, status: "generated" } : d)),
              }
            : c
        )
      );
      const c = cases.find((item) => item.id === caseId);
      addAudit(c?.owner ?? "Trader", "Manual input completed", "All required Trader-owned fields have been completed", "success", {
        category: "field", caseId, productName: c?.productName,
      });
    },
    [addAudit, cases]
  );

  const approveLaunchPack = useCallback(
    (caseId: string) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                launchDocs: "outlook_draft",
                documents: c.documents.map((d) => ({ ...d, status: "approved" as const })),
              }
            : c
        )
      );
      const c = cases.find((item) => item.id === caseId);
      addAudit(c?.owner ?? "Trader", "Launch pack approved", "All customer-facing launch documents reviewed and approved", "success", {
        category: "document", caseId, productName: c?.productName, metadata: { documentCount: c?.documents.length ?? 0 },
      });
    },
    [addAudit, cases]
  );

  const saveOutlookDraft = useCallback(
    (caseId: string) => {
      const c = cases.find((item) => item.id === caseId);
      if (!c) return;
      const emailDraft: EmailDraft = c.emailDraft ?? buildLaunchEmailDraft(c, nowStamp());
      updateCase(caseId, { outlookDraftSaved: true, launchDocs: "outlook_draft", emailDraft });
      addAudit("AI Agent", "Outlook draft created", "Customer email and approved launch document attachments prepared for Trader review", "info", {
        category: "email",
        caseId,
        productName: c.productName,
        metadata: { subject: emailDraft.subject, attachmentCount: emailDraft.attachmentIds.length },
      });
    },
    [cases, updateCase, addAudit]
  );

  const updateEmailDraft = useCallback(
    (caseId: string, draft: EmailDraft) => updateCase(caseId, { emailDraft: draft, outlookDraftSaved: true }),
    [updateCase]
  );

  const sendLaunchEmail = useCallback(
    (caseId: string, draft: EmailDraft) => {
      const sentAt = nowStamp();
      updateCase(caseId, {
        emailDraft: { ...draft, updatedAt: sentAt },
        launchDocs: "launch_email_sent",
        launchEmailSentAt: sentAt,
        outlookDraftSaved: true,
      });
      const c = cases.find((item) => item.id === caseId);
      addAudit(c?.owner ?? "Trader", "Launch email sent", `Launch email sent to ${draft.to} with ${draft.attachmentIds.length} attachment(s)`, "success", {
        category: "email",
        caseId,
        productName: c?.productName,
        metadata: { to: draft.to, cc: draft.cc, subject: draft.subject, attachmentCount: draft.attachmentIds.length },
      });
      go("launchConfirmation");
    },
    [updateCase, addAudit, cases]
  );

  const editTemplateRow = useCallback(
    (caseId: string, tplId: string, rowIdx: number, value: string) => {
      const targetCase = cases.find((item) => item.id === caseId);
      const targetTemplate = targetCase?.templates.find((template) => template.id === tplId);
      const targetRow = targetTemplate?.rows[rowIdx];
      if (!targetCase || !targetTemplate || !targetRow || targetRow.value === value) return;
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                templates: c.templates.map((t) =>
                  t.id === tplId
                    ? {
                        ...t,
                        status: t.status === "approved" ? "approved" : "in_review",
                        rows: t.rows.map((r, i) =>
                          i === rowIdx ? { ...r, value, source: "ops" as const, issue: false } : r
                        ),
                      }
                    : t
                ),
              }
            : c
        )
      );
      addAudit(
        "Demo Operations",
        targetRow.issue ? "Validation exception corrected" : "Template value edited",
        `${targetTemplate.name} · ${targetRow.field} changed from "${targetRow.value || "blank"}" to "${value || "blank"}"`,
        targetRow.issue ? "warning" : "info",
        {
          category: "template",
          caseId,
          productName: targetCase.productName,
          metadata: { template: targetTemplate.name, field: targetRow.field, previousValue: targetRow.value, newValue: value },
        },
      );
    },
    [addAudit, cases]
  );

  const approveTemplate = useCallback(
    (caseId: string, tplId: string) => {
      const target = cases.find((c) => c.id === caseId)?.templates.find((t) => t.id === tplId);
      if (!target || target.rows.some((row) => row.issue)) return;
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, templates: c.templates.map((t) => (t.id === tplId ? { ...t, status: "approved" } : t)) }
            : c
        )
      );
      const c = cases.find((item) => item.id === caseId);
      addAudit("Demo Operations", "Template approved", `${target.name} reviewed and approved`, "success", {
        category: "template", caseId, productName: c?.productName, metadata: { template: target.name },
      });
    },
    [addAudit, cases]
  );

  const completeUpload = useCallback(
    (caseId: string) => {
      const target = cases.find((item) => item.id === caseId);
      if (!target) return;
      let createdCode: string;
      if (target.productType === "Bond" && target.id.includes("0430")) createdCode = "BDSECOND20260430A";
      else if (target.productType === "Bond") createdCode = DEMO_PRODUCT_CODE_BOND;
      else if (target.sourceScenario === "eli_client_a") createdCode = "SERIES-A-001";
      else if (target.sourceScenario === "eli_client_b") createdCode = "SERIES-B-001";
      else createdCode = "SERIES-A-001";
      const { copiaRef, summitRef } = deriveSystemCodes(target, cases);
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            productCode: "code_created",
            productCodeResult: {
              code: createdCode,
              createdTime: nowStamp(),
              copiaRef,
              summitRef,
              createdBy: "Demo Operations",
            },
          };
        })
      );
      addAudit("Demo Operations", "Product codes created", `COPIA ${copiaRef} and Summit ${summitRef} created; product code ${createdCode} returned`, "success", {
        category: "system",
        caseId,
        productName: target.productName,
        metadata: { productCode: createdCode, copiaReference: copiaRef, summitReference: summitRef },
      });
    },
    [addAudit, cases]
  );

  const notifyTrader = useCallback(
    (caseId: string) => {
      const c = cases.find((x) => x.id === caseId);
      if (!c?.productCodeResult || c.traderNotified) return;
      updateCase(caseId, { traderNotified: true });
      notify(
        "Product code created",
        `The new product code ${c.productCodeResult.code} has been created for ${c.productName}.`,
        "success"
      );
      addAudit("Demo Operations", "Trader notified", `${c.owner} notified of product code ${c.productCodeResult.code}`, "success", {
        category: "system", caseId, productName: c.productName, metadata: { productCode: c.productCodeResult.code, recipient: c.owner },
      });
    },
    [cases, updateCase, notify, addAudit]
  );

  const confirmFields = useCallback(
    (caseId: string) => {
      updateCase(caseId, { fieldsConfirmed: true, productCode: "operations_review", opsAlerted: true });
      const c = cases.find((x) => x.id === caseId);
      addAudit(c?.owner ?? "Trader", "Extracted fields confirmed", "Extracted terms and all required manual fields reviewed and confirmed", "success", {
        category: "field", caseId, productName: c?.productName,
      });
      if (c && !c.opsAlerted) {
        notify(
          "New Product Code Request",
          `AI has extracted and trader confirmed fields for ${c.productName}. COPIA & Summit templates ready for Operations review.`,
          "info"
        );
        addAudit("AI Agent", "Operations notified", `New product code request sent to Operations for ${c.productName}`, "info", {
          category: "system", caseId, productName: c.productName,
        });
      }
    },
    [updateCase, addAudit, notify, cases]
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetDemo = useCallback(() => {
    setCases(seedCases());
    setAudit([]);
    setNotifications([]);
    setActiveCaseId(null);
    setScenario(null);
    setProductCodeOnly(false);
    setRoleState("trader");
    go("dashboard");
  }, []);

  const activeCase = useMemo(
    () => cases.find((c) => c.id === activeCaseId) ?? null,
    [cases, activeCaseId]
  );

  const value: Store = {
    role, page, productCodeOnly, cases, activeCaseId, scenario, notifications, audit, recordAudit,
    setRole, go, beginNewLaunch, beginProductCodeLaunch, openCase, startScenario, finishProcessing, updateCase, editField,
    setManualInputDone, approveLaunchPack, saveOutlookDraft, updateEmailDraft, sendLaunchEmail,
    editTemplateRow, approveTemplate, completeUpload,
    notifyTrader, confirmFields, markNotificationsRead, resetDemo, activeCase,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useDemo outside provider");
  return s;
}
