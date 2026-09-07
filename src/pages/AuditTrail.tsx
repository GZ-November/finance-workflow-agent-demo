import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Download, FileClock, Info, ListChecks,
  Search, ShieldCheck, XCircle,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader } from "@/components/bits";
import type { AuditEvent } from "@/demo/types";

const toneIcon: Record<AuditEvent["tone"], React.ReactNode> = {
  info: <Info size={16} className="text-demo-blue" />,
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  danger: <XCircle size={16} className="text-red-500" />,
};

const categoryLabel: Record<AuditEvent["category"], string> = {
  case: "Case",
  document: "Documents",
  field: "Data",
  email: "Email",
  template: "Templates",
  system: "Systems",
  security: "Controls",
};

export default function AuditTrail() {
  const d = useDemo();
  const [caseFilter, setCaseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AuditEvent["category"]>("all");
  const [query, setQuery] = useState("");

  const casesWithEvents = useMemo(() => {
    const ids = new Set(d.audit.map((event) => event.caseId).filter(Boolean));
    return d.cases.filter((item) => ids.has(item.id));
  }, [d.audit, d.cases]);

  const visibleEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return d.audit.filter((event) => {
      if (caseFilter !== "all" && event.caseId !== caseFilter) return false;
      if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
      if (!search) return true;
      return [event.action, event.detail, event.actor, event.caseId, event.productName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [caseFilter, categoryFilter, d.audit, query]);

  const exportAudit = () => {
    if (visibleEvents.length === 0) return;
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), events: visibleEvents }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `demo-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1180px] animate-fade-up">
      <PageHeader
        title="Audit Trail"
        right={
          <button className="fb-btn-outline" disabled={visibleEvents.length === 0} onClick={exportAudit}>
            <Download size={16} /> Export JSON
          </button>
        }
      />

      <section className="fb-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-demo-line bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <ListChecks size={19} className="text-demo-blue" />
            <h2 className="text-[16px] font-extrabold text-demo-dark">{visibleEvents.length} recorded event{visibleEvents.length === 1 ? "" : "s"}</h2>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity"
                className="h-9 w-[190px] rounded-lg border border-demo-line bg-white pl-9 pr-3 text-[12.5px] text-demo-dark outline-none focus:border-demo-blue"
              />
            </label>
            <select
              value={caseFilter}
              onChange={(event) => setCaseFilter(event.target.value)}
              className="h-9 max-w-[260px] rounded-lg border border-demo-line bg-white px-3 text-[12.5px] font-semibold text-demo-dark outline-none focus:border-demo-blue"
            >
              <option value="all">All cases</option>
              {casesWithEvents.map((item) => <option key={item.id} value={item.id}>{item.productName}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "all" | AuditEvent["category"])}
              className="h-9 rounded-lg border border-demo-line bg-white px-3 text-[12.5px] font-semibold text-demo-dark outline-none focus:border-demo-blue"
            >
              <option value="all">All activity</option>
              {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-demo-light text-demo-blue"><FileClock size={26} /></div>
            <h3 className="mt-4 text-[17px] font-extrabold text-demo-dark">No Recorded Activity</h3>
            <p className="mt-1 max-w-[440px] text-[13px] leading-5 text-slate-500">
              Start a Case, upload a source document, edit a field or approve an output. Each material action will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="px-6 py-6">
            <div className="relative ml-2 flex flex-col gap-6 border-l-2 border-demo-line pl-7">
              {visibleEvents.map((event) => {
                const caseItem = event.caseId ? d.cases.find((item) => item.id === event.caseId) : undefined;
                const metadata = Object.entries(event.metadata ?? {});
                return (
                  <article key={event.id} className="relative rounded-xl border border-demo-line bg-white p-4 shadow-[0_5px_16px_rgba(15,63,94,0.05)]">
                    <span className="absolute -left-[38px] top-4 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-demo-blue bg-white" />
                    <div className="flex flex-wrap items-center gap-2.5">
                      {toneIcon[event.tone]}
                      <span className="text-[15px] font-extrabold text-demo-dark">{event.action}</span>
                      <span className="rounded-md border border-demo-line bg-demo-mist px-2 py-0.5 text-[11px] font-bold text-demo-dark">{event.actor}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">{categoryLabel[event.category]}</span>
                      <time dateTime={event.timestamp} className="ml-auto font-mono text-[11.5px] text-slate-400">{event.time}</time>
                    </div>
                    {(event.caseId || event.productName) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-demo-blue">
                        <ShieldCheck size={13} />
                        <span>{event.productName ?? caseItem?.productName ?? "Case"}</span>
                        {event.caseId && <span className="font-mono text-slate-400">{event.caseId}</span>}
                      </div>
                    )}
                    <p className="mt-2 text-[13.5px] leading-5 text-slate-600">{event.detail}</p>
                    {metadata.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-demo-line/70 pt-3">
                        {metadata.map(([key, value]) => (
                          <span key={key} className="rounded-md bg-slate-50 px-2 py-1 text-[10.5px] text-slate-500">
                            <b className="mr-1 font-semibold text-slate-600">{key}:</b>{String(value || "blank")}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
