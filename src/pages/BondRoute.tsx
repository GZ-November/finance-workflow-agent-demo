import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink, FileSpreadsheet,
  FileText, FolderOpen, Info, Pencil, UserRound, X,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, TypeBadge } from "@/components/bits";
import {
  CLIENT_EXTRACTED_FIELD_GROUPS,
  manualFieldHint,
  mergedSourceTag,
  sourcePillClass,
} from "@/demo/extractedTerms";

export default function BondRoute() {
  const d = useDemo();
  const c = d.activeCase;
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [workspaceView, setWorkspaceView] = useState<"data" | "files">("data");

  if (!c || c.productType !== "Bond") {
    return (
      <div className="fb-card p-10 text-center text-slate-500">
        No bond case selected.{" "}
        <button className="text-demo-green font-semibold" onClick={() => d.go("dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const saveEdit = (key: string) => {
    if (!draftValue.trim()) return;
    d.editField(c.id, key, draftValue.trim());
    setEditingKey(null);
  };
  const confirmAndContinue = () => {
    d.confirmFields(c.id);
    d.setRole("operations");
    d.go("codeReview");
  };
  const dataRow = (field: (typeof c.fields)[number]) => {
    const tag = mergedSourceTag(field);
    return (
    <div key={field.key} className={`group grid min-h-[47px] grid-cols-[170px_minmax(0,1fr)_auto_30px] items-center gap-3 border-y border-transparent px-5 py-1.5 ${field.manualRequired ? "border-amber-200 bg-amber-50/70" : field.edited ? "bg-amber-50/55" : "bg-white hover:bg-slate-50/70"}`}>
      <div className={`text-[12.5px] font-medium ${field.manualRequired ? "text-amber-800" : "text-slate-500"}`}>
        {field.label}{field.manualRequired ? <span className="ml-1 text-red-500">*</span> : null}
      </div>
      {editingKey === field.key ? (
        <div className="col-span-3 flex items-center gap-1.5">
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-md border-2 border-demo-blue bg-white px-2.5 py-1.5 text-[13px] font-bold text-demo-dark outline-none"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEdit(field.key);
              if (event.key === "Escape") setEditingKey(null);
            }}
          />
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white" onClick={() => saveEdit(field.key)} title="Save change"><Check size={15} /></button>
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-600" onClick={() => setEditingKey(null)} title="Cancel"><X size={15} /></button>
        </div>
      ) : (
        <>
          <div className="min-w-0">
            {field.manualRequired && !field.value ? (
              <div>
                <button
                  className="w-full rounded-lg border border-dashed border-amber-400 bg-white px-3 py-2 text-left text-[12px] font-bold text-amber-700 hover:border-amber-500 hover:bg-amber-50"
                  onClick={() => { setEditingKey(field.key); setDraftValue(""); }}
                >
                  Enter manually
                </button>
                <div className="mt-1 text-[9.5px] leading-4 text-amber-700">{manualFieldHint(field.key)}</div>
              </div>
            ) : (
              <div className="text-[13.5px] font-semibold text-slate-800">{field.value}</div>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${sourcePillClass(tag.kind)}`}>
              {tag.text}
            </span>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-demo-light hover:text-demo-blue group-hover:opacity-100"
            onClick={() => { setEditingKey(field.key); setDraftValue(field.value); }}
            title={`Edit ${field.label}`}
          >
            <Pencil size={14} />
          </button>
        </>
      )}
    </div>
  );
  };
  const groupedKeys = new Set<string>(CLIENT_EXTRACTED_FIELD_GROUPS.flatMap((group) => group.keys));
  const groupedFields = CLIENT_EXTRACTED_FIELD_GROUPS
    .map((group) => ({ ...group, fields: group.keys.map((key) => c.fields.find((field) => field.key === key)).filter(Boolean) as typeof c.fields }))
    .filter((group) => group.fields.length > 0);
  const otherFields = c.fields.filter((field) => !groupedKeys.has(field.key));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Trader Review — Bond"
        right={<button className="fb-btn-ghost" onClick={() => d.go("dashboard")}><ArrowLeft size={16} /> Back to Queue</button>}
      />

      <div className="fb-card mb-5 flex items-center gap-6 border-l-4 !border-l-demo-blue px-6 py-4">
        <div className="min-w-0">
          <div className="truncate text-[20px] font-black leading-tight text-demo-dark">{c.productName}</div>
        </div>
        <TypeBadge type={c.productType} />
        <div className="ml-auto flex shrink-0 items-center gap-2 rounded-lg bg-demo-pale px-3.5 py-2 text-[12.5px] text-slate-500">
          <UserRound size={14} className="text-slate-400" />
          <span>Owner</span>
          <b className="text-demo-dark">{c.owner}</b>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <section className="overflow-hidden rounded-xl border border-demo-line bg-white shadow-card">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-demo-light text-demo-blue">
                <FolderOpen size={19} />
              </div>
              <h2 className="min-w-0 truncate text-[17px] font-extrabold leading-tight text-demo-dark">Full Extracted Data &amp; Source Files</h2>
              <div className="ml-auto flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setWorkspaceView("data")}
                  className={`min-w-[108px] rounded-lg px-3 py-2 text-[11px] font-extrabold transition-colors ${workspaceView === "data" ? "bg-white text-demo-dark shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Extracted Data
                </button>
                <button
                  onClick={() => setWorkspaceView("files")}
                  className={`min-w-[96px] rounded-lg px-3 py-2 text-[11px] font-extrabold transition-colors ${workspaceView === "files" ? "bg-white text-demo-dark shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Source Files
                </button>
              </div>
            </div>
          </div>

          {workspaceView === "data" ? (
            <div className="max-h-[650px] overflow-auto bg-white py-2">
              {groupedFields.map((group) => (
                <div key={group.title} className="pb-2">
                  <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 pb-1.5 pt-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{group.title}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{group.description}</div>
                  </div>
                  {group.fields.map(dataRow)}
                </div>
              ))}
              {otherFields.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 pb-1.5 pt-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Additional data</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">Fields outside the client input sheet</div>
                  </div>
                  {otherFields.map(dataRow)}
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[420px] bg-slate-50 p-4">
              <div className="overflow-hidden rounded-xl border border-demo-line bg-white">
                {(c.realFiles ?? []).map((file, index) => (
                  <a
                    key={file.path}
                    href={file.path}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 border-b border-demo-line px-4 py-3.5 last:border-b-0 hover:bg-demo-light/60"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${file.path.toLowerCase().endsWith(".xlsx") ? "bg-emerald-50 text-emerald-600" : "bg-demo-light text-demo-blue"}`}>
                      {file.path.toLowerCase().endsWith(".xlsx") ? <FileSpreadsheet size={17} /> : <FileText size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-demo-dark">{file.name}</div>
                      <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-slate-400">Source file {String(index + 1).padStart(2, "0")}</div>
                    </div>
                    <ExternalLink size={15} className="text-slate-300" />
                  </a>
                ))}
                {(c.realFiles ?? []).length === 0 && (
                  <div className="flex min-h-[280px] items-center justify-center text-[13px] text-slate-400">No source files available.</div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="fb-card p-5">
          <h3 className="text-[16px] font-extrabold text-demo-dark">Outputs Prepared</h3>
          <p className="mt-1 text-[12px] text-slate-500">The code creation outputs are generated together from the same Trader-confirmed data.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-demo-line p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-demo-light text-demo-blue"><FileText size={18} /></div><div><div className="text-[13px] font-bold text-demo-dark">Bond Code Creation</div><div className="text-[11.5px] text-slate-500">Bond code request generated for Operations</div></div></div>
            <div className="flex items-center gap-3 rounded-xl border border-demo-line p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><FileSpreadsheet size={18} /></div><div><div className="text-[13px] font-bold text-demo-dark">Product Code Templates</div><div className="text-[11.5px] text-slate-500">COPIA &amp; Summit templates generated simultaneously for Operations</div></div></div>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[12px] leading-snug text-slate-500">
              <span className="font-bold text-slate-600">ELI Launch Documents are not required for this product type.</span>{" "}
              Bond products skip the launch document lane entirely. AI extracts terms once and feeds them directly into code creation templates.
            </p>
          </div>
          <div className="mt-5 flex justify-center">
            {!c.fieldsConfirmed ? (
              <button className="fb-btn-primary !px-12 !py-3.5 !text-[15.5px]" onClick={confirmAndContinue}>
                <CheckCircle2 size={17} /> Confirm &amp; continue to Product Code Review
              </button>
            ) : (
              <button className="fb-btn-primary !px-12 !py-3.5 !text-[15.5px]" onClick={() => { d.setRole("operations"); d.go("codeReview"); }}>
                Continue to Product Code Review <ArrowRight size={16} />
              </button>
            )}
          </div>
          {c.fieldsConfirmed && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[12.5px] font-bold text-emerald-700">
              <CheckCircle2 size={15} /> Trader confirmed — AI will auto-alert OPG
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
