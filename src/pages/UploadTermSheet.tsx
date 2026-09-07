import { useRef, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader } from "@/components/bits";
import type { DemoScenario } from "@/demo/types";

function inferScenario(fileName: string, current: DemoScenario | null): DemoScenario {
  const name = fileName.normalize("NFKC").toLowerCase();

  // Known demo files always take priority over the case that opened this page.
  if (name.includes("sanction") || name.includes("blocked")) return "sanction_hit";
  if (name.includes("secondary") || name.includes("market data source") || name.includes("secondary bond")) return "bond_secondary";
  if (
    name.includes("primary") ||
    name.includes("primary bank") ||
    name.includes("fixed rate note")
  ) return "bond_primary";
  if (
    name.includes("client a") ||
    name.includes("series-a") ||
    name.includes("aaa+bbb")
  ) return "eli_client_a";
  if (
    name.includes("client b") ||
    name.includes("series-b") ||
    name.includes("daily call")
  ) return "eli_client_b";

  // Generic file-type fallback for additional demo files.
  if (name.endsWith(".msg")) return "bond_secondary";
  if (name.endsWith(".docx")) return "bond_primary";
  if (current) return current;
  return "eli_client_b";
}

export default function UploadTermSheet() {
  const d = useDemo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const acceptFile = (name?: string) => {
    if (!name || uploading) return;
    setFileName(name);
    setUploading(true);
    const scenario = inferScenario(name, d.scenario);
    window.setTimeout(() => d.startScenario(scenario, name), 850);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={d.productCodeOnly ? "Launch Product Code" : "Upload product source document"}
        right={<button className="fb-btn-ghost" onClick={() => d.go(d.productCodeOnly ? "opsDashboard" : "dashboard")}><ArrowLeft size={16} /> Back to Queue</button>}
      />

      <section className="mb-5 rounded-xl border border-demo-line bg-white p-5">
        <p className="mb-3 text-sm text-slate-600">Choose a fictional scenario. No file is needed. If you choose a file below, only its filename selects a preset; its contents are not read or uploaded.</p>
        <div className="flex flex-wrap gap-2">
          {([
            ["eli_client_a", "Complex ELI"],
            ["eli_client_b", "Standard ELI"],
            ["bond_primary", "Primary Bond"],
            ["bond_secondary", "Secondary Bond"],
            ["sanction_hit", "Sanction Block"],
          ] as [DemoScenario, string][]).map(([scenario, label]) => (
            <button key={scenario} className="fb-btn-primary" disabled={uploading} onClick={() => d.startScenario(scenario, `${label} — fictional preset`)}>{label}</button>
          ))}
        </div>
      </section>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0]?.name); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex min-h-[520px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white px-10 text-center shadow-card transition-all ${
          dragOver ? "border-demo-blue bg-demo-light/70 scale-[1.005]" : "border-demo-blue/40 hover:border-demo-blue"
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,.xlsx,.msg,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0]?.name)} />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-demo-blue via-demo-accent to-demo-green" />
        {!uploading ? (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-demo-blue/10 to-demo-green/10 text-demo-blue">
              <UploadCloud size={48} />
            </div>
            <h2 className="mt-7 text-[28px] font-black text-demo-dark">Drop the Product Source Document Here</h2>
            <button className="fb-btn-primary mt-7 !px-8 !py-3.5 !text-[16px]"><FileText size={18} /> Choose file</button>
            <div className="mt-6 flex gap-2">{["PDF", "DOCX", "XLSX", "MSG", "JPG", "PNG", "WEBP"].map((item) => <span key={item} className="rounded-md border border-demo-line bg-demo-mist px-3 py-1 text-[12px] font-bold text-demo-dark">{item}</span>)}</div>
          </>
        ) : (
          <div className="animate-fade-up">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={50} /></div>
            <h2 className="mt-6 text-[26px] font-black text-demo-dark">Source Document Received</h2>
            <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-xl border border-demo-line bg-demo-pale px-5 py-3">
              <FileText size={20} className="text-demo-blue" /><span className="font-bold text-demo-dark">{fileName}</span>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[14px] font-semibold text-demo-blue"><Bot size={17} className="animate-pulse" /> Starting AI processing…</div>
          </div>
        )}
      </div>
    </div>
  );
}
