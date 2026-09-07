import { Fragment, useMemo, useState } from "react";
import {
  ArrowRight, Bot, ChevronDown, ChevronRight, ChevronUp, FolderOpen, Inbox, KeyRound, Mail,
  Paperclip, Plus, Rocket, Sparkles, X,
} from "lucide-react";
import { useDemo, overallStatus } from "@/demo/store";
import { PageHeader, TypeBadge } from "@/components/bits";
import type { CaseItem, OverallStatus } from "@/demo/types";

const PRIMARY_NEW_CASE_ID = "CASE-2026-0612-004";
const HIGHLIGHT_CASE_IDS = [
  "CASE-2026-0624-015",
  "CASE-2026-0612-004",
  "CASE-2026-0728-013",
  "CASE-2026-0430-012",
];

type SalesEmail = NonNullable<CaseItem["salesRequestEmail"]>;

const PAYOFF_KEYS = ["strike", "ko type", "ko", "coupon", "upfront", "tenor", "ki type", "ki"];
const BOND_CONTROL_KEYS = ["type", "sub type", "nbmce", "exchange"];

function emailInitials(from: string) {
  const displayName = from.split("<")[0].replaceAll('"', "").trim();
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts.at(-1)?.[0]}`.toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

function groupEmailTerms(email: SalesEmail) {
  const terms = email.table ?? [];
  const isBond = terms.some((item) => item.key.toLowerCase() === "type" && item.value.toUpperCase() === "BOND");

  if (isBond) {
    return [
      {
        title: "Code request",
        items: terms.filter((item) => BOND_CONTROL_KEYS.includes(item.key.toLowerCase())),
      },
      {
        title: "Bond terms",
        items: terms.filter((item) => !BOND_CONTROL_KEYS.includes(item.key.toLowerCase())),
      },
    ].filter((group) => group.items.length > 0);
  }

  return [
    {
      title: "Trade overview",
      items: terms.filter((item) => !PAYOFF_KEYS.some((key) => item.key.toLowerCase().includes(key))),
    },
    {
      title: "Payoff terms",
      items: terms.filter((item) => PAYOFF_KEYS.some((key) => item.key.toLowerCase().includes(key))),
    },
  ].filter((group) => group.items.length > 0);
}

function emailGroupColumns(itemCount: number) {
  if (itemCount <= 3) return 3;
  if (itemCount === 4) return 4;
  if (itemCount <= 6) return 3;
  return 4;
}

function dashboardStatus(c: CaseItem, status: OverallStatus): OverallStatus {
  if (c.id === PRIMARY_NEW_CASE_ID && status === "New") return "New";
  if (status !== "Blocked" && status !== "Completed") return "In Progress";
  return status;
}

function OutlookEmailDetail({ email }: { email: SalesEmail }) {
  const groups = groupEmailTerms(email);
  const senderName = email.from.split("<")[0].replaceAll('"', "").trim();
  const senderAddress = email.from.includes("<") ? `<${email.from.split("<")[1]}` : email.from;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e1e1] bg-white shadow-[0_8px_24px_rgba(0,120,212,0.08)] animate-fade-up">
      <div className="flex h-11 items-center border-b border-[#e1e1e1] bg-[#f0f6fc] px-4">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#0078d4] text-white shadow-sm">
          <Mail size={16} strokeWidth={2.25} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-sm border border-white bg-[#0078d4]" />
        </div>
        <span className="ml-2.5 text-[12.5px] font-extrabold text-[#242424]">Sales request</span>
        <span className="ml-2 rounded-full bg-[#0078d4]/10 px-2 py-0.5 text-[10px] font-bold text-[#005a9e]">OUTLOOK</span>
        <span className="ml-auto text-[11px] font-medium text-slate-500">{email.date}</span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[12px] font-black text-[#0078d4]">
            {emailInitials(email.from)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-extrabold leading-tight text-demo-dark">{email.subject}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-slate-500">
              <span className="font-bold text-slate-700">{senderName}</span>
              <span>{senderAddress}</span>
              <span className="text-slate-300">•</span>
              <span>To: {email.to}</span>
            </div>
          </div>
        </div>

        <p className="ml-[52px] mt-4 whitespace-pre-line text-[12.5px] leading-5 text-slate-600">{email.body}</p>

        {groups.length > 0 && (
          <div className="ml-[52px] mt-4 grid items-start gap-3 xl:grid-cols-2">
            {groups.map((group) => {
              const columns = emailGroupColumns(group.items.length);
              const columnClass = columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";

              return (
                <section key={group.title} className="w-full self-start overflow-hidden rounded-lg border border-[#e1e1e1] bg-white">
                  <div className="border-b border-[#e1e1e1] bg-[#f0f6fc] px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[#005a9e]">
                    {group.title}
                  </div>
                  <div className={`grid grid-cols-1 divide-y divide-[#e4edf4] sm:divide-x ${columnClass}`}>
                    {group.items.map((item, index) => {
                      const remainder = group.items.length % columns;
                      const isLast = index === group.items.length - 1;
                      const spanClass = !isLast || remainder === 0
                        ? ""
                        : remainder === 1
                          ? columns === 4 ? "sm:col-span-4" : "sm:col-span-3"
                          : remainder === 2
                            ? columns === 4 ? "sm:col-span-3" : "sm:col-span-2"
                            : columns === 4 ? "sm:col-span-2" : "";

                      return (
                        <div key={item.key} className={`min-w-0 bg-white px-3 py-2.5 ${spanClass}`}>
                          <div className="truncate text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{item.key}</div>
                          <div className="mt-0.5 break-words text-[12px] font-extrabold leading-4 text-demo-dark">{item.value || "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default function TraderDashboard() {
  const d = useDemo();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [emailDetailId, setEmailDetailId] = useState<string | null>(null);

  const openCases = useMemo(
    () => d.cases
      .filter((c) => !c.productName.includes("Sanction Test"))
      .map((c) => ({ c, status: dashboardStatus(c, overallStatus(c)) }))
      .filter(({ status }) => status !== "Completed"),
    [d.cases],
  );
  const rows = useMemo(
    () => [...openCases].sort((a, b) => {
      const aIdx = HIGHLIGHT_CASE_IDS.indexOf(a.c.id);
      const bIdx = HIGHLIGHT_CASE_IDS.indexOf(b.c.id);
      return (aIdx === -1 ? HIGHLIGHT_CASE_IDS.length : aIdx) - (bIdx === -1 ? HIGHLIGHT_CASE_IDS.length : bIdx);
    }),
    [openCases],
  );
  const eliWipCount = openCases.filter(({ c, status }) => c.productType === "ELI" && status !== "New" && status !== "Blocked").length;
  const bondWipCount = openCases.filter(({ c, status }) => c.productType === "Bond" && status !== "Blocked").length;
  const emailCase = d.cases.find((c) => c.emailDetected && c.classification === "pending");
  const folderCase = d.cases.find((c) => c.id === folderId);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Welcome back, Demo Trader"
        subtitle="Here are the ELIs that require launching today."
        right={
          <button className="fb-btn-primary !px-6 !py-3 !text-[16px]" onClick={d.beginNewLaunch}>
            <Rocket size={18} /> Launch New ELI
          </button>
        }
      />

      <div className="grid grid-cols-[1.65fr_1fr_1fr] gap-4 mb-5">
        <div className="fb-card flex items-center gap-4 p-6">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Inbox size={25} /></div>
          <div>
            <div className="text-[34px] font-black leading-none text-demo-dark">1</div>
            <div className="mt-1 text-[14px] text-slate-500">new ELI requested to be launched</div>
          </div>
        </div>
        <div className="fb-card p-6 flex items-center gap-4">
          <div className="w-13 h-13 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-demo-light text-demo-blue"><Plus size={25} /></div>
          <div><div className="text-[34px] font-black text-demo-dark">{eliWipCount}</div><div className="text-[14px] font-semibold text-slate-500">ELI launch documents WIP</div></div>
        </div>
        <div className="fb-card p-6 flex items-center gap-4">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound size={25} /></div>
          <div><div className="text-[34px] font-black text-demo-dark">{bondWipCount}</div><div className="text-[14px] font-semibold text-slate-500">Bond product code WIP</div></div>
        </div>
      </div>

      {emailCase?.salesRequestEmail && (
        <button
          onClick={() => d.openCase(emailCase.id)}
          className="mb-5 w-full overflow-hidden rounded-xl border border-[#0078d4]/25 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 text-white">
            <Mail size={16} />
            <span className="text-[13px] font-bold">Outlook · New Sales request detected</span>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#0078d4]"><Bot size={22} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-demo-dark">{emailCase.salesRequestEmail.subject}</span>
              </div>
              <div className="mt-1 text-[13px] text-slate-500">
                {emailCase.salesRequestEmail.from} · {emailCase.salesRequestEmail.date}
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#0078d4]">Upload term sheet <ArrowRight size={17} /></div>
          </div>
        </button>
      )}

      <div className="fb-card overflow-hidden">
        <div className="border-b border-demo-line bg-gradient-to-r from-demo-mist/80 to-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><Sparkles size={18} className="text-demo-blue" /><h2 className="text-[18px] font-extrabold text-demo-dark">Launch Queue</h2></div>
            </div>
          </div>
        </div>
        <table className="w-full text-[14px]">
          <thead><tr className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Product Name</th><th className="px-4 py-3">Issuer</th><th className="px-4 py-3">Type</th><th className="px-5 py-3 text-right">Action</th>
          </tr></thead>
          <tbody>
            {rows.map(({ c }) => {
              const emailOpen = emailDetailId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr className={`border-t border-demo-line/60 hover:bg-demo-pale/70 ${emailOpen ? "bg-[#e8f0fe]/60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="font-bold text-demo-dark">{c.productName}</div>
                      {c.productType !== "Bond" && c.salesRequestEmail && (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-bold text-[#0078d4] hover:bg-[#cce4f7]"
                          onClick={() => setEmailDetailId(emailOpen ? null : c.id)}
                        >
                          <Mail size={12} /> Sales email details
                          {emailOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{c.issuer}</td>
                    <td className="px-4 py-4"><TypeBadge type={c.productType} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="fb-btn-ghost !px-2.5 !py-2" title="Case folder" onClick={() => setFolderId(c.id)}><FolderOpen size={16} /></button>
                        {HIGHLIGHT_CASE_IDS.includes(c.id) && (
                          <button className="fb-btn-outline !px-3.5 !py-2 !text-[13px]" onClick={() => d.openCase(c.id)}>
                            Start <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {emailOpen && c.productType !== "Bond" && c.salesRequestEmail && (
                    <tr className="border-t border-[#0078d4]/25 bg-[#e8f0fe]/50">
                      <td colSpan={4} className="px-5 pb-5 pt-4">
                        <OutlookEmailDetail email={c.salesRequestEmail} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {folderCase && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setFolderId(null)}>
          <aside className="h-full w-[430px] bg-white p-6 shadow-2xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between"><div><div className="text-[12px] font-bold uppercase tracking-wider text-demo-blue">Case Folder</div><h3 className="mt-1 text-[21px] font-extrabold text-demo-dark">{folderCase.productName}</h3></div><button onClick={() => setFolderId(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[["Case ID", folderCase.id], ["Submitted", folderCase.submittedTime], ["Owner", folderCase.owner], ["Underlyings", folderCase.underlyings.join(", ") || "Not applicable"], ["Launch status", folderCase.launchDocs.replaceAll("_", " ")], ["Code status", folderCase.productCode.replaceAll("_", " ")]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-demo-line bg-demo-pale p-3"><div className="text-[11px] font-bold uppercase text-slate-400">{k}</div><div className="mt-1 text-[13px] font-bold text-demo-dark">{v}</div></div>
              ))}
            </div>
            <div className="mt-6 border-t border-demo-line pt-5"><div className="mb-3 text-[13px] font-bold uppercase text-slate-400">Files</div>{folderCase.realFiles?.map((file) => <div key={file.path} className="mb-2 flex items-center gap-2 rounded-lg border border-demo-line p-3 text-[13px] font-semibold text-demo-dark"><Paperclip size={14} className="text-demo-blue" />{file.name}</div>)}</div>
          </aside>
        </div>
      )}
    </div>
  );
}
