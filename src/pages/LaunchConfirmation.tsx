import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, MailCheck, PackageCheck, Users } from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader } from "@/components/bits";

export default function LaunchConfirmation() {
  const d = useDemo();
  const c = d.activeCase;
  if (!c || !c.emailDraft) return <div className="fb-card p-10 text-center text-slate-500">No sent launch email selected.</div>;
  const sentDocs = c.documents.filter((doc) => c.emailDraft?.attachmentIds.includes(doc.id));

  return (
    <div className="mx-auto max-w-[1040px] animate-fade-up">
      <PageHeader title="ELI launched" />
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lift">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-7 py-7 text-white">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><MailCheck size={34} /></div>
            <div><div className="text-[12px] font-bold uppercase tracking-[0.13em] text-white/75">Launch documents complete</div><h1 className="mt-1 text-[28px] font-black">Launch Email Sent</h1><p className="mt-1 text-[13.5px] text-white/80">The approved customer pack has been sent from the Trader mailbox.</p></div>
            <CheckCircle2 size={34} className="ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 p-7">
          <div>
            <h2 className="text-[16px] font-extrabold text-demo-dark">Delivery Details</h2>
            <div className="mt-4 divide-y divide-demo-line rounded-xl border border-demo-line">
              {[["To", c.emailDraft.to], ["Subject", c.emailDraft.subject], ["Sent", c.launchEmailSentAt ?? c.emailDraft.updatedAt]].map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] px-4 py-3 text-[13px]"><span className="font-semibold text-slate-400">{label}</span><span className="font-bold text-demo-dark">{value}</span></div>)}
            </div>
            <div className="mt-5"><div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-400"><FileText size={14} /> Attachments sent</div><div className="flex flex-wrap gap-2">{sentDocs.map((doc) => <span key={doc.id} className="rounded-lg border border-demo-line bg-demo-pale px-3 py-2 text-[12px] font-semibold text-demo-dark">{doc.name}</span>)}</div></div>
          </div>
          <div className="rounded-xl border border-demo-line bg-slate-50 p-5">
            <h2 className="text-[16px] font-extrabold text-demo-dark">Case Progress</h2>
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={18} /></div><div><div className="text-[13px] font-bold text-demo-dark">Launch Documents</div><div className="text-[11.5px] text-emerald-700">Completed</div></div></div>
              <div className="ml-4 h-5 border-l-2 border-dashed border-slate-300" />
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Clock3 size={18} /></div><div><div className="text-[13px] font-bold text-demo-dark">Product Code</div><div className="text-[11.5px] text-amber-700">{c.productCode === "code_created" ? `Created · ${c.productCodeResult?.code}` : "Operations review pending"}</div></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Users size={24} /></div>
          <div className="flex-1"><div className="text-[11px] font-black uppercase tracking-[0.13em] text-emerald-700">Illustration — Continue Demo as Operations</div><h3 className="mt-1 text-[17px] font-extrabold text-demo-dark">Show the Product Code Control Workflow</h3><p className="mt-1 text-[12.5px] text-slate-500">This role switch is for demonstration only. In production, Operations receives the controlled case in its own queue.</p></div>
          <button className="rounded-xl bg-emerald-600 px-6 py-3 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-emerald-700" onClick={() => { d.setRole("operations"); d.go("opsDashboard"); }}><PackageCheck size={17} /> Switch to Operations <ArrowRight size={16} /></button>
        </div>
      </div>
      <button className="fb-btn-ghost mt-4" onClick={() => d.go("dashboard")}><ArrowLeft size={16} /> Return to Launch Queue</button>
    </div>
  );
}
