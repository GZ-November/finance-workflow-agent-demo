import { useMemo, useState } from "react";
import {
  AlertTriangle, Archive, ArrowRight, CheckCircle2, ChevronDown,
  FolderOpen, Inbox, KeyRound, Paperclip, Plus, X,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, StatusPill, TypeBadge } from "@/components/bits";
import type { CaseItem } from "@/demo/types";

type OpsQueueStatus = "New" | "In Progress" | "Requires Attention";

export default function OpsDashboard() {
  const d = useDemo();
  const [folderId, setFolderId] = useState<string | null>(null);

  const issues = (c: CaseItem) =>
    c.templates.reduce((total, template) => total + template.rows.filter((row) => row.issue && !row.reviewed).length, 0);

  const templateProgress = (c: CaseItem) => {
    const approved = c.templates.filter((template) => template.status === "approved").length;
    return `${approved}/${c.templates.length} approved`;
  };

  const opsStatus = (c: CaseItem): OpsQueueStatus => {
    if (issues(c) > 0) return "Requires Attention";
    if (c.productCode === "operations_review") return "New";
    return "In Progress";
  };

  const openCases = useMemo(
    () => d.cases.filter((c) =>
      c.classification === "classified" &&
      c.compliance === "clear" &&
      c.productCode !== "not_started" &&
      c.productCode !== "code_created"
    ),
    [d.cases],
  );
  const archivedCases = useMemo(
    () => d.cases.filter((c) => c.productCode === "code_created"),
    [d.cases],
  );
  const rows = openCases;
  const newCount = openCases.filter((c) => opsStatus(c) === "New").length;
  const attentionCount = openCases.filter((c) => opsStatus(c) === "Requires Attention").length;
  const folderCase = d.cases.find((c) => c.id === folderId);

  const openReview = (c: CaseItem) => {
    d.openCase(c.id);
    d.go("codeReview");
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Operations Workspace"
        right={
          <button className="fb-btn-primary !px-6 !py-3 !text-[15px]" onClick={d.beginProductCodeLaunch}>
            <Plus size={18} /> Launch Product Code
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-[1.65fr_1fr_1fr] gap-4">
        <div className="fb-card flex items-center gap-4 p-6">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Inbox size={25} /></div>
          <div>
            <div className="text-[14px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Open</div>
            <div className="mt-1 text-[34px] font-black leading-none text-demo-dark">{openCases.length}</div>
            <div className="mt-1 text-[14px] text-slate-500">Product code requests requiring Operations action</div>
          </div>
        </div>
        <div className="fb-card flex items-center gap-4 p-6">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-demo-light text-demo-blue"><KeyRound size={25} /></div>
          <div><div className="text-[34px] font-black text-demo-dark">{newCount}</div><div className="text-[14px] font-semibold text-slate-500">New Requests</div></div>
        </div>
        <div className="fb-card flex items-center gap-4 p-6">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={25} /></div>
          <div><div className="text-[34px] font-black text-demo-dark">{attentionCount}</div><div className="text-[14px] font-semibold text-slate-500">Requires Attention</div></div>
        </div>
      </div>

      <section className="fb-card overflow-hidden">
        <div className="border-b border-demo-line bg-gradient-to-r from-demo-mist/80 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-demo-blue" />
            <h2 className="text-[18px] font-extrabold text-demo-dark">Product Code Queue</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Product Name</th>
                <th className="px-4 py-3">Issuer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const status = opsStatus(c);
                return (
                  <tr key={c.id} className="border-t border-demo-line/60 hover:bg-demo-pale/70">
                    <td className="px-5 py-4 font-bold text-demo-dark">{c.productName}</td>
                    <td className="px-4 py-4 text-slate-600">{c.issuer}</td>
                    <td className="px-4 py-4"><TypeBadge type={c.productType} /></td>
                    <td className="px-4 py-4">
                      {status === "Requires Attention"
                        ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-700"><AlertTriangle size={13} /> Requires Attention</span>
                        : <StatusPill status={status} />}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="fb-btn-ghost !px-2.5 !py-2" title="Case folder" onClick={() => setFolderId(c.id)}><FolderOpen size={16} /></button>
                        <button className="fb-btn-outline !px-3.5 !py-2 !text-[13px]" disabled={c.templates.length === 0} onClick={() => openReview(c)}>
                          Review <ArrowRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No open product code requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <details className="fb-card group mt-5 overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Archive size={18} /></div>
          <div>
            <h2 className="text-[16px] font-extrabold text-demo-dark">Archive</h2>
            <p className="text-[12px] text-slate-500">Completed Product Codes · {archivedCases.length} records</p>
          </div>
          <ChevronDown size={17} className="ml-auto text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-demo-line">
          <table className="w-full text-[13.5px]">
            <thead><tr className="bg-slate-50 text-left text-[11.5px] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Product Name</th><th className="px-4 py-3">Issuer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Product Code</th><th className="px-4 py-3">Created</th><th className="px-5 py-3 text-right">Action</th>
            </tr></thead>
            <tbody>
              {archivedCases.map((c) => (
                <tr key={c.id} className="border-t border-demo-line/60">
                  <td className="px-5 py-3.5 font-bold text-demo-dark">{c.productName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{c.issuer}</td>
                  <td className="px-4 py-3.5"><TypeBadge type={c.productType} /></td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">{c.productCodeResult?.code ?? "Created"}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.productCodeResult?.createdTime ?? "Completed"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="fb-btn-ghost !px-3 !py-1.5 !text-[12.5px]" onClick={() => { d.openCase(c.id); d.go("internalUpload"); }}>
                      View Result <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {archivedCases.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No archived records.</td></tr>}
            </tbody>
          </table>
        </div>
      </details>

      {folderCase && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setFolderId(null)}>
          <aside className="h-full w-[430px] bg-white p-6 shadow-2xl animate-fade-up" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><div className="text-[12px] font-bold uppercase tracking-wider text-demo-blue">Case Folder</div><h3 className="mt-1 text-[21px] font-extrabold text-demo-dark">{folderCase.productName}</h3></div>
              <button onClick={() => setFolderId(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Case ID", folderCase.id],
                ["Submitted by", folderCase.owner],
                ["Submitted", folderCase.submittedTime],
                ["Template status", templateProgress(folderCase)],
                ["Validation issues", String(issues(folderCase))],
                ["Code status", folderCase.productCode.replaceAll("_", " ")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-demo-line bg-demo-pale p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-400">{label}</div>
                  <div className="mt-1 text-[13px] font-bold capitalize text-demo-dark">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-demo-line pt-5">
              <div className="mb-3 text-[13px] font-bold uppercase text-slate-400">Templates &amp; Source Files</div>
              {folderCase.realFiles?.map((file) => (
                <a key={file.path} href={file.path} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-2 rounded-lg border border-demo-line p-3 text-[13px] font-semibold text-demo-dark hover:bg-slate-50">
                  <Paperclip size={14} className="text-demo-blue" />{file.name}
                </a>
              ))}
            </div>
            {folderCase.productCodeResult && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-emerald-700"><CheckCircle2 size={15} /> Product Code Created</div>
                <div className="mt-2 font-mono text-[20px] font-black text-emerald-800">{folderCase.productCodeResult.code}</div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
