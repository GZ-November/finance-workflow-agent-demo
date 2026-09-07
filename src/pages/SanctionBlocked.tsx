import { ShieldX, Undo2, Download, Send, Lock, FileX2, Ban } from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, StatusPill } from "@/components/bits";

export default function SanctionBlocked() {
  const d = useDemo();
  const c = d.activeCase;

  if (!c) {
    return (
      <div className="fb-card p-10 text-center text-slate-500">
        No blocked case selected.{" "}
        <button className="text-demo-green font-semibold" onClick={() => d.go("dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up max-w-[980px] mx-auto">
      <PageHeader title="Case Terminated" subtitle={`${c.id} · ${c.productName}`} />

      <div className="fb-card overflow-hidden border-2 !border-red-300">
        <div className="bg-red-600 text-white px-7 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
            <ShieldX size={32} />
          </div>
          <div>
            <div className="text-[24px] font-extrabold tracking-tight">Sanction Match Detected</div>
            <div className="text-red-100 text-[14.5px] mt-0.5">
              The AI screening gate stopped this case before any document or template generation.
            </div>
          </div>
          <div className="ml-auto">
            <StatusPill status="Blocked" large />
          </div>
        </div>

        <div className="p-7 grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
            <h3 className="text-[14px] font-bold text-red-700 uppercase tracking-wide mb-4">Screening Result</h3>
            <dl className="flex flex-col gap-3.5 text-[14.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Matched Underlying</dt>
                <dd className="font-bold text-red-700">{c.sanctionHitUnderlying ?? "XYZ SANCTIONED CO"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Match Type</dt>
                <dd className="font-semibold text-demo-dark">{c.sanctionReason ?? "Demo Sanction List Match"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Product</dt>
                <dd className="font-semibold text-demo-dark">{c.productName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">AI Processing Time</dt>
                <dd className="font-semibold text-demo-dark">4.2s · stopped at Screening</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Screened At</dt>
                <dd className="font-semibold text-demo-dark">{c.submittedTime}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-demo-line p-5">
            <h3 className="text-[14px] font-bold text-demo-dark uppercase tracking-wide mb-4">Locked Workstreams</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: <FileX2 size={18} />, label: "Launch Documents", note: "Never generated — hard gate before creation" },
                { icon: <Ban size={18} />, label: "Product Code Templates", note: "Creation / COPIA / Summit locked" },
                { icon: <Lock size={18} />, label: "Override", note: "Not available in this demo — terminate & return only" },
              ].map((x) => (
                <div key={x.label} className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <span className="text-slate-400">{x.icon}</span>
                  <div>
                    <div className="font-bold text-[14.5px] text-slate-700">{x.label}</div>
                    <div className="text-[12.5px] text-slate-500">{x.note}</div>
                  </div>
                  <Lock size={15} className="ml-auto text-slate-400" />
                </div>
              ))}
            </div>
            <p className="text-[13px] text-slate-500 mt-4 leading-snug">
              No launch document or product code template was generated; any in-flight artifacts are locked.
            </p>
          </div>
        </div>

        <div className="px-7 pb-7 flex gap-3 flex-wrap">
          <button className="fb-btn-primary" onClick={() => d.go("dashboard")}>
            <Undo2 size={16} /> Return to Trader Queue
          </button>
          <button className="fb-btn-outline" onClick={() => alert("Demo only — screening summary download is mocked.")}>
            <Download size={16} /> Download Screening Summary
          </button>
          <button className="fb-btn-outline" onClick={() => alert("Demo only — case returned to Sales queue (mocked).")}>
            <Send size={16} /> Send Back to Sales
          </button>
        </div>
      </div>
    </div>
  );
}
