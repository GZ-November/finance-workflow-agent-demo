import { X, FileText, FileSpreadsheet, ExternalLink } from "lucide-react";
import type { ExcelTemplate } from "@/demo/types";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  kind: "pdf" | "docx" | "xlsx" | "zip" | "msg";
  realFilePaths?: { name: string; path: string }[];
  children: React.ReactNode;
}

export function FilePreviewModal({ open, onClose, title, kind, realFilePaths, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-lift max-w-[900px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-demo-line shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              kind === "pdf" ? "bg-red-50 text-red-600" :
              kind === "xlsx" ? "bg-emerald-50 text-emerald-600" :
              "bg-demo-light text-demo-blue"
            }`}>
              {kind === "xlsx" ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-extrabold text-demo-dark truncate">{title}</div>
              <div className="text-[12px] text-slate-400 uppercase tracking-wide">{kind} Preview</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {realFilePaths && realFilePaths.length > 0 && (
              <div className="flex gap-1.5">
                {realFilePaths.map((f, i) => (
                  <a
                    key={i}
                    href={f.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-demo-blue text-black text-[12px] font-bold hover:bg-demo-green hover:text-white transition-colors shrink-0"
                  >
                    <ExternalLink size={13} />
                    {f.name}
                  </a>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-demo-mist flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-demo-mist/40">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Simulated Term Sheet PDF preview content
   ================================================================ */
interface FieldRow { label: string; value: string; }

export function TermSheetPreview({ issuer, fields, scenario }: {
  issuer: string;
  fields: FieldRow[];
  scenario: string;
}) {
  const isBondSecondary = scenario === "bond_secondary";
  const isBondPrimary = scenario === "bond_primary";
  const isClientA = scenario === "eli_client_a";
  const isClientB = scenario === "eli_client_b";
  const documentLabel = isBondSecondary ? "Outlook Email + Market Data Source" : isBondPrimary ? "Primary Bond Term Sheet" : "Indicative Term Sheet";
  const productTitle = isBondSecondary
    ? "Secondary Bond 3.875% 2027"
    : isBondPrimary
    ? "Primary Bank 2Y HKD FRN"
    : isClientA
    ? "Client A KO KI ELI [AAA+BBB]"
    : isClientB
    ? "Client B Daily Call ELI [CCC]"
    : "Indicative ELI";
  const sourceDate = isBondSecondary
    ? "Outlook request with Market Data Source screenshots dated 30 April 2026"
    : isBondPrimary
    ? "Primary Bond Term Sheet dated 20 July 2026"
    : isClientA
    ? "Indicative Terms and Conditions dated 27 July 2026"
    : "Indicative Terms and Conditions dated 24 June 2026";

  return (
    <div className="bg-white rounded-lg shadow-card p-8 max-w-[720px] mx-auto font-['Times_New_Roman',serif] text-[15px] leading-relaxed">
      {/* Header like a real term sheet */}
      <div className="text-center border-b border-slate-300 pb-5 mb-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">{documentLabel}</div>
        <div className="text-[20px] font-bold text-demo-dark break-words">
          {issuer} — {productTitle}
        </div>
        <div className="text-[12px] text-slate-500 mt-1.5">
          {sourceDate}
        </div>
      </div>

      {/* Key terms table */}
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 mb-3">Summary Terms</h3>
      <table className="w-full text-[14px]">
        <tbody>
          {fields.map((f, i) => (
            <tr key={i} className={`${i % 2 === 0 ? "bg-slate-50" : ""}`}>
              <td className="py-2.5 px-3 font-bold text-slate-700 w-[40%] border-r border-slate-200">{f.label}</td>
              <td className="py-2.5 px-3 text-demo-dark font-medium">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-slate-300 text-[11px] text-slate-400 text-center">
        This is a simulated preview for demonstration purposes. Not actual legal document content.
      </div>
    </div>
  );
}

/* ================================================================
   Simulated Excel spreadsheet preview
   ================================================================ */
export function ExcelPreview({ template }: { template: ExcelTemplate }) {
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden max-w-[780px] mx-auto">
      {/* Toolbar mock */}
      <div className="bg-[#F0F0F0] px-4 py-2 flex items-center gap-2 border-b border-slate-300">
        <span className="text-[12px] font-bold text-slate-600">{template.name}</span>
        <span className="text-[11px] text-slate-400 ml-auto">Simulated Excel Preview</span>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#F5F5F5] border-b border-slate-300">
              <th className="py-2 px-3 text-left text-[11px] text-slate-400 font-semibold border-r border-slate-200 w-10" />
              <th className="py-2 px-3 text-left text-[11px] text-slate-400 font-semibold border-r border-slate-200 font-mono">A</th>
              <th className="py-2 px-3 text-left text-[11px] text-slate-400 font-semibold font-mono">B</th>
            </tr>
          </thead>
          <tbody>
            {template.rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-200 hover:bg-demo-light/40">
                <td className="py-2 px-3 text-[11px] text-slate-400 font-mono text-center border-r border-slate-200 bg-[#F5F5F5]">{i + 1}</td>
                <td className={`py-2 px-3 font-medium border-r border-slate-200 ${
                  r.source === "ai" ? "bg-demo-light/50 text-demo-dark" :
                  r.source === "ops" ? "bg-amber-50/40 text-amber-800" :
                  "text-slate-700"
                }`}>
                  {r.field}
                </td>
                <td className={`py-2 px-3 font-semibold ${
                  r.source === "ai" ? "bg-demo-light/50 text-demo-dark" :
                  r.source === "ops" ? "bg-amber-50/40 text-amber-800" :
                  r.issue ? "text-red-600 bg-red-50/40" : "text-slate-700"
                }`}>
                  {r.value}
                  {r.source === "ai" && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-demo-light text-demo-blue font-bold">AI</span>}
                  {r.source === "ops" && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold">OPS</span>}
                  {r.issue && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold">!</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
