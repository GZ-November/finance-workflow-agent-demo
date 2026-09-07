import { useMemo, useState } from "react";
import {
  AppWindow, Archive, Bell, Bold, CalendarDays, ChevronDown, Clock3, Contact,
  FileText, Inbox, Italic, Link2, Mail, MoreHorizontal, Paperclip,
  Redo2, Save, Search, Send, Settings, Smile, Sparkles, Trash2, Underline,
  Undo2, Users, X,
} from "lucide-react";
import { useDemo, nowStamp } from "@/demo/store";
import type { EmailDraft } from "@/demo/types";
import { buildLaunchEmailDraft, isRichEmailBody } from "@/demo/launchEmail";

function createFallbackDraft(c: NonNullable<ReturnType<typeof useDemo>["activeCase"]>): EmailDraft {
  return buildLaunchEmailDraft(c, nowStamp());
}

export default function OutlookDraft() {
  const d = useDemo();
  const c = d.activeCase;
  const initial = useMemo(() => c ? c.emailDraft ?? createFallbackDraft(c) : null, [c]);
  const [draft, setDraft] = useState<EmailDraft | null>(initial);
  const [showBcc, setShowBcc] = useState(false);
  const [info, setInfo] = useState("");
  const [activeTab, setActiveTab] = useState("Message");

  if (!c || !draft) return <div className="fb-card p-10 text-center text-slate-500">No email draft available.</div>;
  const attachments = c.documents.filter((doc) => draft.attachmentIds.includes(doc.id));
  const set = (patch: Partial<EmailDraft>) => setDraft((current) => current ? { ...current, ...patch, updatedAt: nowStamp() } : current);

  const validateAndSend = () => {
    if (!draft.to.trim()) return setInfo("Add at least one recipient before sending.");
    if (!draft.subject.trim()) return setInfo("Add a subject before sending.");
    if (!draft.body.trim()) return setInfo("The message body cannot be empty.");
    if (attachments.length === 0) return setInfo("Attach the approved launch documents before sending.");
    setInfo("");
    d.updateEmailDraft(c.id, draft);
    d.sendLaunchEmail(c.id, draft);
  };

  const folders = [["Inbox", Inbox, "14"], ["Drafts", FileText, "1"], ["Sent Items", Send, ""], ["Archive", Archive, ""], ["Deleted Items", Trash2, ""]];

  return (
    <div className="-mt-3 animate-fade-up overflow-hidden rounded-xl border border-[#d6d6d6] bg-[#f5f5f5] shadow-lift" style={{ minHeight: 760 }}>
      <div className="flex h-12 items-center bg-[#1f1f1f] px-3 text-white">
        <button className="rounded p-2 hover:bg-white/10"><AppWindow size={20} /></button>
        <div className="ml-2 flex items-center gap-2 font-semibold"><Mail size={20} /><span>Outlook</span></div>
        <div className="mx-auto flex h-8 w-[420px] items-center gap-2 rounded bg-white/95 px-3 text-[#424242] shadow-sm"><Search size={15} /><span className="text-[13px] text-slate-500">Search</span></div>
        <div className="flex items-center gap-1"><span className="mr-2 rounded bg-white/10 px-2 py-1 text-[10px] font-semibold">DEMO MAILBOX</span><button className="p-2"><Bell size={18} /></button><button className="p-2"><Settings size={18} /></button><div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0078d4] text-[12px] font-bold text-white">KL</div></div>
      </div>

      <div className="flex h-[calc(100%-48px)]">
        <div className="flex w-12 flex-col items-center gap-2 border-r border-[#ddd] bg-[#f3f3f3] py-3 text-[#424242]">
          <button className="rounded bg-[#cce4f7] p-2 text-[#005a9e]"><Mail size={19} /></button>
          <button className="p-2"><CalendarDays size={19} /></button>
          <button className="p-2"><Users size={19} /></button>
          <button className="p-2"><Contact size={19} /></button>
        </div>

        <aside className="w-[205px] shrink-0 border-r border-[#ddd] bg-[#fafafa] px-3 py-3">
          <button className="mb-4 flex h-38 h-[38px] w-full items-center justify-center gap-2 rounded bg-[#0078d4] text-[13px] font-semibold text-white hover:bg-[#106ebe]"><Mail size={15} /> New mail <ChevronDown size={13} /></button>
          <div className="mb-3 flex items-center gap-2 px-2 text-[13px] font-semibold text-[#424242]"><ChevronDown size={13} /><span>Favorites</span></div>
          <div className="flex flex-col gap-0.5">
            {folders.map(([label, Icon, count]) => (
              <button key={label as string} className={`flex items-center gap-2 rounded px-3 py-2 text-left text-[12.5px] ${label === "Drafts" ? "bg-[#cce4f7] font-semibold text-[#005a9e]" : "text-[#424242] hover:bg-[#eee]"}`}>
                <Icon size={15} /><span>{label as string}</span>{count && <span className="ml-auto text-[11px]">{count as string}</span>}
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-[#ddd] pt-4 text-[11px] text-slate-400">Folders</div>
        </aside>

        <main className="min-w-0 flex-1 bg-white">
          <div className="flex h-10 items-end gap-1 border-b border-[#ddd] px-4">
            {["Message", "Insert", "Options", "Format Text"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`h-full px-3 text-[12.5px] font-semibold ${activeTab === tab ? "border-b-2 border-[#0078d4] text-[#0078d4]" : "text-[#424242]"}`}>{tab}</button>)}
            <div className="ml-auto flex h-full items-center gap-1 text-[11px] text-slate-400"><Sparkles size={13} className="text-[#0078d4]" /> Draft composed by AI</div>
          </div>

          <div className="flex h-[58px] items-center gap-1 border-b border-[#ddd] px-4">
            <button onClick={validateAndSend} className="mr-2 flex h-34 h-[34px] items-center gap-2 rounded bg-[#0078d4] px-4 text-[12.5px] font-semibold text-white hover:bg-[#106ebe]"><Send size={15} /> Send <ChevronDown size={12} /></button>
            <button className="rounded p-2 hover:bg-[#eee]"><Undo2 size={17} /></button><button className="rounded p-2 hover:bg-[#eee]"><Redo2 size={17} /></button>
            <div className="mx-2 h-7 w-px bg-[#ddd]" />
            <button className="flex items-center gap-1.5 rounded px-2 py-2 text-[12px] hover:bg-[#eee]"><Paperclip size={16} /> Attach file</button>
            <button className="flex items-center gap-1.5 rounded px-2 py-2 text-[12px] hover:bg-[#eee]"><PencilSignature /> Signature</button>
            <button className="rounded p-2 hover:bg-[#eee]"><MoreHorizontal size={18} /></button>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400"><Clock3 size={12} /> Draft saved {draft.updatedAt}</span>
          </div>

          {info && <div className="flex items-center gap-3 border-b border-[#f3c7c7] bg-[#fde7e9] px-5 py-3 text-[12.5px] text-[#a4262c]"><span className="font-bold">We couldn’t send this message.</span><span>{info}</span><button className="ml-auto" onClick={() => setInfo("")}><X size={15} /></button></div>}

          <div className="px-6 pt-4">
            <div className="grid grid-cols-[58px_1fr_auto] items-center border-b border-[#e5e5e5] py-2 text-[13px]">
              <span className="text-slate-500">To</span><input value={draft.to} onChange={(e) => set({ to: e.target.value })} className="outline-none" />
              <div className="flex gap-2 text-[12px] font-semibold text-[#0078d4]"><button>CC</button><button onClick={() => setShowBcc((value) => !value)}>BCC</button></div>
            </div>
            <div className="grid grid-cols-[58px_1fr] items-center border-b border-[#e5e5e5] py-2 text-[13px]"><span className="text-slate-500">CC</span><input value={draft.cc} onChange={(e) => set({ cc: e.target.value })} className="outline-none" /></div>
            {showBcc && <div className="grid grid-cols-[58px_1fr] items-center border-b border-[#e5e5e5] py-2 text-[13px]"><span className="text-slate-500">BCC</span><input value={draft.bcc} onChange={(e) => set({ bcc: e.target.value })} className="outline-none" /></div>}
            <input value={draft.subject} onChange={(e) => set({ subject: e.target.value })} className="w-full border-b border-[#e5e5e5] py-3 text-[15px] font-semibold text-[#242424] outline-none" placeholder="Add a subject" />

            <div className="flex min-h-[70px] flex-wrap items-start gap-2 border-b border-[#e5e5e5] py-3">
              {attachments.map((doc, index) => (
                <div key={doc.id} className="flex min-w-[220px] items-center gap-3 rounded border border-[#d1d1d1] bg-[#fafafa] px-3 py-2 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-[#e8f0fe] font-bold text-[#0078d4]">{doc.kind.toUpperCase().slice(0, 3)}</div>
                  <div className="min-w-0 flex-1"><div className="truncate text-[11.5px] font-semibold text-[#242424]">{doc.name}</div><div className="text-[10.5px] text-slate-400">{(1.2 + index * 0.4).toFixed(1)} MB</div></div>
                  <button title="Remove attachment" onClick={() => set({ attachmentIds: draft.attachmentIds.filter((id) => id !== doc.id) })}><X size={14} className="text-slate-400" /></button>
                </div>
              ))}
            </div>

            {isRichEmailBody(draft.body) ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(event) => set({ body: event.currentTarget.innerHTML })}
                className="min-h-[520px] w-full overflow-auto py-5 text-[13.5px] leading-6 text-[#242424] outline-none"
                dangerouslySetInnerHTML={{ __html: draft.body }}
              />
            ) : (
              <textarea value={draft.body} onChange={(e) => set({ body: e.target.value })} className="min-h-[340px] w-full resize-none py-5 text-[13.5px] leading-6 text-[#242424] outline-none" />
            )}
          </div>

          <div className="sticky bottom-0 flex h-11 items-center gap-1 border-t border-[#ddd] bg-white px-5">
            <button className="rounded p-2 hover:bg-[#eee]"><Bold size={15} /></button><button className="rounded p-2 hover:bg-[#eee]"><Italic size={15} /></button><button className="rounded p-2 hover:bg-[#eee]"><Underline size={15} /></button>
            <div className="mx-1 h-5 w-px bg-[#ddd]" /><button className="rounded p-2 hover:bg-[#eee]"><Link2 size={15} /></button><button className="rounded p-2 hover:bg-[#eee]"><Smile size={15} /></button>
            <button onClick={() => { d.updateEmailDraft(c.id, draft); setInfo(""); }} className="ml-auto flex items-center gap-1.5 rounded px-3 py-1.5 text-[11.5px] font-semibold text-[#0078d4] hover:bg-[#e8f0fe]"><Save size={14} /> Save draft</button>
            <button className="rounded p-2 text-slate-500 hover:bg-[#eee]"><Trash2 size={16} /></button>
          </div>
        </main>
      </div>
    </div>
  );
}

function PencilSignature() {
  return <span className="flex h-4 w-4 items-center justify-center font-serif text-[16px] italic">S</span>;
}
