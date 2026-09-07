import { useMemo, useState } from "react";
import {
  ArrowLeft, Pencil, CheckCircle2, PackageCheck, ShieldCheck, AlertTriangle,
  FileSpreadsheet, FileText, FolderOpen, ExternalLink, Download, MonitorCog,
  Save, RotateCcw, TableProperties,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, TypeBadge } from "@/components/bits";
import { ExcelViewer } from "@/components/ExcelViewer";
import type { ExcelTemplate } from "@/demo/types";
import {
  CLIENT_EXTRACTED_FIELD_GROUPS,
  mergedSourceTag,
  sourcePillClass,
} from "@/demo/extractedTerms";

interface ExcelViewerTarget {
  filePath: string;
  sheetName?: string;
  label: string;
  systemFileId?: string;
}

interface SourceDocumentTarget {
  name: string;
  path: string;
  kind: "pdf" | "docx" | "msg";
}

function statusBadge(t: ExcelTemplate) {
  if (t.status === "approved")
    return <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
  if (t.status === "in_review")
    return <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">In Review</span>;
  return <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">Generated</span>;
}

function copiaFieldSection(field: string) {
  const normalized = field.toLowerCase();
  if (/date|maturity|coupon|day count|settlement/.test(normalized)) return "Date & Interest";
  if (/risk|authorized|check|picop|cirq|rating/.test(normalized)) return "Risk & Branch Controls";
  return "Main";
}

export default function CodeTemplateReview() {
  const d = useDemo();
  const c = d.activeCase;
  const [openId, setOpenId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editCell, setEditCell] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [exceptionValue, setExceptionValue] = useState("8");
  const [excelViewerTarget, setExcelViewerTarget] = useState<ExcelViewerTarget | null>(null);
  const [systemFileNotice, setSystemFileNotice] = useState("");
  const [comparisonView, setComparisonView] = useState<"data" | "files">("data");
  const [showExcelPreview, setShowExcelPreview] = useState(false);

  const templates = useMemo(() => (c?.templates ?? []).filter((t) => t.id !== "pcc"), [c?.templates]);
  const openTpl = useMemo(() => templates.find((t) => t.id === openId) ?? templates[0] ?? null, [templates, openId]);
  const sourceDocuments = useMemo<SourceDocumentTarget[]>(() => {
    const files = c?.realFiles ?? [];
    if (c?.productType === "ELI") {
      const termSheets = files.filter((file) =>
        file.path.toLowerCase().endsWith(".pdf") &&
        !/final/i.test(file.name) &&
        (/indicative|term sheet/i.test(file.name) || file.path.includes("/source/"))
      );
      return termSheets.map((file) => ({ name: file.name, path: file.path, kind: "pdf" }));
    }

    const docxTermSheets = files.filter((file) => file.path.toLowerCase().endsWith(".docx"));
    if (docxTermSheets.length > 0) {
      return docxTermSheets.map((file) => ({
        name: file.name,
        path: file.path,
        kind: "docx",
      }));
    }

    return files
      .filter((file) => file.path.toLowerCase().endsWith(".msg") && /bond|market data|request|secondary/i.test(`${file.name} ${file.path}`))
      .map((file) => ({ name: file.name, path: file.path, kind: "msg" }));
  }, [c]);

  if (!c || templates.length === 0) {
    return (
      <div className="fb-card p-10 text-center text-slate-500 animate-fade-up">
        <p className="mb-3">No code templates for this case.</p>
        <button className="fb-btn-primary" onClick={() => d.go("opsDashboard")}>Operations Dashboard</button>
      </div>
    );
  }

  const allTemplates = c.templates;
  const unresolvedIssues = allTemplates.reduce((count, template) => count + template.rows.filter((row) => row.issue).length, 0);
  const allApproved = templates.length > 0 && unresolvedIssues === 0 && templates.every((t) => t.status === "approved");
  const nbmceTemplate = allTemplates.find((template) => template.rows.some((row) => row.field === "NBMCE" && row.issue));
  const nbmceRowIndex = nbmceTemplate?.rows.findIndex((row) => row.field === "NBMCE") ?? -1;
  const nbmceRow = nbmceTemplate && nbmceRowIndex >= 0 ? nbmceTemplate.rows[nbmceRowIndex] : null;
  const groupedFieldKeys = new Set<string>(CLIENT_EXTRACTED_FIELD_GROUPS.flatMap((group) => group.keys));
  const extractedGroups = CLIENT_EXTRACTED_FIELD_GROUPS
    .map((group) => ({
      ...group,
      fields: group.keys
        .map((key) => c.fields.find((field) => field.key === key))
        .filter(Boolean) as typeof c.fields,
    }))
    .filter((group) => group.fields.length > 0);
  const additionalFields = c.fields.filter((field) => !groupedFieldKeys.has(field.key));
  const summitTemplate = templates.find((template) => template.id === "summit");
  const summitValue = (patterns: RegExp[], fallback = "—") =>
    summitTemplate?.rows.find((row) => patterns.some((pattern) => pattern.test(row.field)))?.value ?? fallback;
  const summitTypeParts = summitValue([/type.*sub type/i], c.productType).split("/").map((value) => value.trim());
  const summitCoupon = summitValue([/coupon frequency.*rate/i], c.fields.find((field) => field.key === "couponRate")?.value ?? "—");
  const summitIssueDate = summitValue([/^issue date$/i], c.fields.find((field) => field.key === "issueDate")?.value ?? "—");
  const summitSettlementDate = summitValue([/settlement date/i], c.fields.find((field) => field.key === "settlementDate")?.value ?? summitIssueDate);

  // Map each template to its real file based on what's available
  const realFileMap: Partial<Record<ExcelTemplate["id"], ExcelViewerTarget>> = {};
  if (c.realFiles) {
    // Find COPIA file (for ELI: combined template; for Bond: dedicated COPIA)
    const copiaFile = c.realFiles.find((f) => f.name.toLowerCase().includes("copia"));
    // Find Summit file (for Bond: dedicated Summit; for ELI: same as COPIA)
    const summitFile = c.realFiles.find((f) => f.name.toLowerCase().includes("summit"));

    if (copiaFile) {
      realFileMap.copia = {
        filePath: copiaFile.path,
        sheetName: c.productType === "ELI" ? "Copia Code" : "COPIA_Bond Setup",
        label: copiaFile.name,
        systemFileId: copiaFile.systemFileId,
      };
    }
    // Summit falls back to copia file if no dedicated summit file (ELI case)
    const summitPath = summitFile?.path ?? copiaFile?.path;
    if (summitPath) {
      realFileMap.summit = {
        filePath: summitPath,
        sheetName: c.productType === "ELI" ? "Summit Code" : "Summit_Bond Definition",
        label: summitFile?.name ?? copiaFile?.name ?? "Summit Workbook",
        systemFileId: summitFile?.systemFileId ?? copiaFile?.systemFileId,
      };
    }
  }
  const openPreviewTarget: ExcelViewerTarget | null = openTpl ? realFileMap[openTpl.id] ?? null : null;

  const openInSystem = (target: ExcelViewerTarget) => {
    setSystemFileNotice("Portfolio preview only. No desktop or banking system is connected.");
    setExcelViewerTarget(target);
  };

  const cellCls = (r: ExcelTemplate["rows"][number]) =>
    r.issue
      ? "border-2 border-red-400 bg-red-50"
      : "bg-white";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="The Product Code Templates Have Been Generated"
        right={
          <button className="fb-btn-ghost" onClick={() => d.go("opsDashboard")}>
            <ArrowLeft size={16} /> Operations Dashboard
          </button>
        }
      />

      {/* Case summary */}
      <div className="fb-card px-6 py-4 mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <span className="font-mono text-[12.5px] text-slate-500">{c.id}</span>
          <span className="mx-2.5 text-slate-300">|</span>
          <span className="font-extrabold text-demo-dark text-[16px]">{c.productName}</span>
        </div>
        <TypeBadge type={c.productType === "Unknown" ? "Unknown" : c.productType} />
      </div>

      {nbmceTemplate && nbmceRow && (
        <div className="mb-5 rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-red-600">Automatic numeric validation</span>
                <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10.5px] font-bold text-red-700">Secondary Bond</span>
              </div>
              <h3 className="mt-1 text-[17px] font-extrabold text-demo-dark">NBMCE Value Requires Human Review</h3>
              <p className="mt-1 text-[12.5px] text-red-700">{nbmceRow.issueReason}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Detected</div>
                  <div className="font-mono text-[18px] font-black text-red-600">{nbmceRow.value}</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Expected</div>
                  <div className="text-[13px] font-bold text-demo-dark">{nbmceRow.expectedValue}</div>
                </div>
                <div className="ml-auto flex items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-red-600">Operations correction</span>
                    <input value={exceptionValue} onChange={(event) => setExceptionValue(event.target.value.replace(/\D/g, ""))} className="w-[150px] rounded-lg border-2 border-red-300 bg-white px-3 py-2 text-[14px] font-bold outline-none focus:border-demo-blue" />
                  </label>
                  <button
                    className="fb-btn-primary !py-2.5"
                    disabled={!exceptionValue || Number(exceptionValue) > 5}
                    onClick={() => d.editTemplateRow(c.id, nbmceTemplate.id, nbmceRowIndex, exceptionValue)}
                  >
                    Apply correction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openTpl && (
        <section className="fb-card mb-6 overflow-hidden">
          <div className="border-b border-demo-line bg-slate-50 px-4 pt-3">
            <div className="flex items-end justify-end gap-3">
              {templates.map((template) => {
                const selected = template.id === openTpl.id;
                const templateIssues = template.rows.filter((row) => row.issue).length;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setOpenId(template.id);
                      setEditMode(false);
                      setEditCell(null);
                      setShowExcelPreview(false);
                    }}
                    className={`min-w-[280px] rounded-t-xl border border-b-0 px-6 py-4 text-left transition-colors ${
                      selected
                        ? "border-demo-line bg-white text-demo-dark"
                        : "border-transparent bg-slate-100/70 text-slate-500 hover:bg-white/70"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <FileSpreadsheet size={20} className={selected ? "text-emerald-600" : "text-slate-400"} />
                      <span className="truncate text-[16px] font-extrabold">{template.name}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-[12px]">
                      <span>{template.rows.length} fields</span>
                      {templateIssues > 0
                        ? <span className="font-bold text-red-600">{templateIssues} issue</span>
                        : <span className="font-bold text-emerald-600">Ready</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-h-[720px] xl:grid-cols-[minmax(400px,0.9fr)_minmax(620px,1.25fr)]">
            <aside className="min-w-0 border-b border-demo-line bg-white xl:border-b-0 xl:border-r">
              <div className="border-b border-demo-line bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <FolderOpen size={20} className="shrink-0 text-demo-blue" />
                  <div className="min-w-0 truncate text-[14px] font-extrabold text-demo-dark">Full Extracted Data &amp; Source Files</div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">{c.fields.length} extracted fields</span>
                  <div className="ml-auto flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      onClick={() => setComparisonView("data")}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                        comparisonView === "data" ? "bg-white text-demo-dark shadow-sm" : "text-slate-400"
                      }`}
                    >
                      Extracted Data
                    </button>
                    <button
                      onClick={() => setComparisonView("files")}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                        comparisonView === "files" ? "bg-white text-demo-dark shadow-sm" : "text-slate-400"
                      }`}
                    >
                      Source Files
                    </button>
                  </div>
                </div>
              </div>

              {comparisonView === "data" ? (
                <div className="h-[654px] overflow-auto bg-white py-2">
                  {extractedGroups.map((group) => (
                    <div key={group.title} className="pb-2">
                      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-1.5 pt-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{group.title}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{group.description}</div>
                      </div>
                      {group.fields.map((field) => (
                        (() => {
                          const tag = mergedSourceTag(field);
                          return (
                            <div
                              key={field.key}
                              className={`grid min-h-[48px] grid-cols-[125px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 ${
                                field.manualRequired ? "border-y border-amber-200 bg-amber-50/70" : field.edited ? "bg-amber-50/60" : "bg-white hover:bg-slate-50/70"
                              }`}
                            >
                              <div className={`text-[12px] font-medium ${field.manualRequired ? "text-amber-800" : "text-slate-500"}`}>
                                {field.label}{field.manualRequired ? <span className="ml-1 text-red-500">*</span> : null}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-[13px] font-bold leading-5 ${field.value ? "text-slate-800" : "text-amber-700"}`}>
                                  {field.value || "Manual determination required"}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${sourcePillClass(tag.kind)}`}>
                                  {tag.text}
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      ))}
                    </div>
                  ))}
                  {additionalFields.length > 0 && (
                    <div>
                      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-1.5 pt-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Additional data</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">Fields outside the client input sheet</div>
                      </div>
                      {additionalFields.map((field) => {
                        const tag = mergedSourceTag(field);
                        return (
                          <div key={field.key} className="grid min-h-[48px] grid-cols-[125px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 hover:bg-slate-50/70">
                            <div className="text-[12px] font-medium text-slate-500">{field.label}</div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold leading-5 text-slate-800">{field.value}</div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${sourcePillClass(tag.kind)}`}>{tag.text}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[654px] overflow-auto bg-slate-50 p-3">
                  <div className="overflow-hidden rounded-xl border border-demo-line bg-white">
                    {sourceDocuments.map((file, index) => (
                      <a
                        key={file.path}
                        href={file.path}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 border-b border-demo-line px-4 py-3.5 last:border-b-0 hover:bg-demo-light/60"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <FileText size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-bold text-demo-dark">{file.name}</div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            Source document {String(index + 1).padStart(2, "0")}
                          </div>
                        </div>
                        <ExternalLink size={14} className="shrink-0 text-slate-300" />
                      </a>
                    ))}
                    {sourceDocuments.length === 0 && (
                      <div className="flex min-h-[260px] flex-col items-center justify-center px-8 text-center text-slate-400">
                        <FileText size={34} className="mb-3 opacity-40" />
                        <div className="text-[12.5px] font-semibold">No original source document is available for this case.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>

            <div className="min-w-0 bg-white">
          <div className="flex items-center gap-3 border-b border-demo-line bg-white px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[16px] font-extrabold text-demo-dark">{openTpl.name}</h3>
                {statusBadge(openTpl)}
              </div>
              <div className="mt-1 text-[11.5px] text-slate-500">
                {openTpl.rows.length} fields · {openTpl.rows.filter((row) => row.issue).length} validation issues
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {!showExcelPreview && (
                <button
                  className={`fb-btn-outline !px-3.5 !py-2 !text-[12.5px] ${editMode ? "!border-demo-blue !bg-demo-light !text-demo-blue" : ""}`}
                  onClick={() => {
                    setEditMode((value) => !value);
                    setEditCell(null);
                  }}
                >
                  <Pencil size={14} /> {editMode ? "Finish editing" : "Edit values"}
                </button>
              )}
              {openPreviewTarget && (
                <>
                  <button
                    className={`fb-btn-outline !px-3.5 !py-2 !text-[12.5px] ${
                      showExcelPreview ? "!border-emerald-500 !bg-emerald-50 !text-emerald-700" : ""
                    }`}
                    onClick={() => {
                      setShowExcelPreview((value) => !value);
                      setEditMode(false);
                      setEditCell(null);
                    }}
                  >
                    <TableProperties size={14} /> {showExcelPreview ? "Back to fields" : "Excel preview"}
                  </button>
                  <a
                    href={openPreviewTarget.filePath}
                    download={openPreviewTarget.label}
                    className="fb-btn-outline !px-3.5 !py-2 !text-[12.5px] !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                  >
                    <Download size={14} /> Download Excel
                  </a>
                </>
              )}
              <button
                className="fb-btn-primary !px-4 !py-2 !text-[12.5px]"
                disabled={openTpl.status === "approved" || openTpl.rows.some((row) => row.issue)}
                title={openTpl.rows.some((row) => row.issue) ? "Resolve validation issues before approval" : undefined}
                onClick={() => d.approveTemplate(c.id, openTpl.id)}
              >
                <CheckCircle2 size={14} /> {openTpl.status === "approved" ? "Approved" : "Approve"}
              </button>
            </div>
          </div>

          {openPreviewTarget && showExcelPreview ? (
            <div className="h-[654px] overflow-auto bg-slate-100">
              <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-demo-line bg-white px-4 py-2.5">
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span className="text-[12px] font-extrabold text-demo-dark">{openPreviewTarget.label}</span>
                {openPreviewTarget.sheetName && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{openPreviewTarget.sheetName}</span>
                )}
                <button
                  onClick={() => void openInSystem(openPreviewTarget)}
                  className="ml-auto flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <ExternalLink size={12} /> Open in Excel
                </button>
              </div>
              <div className="p-3">
                <ExcelViewer
                  filePath={openPreviewTarget.filePath}
                  initialSheetName={openPreviewTarget.sheetName}
                  singleSheet
                />
              </div>
            </div>
          ) : openTpl.id === "copia" ? (
            <div className="h-[654px] overflow-auto bg-[#cad2dc] p-3">
              <div className="mx-auto min-w-[690px] max-w-[980px] overflow-hidden border border-[#657181] bg-[#ececec] shadow-[0_2px_8px_rgba(15,23,42,0.2)]">
                <div className="flex h-8 items-center bg-[#6b7280] px-3 text-[12px] font-bold text-white">
                  <MonitorCog size={15} className="mr-2" />
                  {c.productType === "Bond" ? "Bond Setup" : "Structured Product Setup"}
                  <span className="ml-auto font-normal text-white/80">COPIA Product Master</span>
                </div>

                <div className="border-b border-[#9aa3ad] bg-[#e4e4e4] px-3 py-2">
                  <div className="grid grid-cols-[110px_minmax(0,1fr)_110px_minmax(0,1.35fr)] items-center gap-2 text-[11px]">
                    <label className="text-slate-700">Market Code</label>
                    <div className="flex h-7 items-center border border-[#8f979f] bg-[#fffbd7] px-2 font-bold text-demo-dark">
                      {c.productType === "Bond" ? "BOND - BOND" : "SP - ELI"}
                      <span className="ml-auto text-[9px]">▼</span>
                    </div>
                    <label className="text-slate-700">Securities Code</label>
                    <div className="flex h-7 items-center border border-[#8f979f] bg-white px-2 font-bold text-demo-dark">
                      {openTpl.rows.find((row) => /securities code/i.test(row.field))?.value ?? "Pending allocation"}
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-[#9199a2] bg-[#dddddd] px-2 pt-2">
                  {["Main", "Statement Message", "Payment Schedule", "Underlying Setup"].map((tab, index) => (
                    <div
                      key={tab}
                      className={`min-w-[125px] rounded-t border border-b-0 border-[#929aa3] px-3 py-1.5 text-center text-[10.5px] ${
                        index === 0 ? "bg-[#f2f2f2] font-bold text-slate-800" : "bg-[#dedede] text-slate-600"
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#f2f2f2] p-3">
                  {["Main", "Date & Interest", "Risk & Branch Controls"].map((section, sectionIndex) => {
                    const sectionRows = openTpl.rows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => copiaFieldSection(row.field) === section);
                    return (
                      <fieldset
                        key={section}
                        className={`border border-[#9aa3ad] px-3 pb-3 pt-2 ${
                          sectionIndex === 2 ? "col-span-2" : ""
                        }`}
                      >
                        <legend className="px-1 text-[10.5px] font-semibold text-slate-700">{section}</legend>
                        <div className={`grid gap-x-4 gap-y-2 ${sectionIndex === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {sectionRows.map(({ row, index }) => (
                            <label key={row.field} className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-2 text-[10.5px] text-slate-700">
                              <span className="truncate" title={row.field}>{row.field}</span>
                              {editMode && editCell === index ? (
                                <input
                                  autoFocus
                                  className="h-7 min-w-0 border-2 border-slate-500 bg-white px-2 text-[11px] font-bold text-demo-dark outline-none"
                                  value={draft}
                                  onChange={(event) => setDraft(event.target.value)}
                                  onBlur={() => {
                                    if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                                    setEditCell(null);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                                      setEditCell(null);
                                    }
                                    if (event.key === "Escape") setEditCell(null);
                                  }}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editMode) return;
                                    setEditCell(index);
                                    setDraft(row.value);
                                  }}
                                  className={`flex h-7 min-w-0 items-center border px-2 text-left text-[11px] font-bold ${
                                    row.issue
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : editMode
                                        ? "border-slate-500 bg-[#fffbd7] text-demo-dark hover:border-slate-600"
                                        : "border-[#9aa3ad] bg-white text-demo-dark"
                                  }`}
                                >
                                  <span className="truncate">{row.value}</span>
                                  {/check|authorized|picop/i.test(row.field) && <span className="ml-auto text-[9px] text-slate-500">▼</span>}
                                </button>
                              )}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#9aa3ad] bg-[#e3e3e3] px-3 py-2">
                  <button className="flex h-7 items-center gap-1.5 border border-[#929aa3] bg-[#f4f4f4] px-4 text-[10.5px] text-slate-700 shadow-sm">
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button
                    className="flex h-7 items-center gap-1.5 border border-slate-500 bg-[#e5e7eb] px-5 text-[10.5px] font-bold text-demo-dark shadow-sm"
                    onClick={() => {
                      if (openTpl.status !== "approved" && !openTpl.rows.some((row) => row.issue)) {
                        d.approveTemplate(c.id, openTpl.id);
                      }
                    }}
                  >
                    <Save size={12} /> Save
                  </button>
                  <button className="h-7 border border-[#929aa3] bg-[#f4f4f4] px-5 text-[10.5px] text-slate-700 shadow-sm">Exit</button>
                </div>
              </div>
            </div>
          ) : openTpl.id === "summit" ? (
            <div className="h-[654px] overflow-auto bg-[#d6dbe1] p-3">
              <div className="mx-auto min-w-[700px] max-w-[980px] overflow-hidden border border-[#7d858d] bg-[#f5f5f5] shadow-[0_2px_8px_rgba(15,23,42,0.22)]">
                <div className="flex h-7 items-center bg-[#8a8a8a] px-2 text-[11px] font-bold text-white">
                  <span className="mr-2 text-red-200">▦</span>
                  {c.productType === "Bond" ? "Bond Definition : INQUIRY" : "Structured Product Definition : INQUIRY"}
                  <span className="ml-auto font-normal text-white/75">Summit</span>
                </div>

                <div className="bg-white p-3">
                  <div className="grid grid-cols-[80px_minmax(0,1fr)_65px_90px_55px_110px] items-center gap-2 text-[10.5px]">
                    <span>Sec Id</span>
                    <div className="h-7 border border-slate-300 bg-slate-100 px-2 py-1 font-bold text-demo-dark">
                      {summitValue([/series number/i], c.productCodeResult?.code ?? "Pending")}
                    </div>
                    <span>Version</span>
                    <div className="h-7 border border-slate-300 bg-slate-100/60 px-2 py-1">1</div>
                    <span>State</span>
                    <div className="h-7 border border-slate-400 bg-white px-2 py-1 font-bold text-demo-dark">REVAL</div>
                  </div>

                  <fieldset className="mt-2 border border-[#b7bec6] px-3 pb-2 pt-1.5">
                    <legend className="px-1 text-[10.5px] text-slate-500">Definition</legend>
                    <div className="grid grid-cols-[35px_85px_35px_95px_55px_100px_70px_70px_1fr] items-center gap-1.5 text-[10px]">
                      <span>Ccy</span>
                      <div className="h-6 bg-slate-100 px-2 py-1 font-bold text-demo-dark">{summitValue([/^currency$/i], c.currency)}</div>
                      <span>Type</span>
                      <div className="h-6 bg-slate-100 px-2 py-1 font-bold text-demo-dark">{summitTypeParts[0] || c.productType}</div>
                      <span>Sub type</span>
                      <div className="h-6 bg-slate-100 px-2 py-1 font-bold text-demo-dark">{summitTypeParts[1] || (c.productType === "Bond" ? "Fixed Rate" : "ELI")}</div>
                      <span>Assignable</span>
                      <div className="h-6 border border-[#c2c7cd] bg-[#f2f2f2] px-2 py-1 text-slate-500">N ▼</div>
                      <label className="flex items-center gap-1"><span className="h-3 w-3 border border-slate-400 bg-white" /> Active</label>
                    </div>
                  </fieldset>

                  <div className="mt-2 flex border-b border-[#aeb5bd] text-[9.5px]">
                    {["IDs", "Issuance", "Risk", "Pricing", "Trading", "Syndicate", "Operations", "Credit", "Conversion"].map((tab) => (
                      <div
                        key={tab}
                        className={`border border-b-0 border-[#aeb5bd] px-3 py-1 ${
                          tab === "Issuance" ? "bg-white font-bold text-slate-900" : "bg-[#e7e7e7] text-slate-600"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  <fieldset className="border border-t-0 border-[#b7bec6] px-3 pb-3 pt-2">
                    <legend className="px-1 text-[10px] text-slate-500">Issuance</legend>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {openTpl.rows.map((row, index) => (
                        <label key={row.field} className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-2 text-[9.5px] text-slate-700">
                          <span className="truncate" title={row.field}>{row.field}</span>
                          {editMode && editCell === index ? (
                            <input
                              autoFocus
                              className="h-6 min-w-0 border-2 border-slate-500 bg-white px-1.5 text-[10px] font-bold text-demo-dark outline-none"
                              value={draft}
                              onChange={(event) => setDraft(event.target.value)}
                              onBlur={() => {
                                if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                                setEditCell(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                                  setEditCell(null);
                                }
                                if (event.key === "Escape") setEditCell(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (!editMode) return;
                                setEditCell(index);
                                setDraft(row.value);
                              }}
                              className={`h-6 min-w-0 truncate border px-1.5 text-left text-[10px] font-bold ${
                                row.issue
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : editMode
                                    ? "border-slate-500 bg-[#fffbd7] text-demo-dark"
                                    : "border-slate-300 bg-slate-100 text-demo-dark"
                              }`}
                              title={row.value}
                            >
                              {row.value || "—"}
                            </button>
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-2 border border-[#b7bec6] px-3 pb-3 pt-1.5">
                    <legend className="px-1 text-[10px] text-slate-500">Flows</legend>
                    <div className="grid grid-cols-[45px_100px_35px_100px_45px_90px_65px_minmax(0,1fr)] items-center gap-2 text-[9.5px]">
                      <span>Start</span><div className="h-6 bg-slate-100 px-2 py-1">{summitIssueDate}</div>
                      <span>End</span><div className="h-6 bg-slate-100 px-2 py-1">{summitValue([/maturity date/i])}</div>
                      <span>Ccy</span><div className="h-6 bg-slate-100 px-2 py-1">{c.currency}</div>
                      <span>Notional</span><div className="h-6 bg-slate-100 px-2 py-1 text-right">{summitValue([/issue amount/i, /notional/i], c.fields.find((field) => field.key === "issueAmount" || field.key === "notional")?.value ?? "—")}</div>
                      <span>Rate</span><div className="h-6 bg-slate-100 px-2 py-1">{summitCoupon}</div>
                      <span>Settle</span><div className="h-6 bg-slate-100 px-2 py-1">{summitSettlementDate}</div>
                      <span>Basis</span><div className="h-6 bg-slate-100 px-2 py-1">{summitValue([/day count/i])}</div>
                      <span>Frequency</span><div className="h-6 bg-slate-100 px-2 py-1">{summitCoupon.split("/")[0]?.trim() || "—"}</div>
                    </div>
                  </fieldset>

                  <fieldset className="mt-2 border border-[#b7bec6] px-3 pb-3 pt-1.5">
                    <legend className="px-1 text-[10px] text-slate-500">Valuation</legend>
                    <div className="grid grid-cols-[80px_100px_55px_85px_45px_85px_55px_85px] items-center gap-2 text-[9.5px]">
                      <span>Settlement date</span><div className="h-6 bg-slate-100 px-2 py-1">{summitSettlementDate}</div>
                      <span>Price</span><div className="h-6 bg-slate-100 px-2 py-1 text-right">100.0000</div>
                      <span>Yield</span><div className="h-6 bg-slate-100 px-2 py-1 text-right">0.00</div>
                      <span>State</span><div className="h-6 bg-slate-100 px-2 py-1">REVAL</div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-[654px] overflow-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 text-[11.5px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="w-14 border border-slate-200 py-2 text-center">#</th>
                    <th className="w-[34%] border border-slate-200 px-4 py-2 text-left">Field</th>
                    <th className="border border-slate-200 px-4 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {openTpl.rows.map((row, index) => (
                    <tr key={row.field} className={row.issue ? "bg-red-50/60" : "hover:bg-demo-pale/50"}>
                      <td className="border border-slate-200 bg-slate-50 py-2 text-center text-[11px] font-bold text-slate-400">{index + 1}</td>
                      <td className="border border-slate-200 px-4 py-2.5 font-semibold text-slate-600">{row.field}</td>
                      <td
                        className={`border border-slate-200 px-4 py-2.5 font-bold text-demo-dark ${editMode ? "cursor-text hover:bg-demo-light" : ""} ${cellCls(row)}`}
                        onClick={() => {
                          if (!editMode) return;
                          setEditCell(index);
                          setDraft(row.value);
                        }}
                      >
                        {editMode && editCell === index ? (
                          <input
                            autoFocus
                            className="w-full rounded-md border-2 border-demo-blue bg-white px-2.5 py-1.5 text-[13.5px] outline-none"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={() => {
                              if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                              setEditCell(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                if (draft !== row.value) d.editTemplateRow(c.id, openTpl.id, index, draft);
                                setEditCell(null);
                              }
                              if (event.key === "Escape") setEditCell(null);
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{row.value}</span>
                            {row.issue && <span className="ml-auto flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-red-600"><AlertTriangle size={11} /> Validation error</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </div>
        </section>
      )}

      {systemFileNotice && (
        <div className="mb-4 rounded-xl border border-demo-green/25 bg-demo-green/5 px-4 py-3 text-[13px] font-semibold text-demo-green">
          {systemFileNotice}
        </div>
      )}

      {/* Source files */}
      {c.realFiles && c.realFiles.some((file) => !file.path.toLowerCase().endsWith(".xlsx")) && (
        <div className="fb-card p-5 mb-4">
          <h3 className="text-[15px] font-bold text-demo-dark mb-3 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-demo-green" />
            Source Files
          </h3>
          <div className="flex flex-col gap-1.5">
            {c.realFiles.filter((file) => !file.path.toLowerCase().endsWith(".xlsx")).map((f, i) => {
              return f.systemFileId ? (
                <button
                  key={i}
                  onClick={() => void openInSystem({ filePath: f.path, label: f.name, systemFileId: f.systemFileId })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-demo-mist text-[13.5px] font-semibold text-demo-blue transition-colors text-left"
                >
                  <ExternalLink size={14} className="text-red-500 shrink-0" />
                  {f.name}
                  <span className="text-[11px] text-slate-400 ml-auto">Open in Outlook</span>
                </button>
              ) : (
                <a
                  key={i}
                  href={f.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-demo-mist text-[13.5px] font-semibold text-demo-blue transition-colors"
                >
                  <ExternalLink size={14} className="text-red-500 shrink-0" />
                  {f.name}
                  <span className="text-[11px] text-slate-400 ml-auto">Open in new tab</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer action */}
      <div className="fb-card p-5 flex items-center gap-4 flex-wrap">
        <ShieldCheck size={22} className={allApproved ? "text-emerald-500" : "text-slate-300"} />
        <div className="text-[14.5px] text-slate-600">
          {allApproved ? (
            <span className="font-bold text-emerald-700">All {templates.length} template views approved — upload package can be generated.</span>
          ) : unresolvedIssues > 0 ? (
            <span className="font-bold text-red-700">
              Resolve {unresolvedIssues} validation {unresolvedIssues === 1 ? "issue" : "issues"} before template approval.
            </span>
          ) : (
            <>
              <b className="text-demo-dark">{templates.filter((t) => t.status === "approved").length}/{templates.length}</b> templates approved.
            </>
          )}
        </div>
        <button
          className="fb-btn-primary ml-auto !px-7 !py-3 !text-[15.5px]"
          disabled={!allApproved}
          onClick={() => d.go("internalUpload")}
        >
          <PackageCheck size={18} /> Continue to COPIA &amp; Summit Upload
        </button>
      </div>

      {/* Excel inline viewer modal */}
      {excelViewerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setExcelViewerTarget(null)}>
          <div className="bg-white rounded-2xl shadow-lift max-w-[960px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-demo-line shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                <div>
                  <div className="font-bold text-[15px] text-demo-dark">{excelViewerTarget.label}</div>
                  <div className="text-[11.5px] text-slate-400">
                    Source workbook{excelViewerTarget.sheetName ? ` · ${excelViewerTarget.sheetName}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {excelViewerTarget.systemFileId && (
                  <button
                    onClick={() => void openInSystem(excelViewerTarget)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-demo-green text-white text-[12.5px] font-bold hover:bg-emerald-700"
                  >
                    <ExternalLink size={14} /> Open in Desktop Excel
                  </button>
                )}
                <a
                  href={excelViewerTarget.filePath}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12.5px] font-bold hover:bg-emerald-100"
                >
                  <Download size={14} /> Download Original Excel
                </a>
                <button onClick={() => setExcelViewerTarget(null)} className="px-3 py-1.5 rounded-lg hover:bg-demo-mist text-slate-500 text-[13px] font-semibold">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-demo-mist/40">
              <ExcelViewer filePath={excelViewerTarget.filePath} initialSheetName={excelViewerTarget.sheetName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
