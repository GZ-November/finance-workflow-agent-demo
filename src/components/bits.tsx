import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Loader2, FileText, FileSpreadsheet, FileArchive, File } from "lucide-react";
import type { OverallStatus, ProductType } from "@/demo/types";

/* ---------- Demo brand ---------- */
export function DemoMark({ size = 38, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center rounded-xl bg-demo-blue text-white font-black" style={{ height: size + 3, width: size + 3 }} aria-label="Portfolio demo">FW</span>
      <div
        className="border-l pl-3 leading-tight"
        style={{ borderColor: light ? "rgba(255,255,255,0.35)" : "#E5E5E5" }}
      >
        <div className="font-extrabold tracking-tight" style={{ color: light ? "#fff" : "#1A1A1A", fontSize: size * 0.36 }}>
          AI Product Launch Workbench
        </div>
        <div className="mt-0.5 font-semibold" style={{ color: light ? "#FFD9A8" : "#6B6B6B", fontSize: size * 0.25 }}>
          Portfolio Demo · ELI &amp; Bond Code Engine
        </div>
      </div>
    </div>
  );
}

/* ---------- Status pill ---------- */
const statusStyle: Record<OverallStatus, string> = {
  New: "bg-demo-light text-demo-dark border-demo-blue/30",
  Processing: "bg-demo-light text-demo-blue border-demo-line",
  Blocked: "bg-red-50 text-red-700 border-red-200",
  "Trader Review": "bg-amber-50 text-amber-700 border-amber-200",
  "Operations Review": "bg-demo-goldlight text-demo-gold border-demo-gold/30",
  "Awaiting Customer Confirmation": "bg-demo-goldlight text-demo-gold border-demo-gold/30",
  "In Progress": "bg-demo-light text-demo-blue border-demo-line",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusPill({ status, large, label }: { status: OverallStatus; large?: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${
        statusStyle[status]
      } ${large ? "px-4 py-1.5 text-[15px]" : "px-2.5 py-0.5 text-[12.5px]"}`}
    >
      {status === "Completed" && <CheckCircle2 size={large ? 16 : 13} />}
      {status === "Blocked" && <XCircle size={large ? 16 : 13} />}
      {status === "Processing" && <Loader2 size={large ? 16 : 13} className="animate-spin" />}
      {label ?? status}
    </span>
  );
}

export function TypeBadge({ type }: { type: ProductType | "Unknown" }) {
  const map: Record<string, string> = {
    ELI: "bg-demo-blue/10 text-demo-blue border-demo-blue/25",
    Bond: "bg-demo-goldlight text-demo-gold border-demo-gold/30",
    Unsupported: "bg-slate-100 text-slate-600 border-slate-200",
    Unknown: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[12.5px] font-bold ${map[type]}`}>
      {type === "Unknown" ? "—" : type}
    </span>
  );
}

export function ComplianceBadge({ status }: { status: "pending" | "clear" | "blocked" }) {
  if (status === "clear")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 text-[12.5px] font-bold">
        <CheckCircle2 size={14} /> Sanction Clear
      </span>
    );
  if (status === "blocked")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 text-[12.5px] font-bold">
        <XCircle size={14} /> Sanction Hit
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 text-[12.5px] font-bold">
      <Clock size={14} /> Screening Pending
    </span>
  );
}

/* ---------- KPI card ---------- */
export function KpiCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "emerald" | "red" | "gold";
}) {
  const tones: Record<string, string> = {
    blue: "from-demo-blue/12 to-demo-blue/4 text-demo-blue",
    green: "from-demo-green/12 to-demo-green/4 text-demo-green",
    emerald: "from-emerald-500/12 to-emerald-500/4 text-emerald-600",
    red: "from-red-500/12 to-red-500/4 text-red-600",
    gold: "from-demo-gold/15 to-demo-gold/4 text-demo-gold",
  };
  return (
    <div className="fb-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center ${tones[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-[28px] leading-none font-extrabold text-demo-dark">{value}</div>
        <div className="text-[13.5px] font-semibold text-slate-500 mt-1.5">{label}</div>
      </div>
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <div>
        <h1 className="text-[26px] font-extrabold text-demo-dark tracking-tight">{title}</h1>
        {subtitle && <p className="text-[15px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3 shrink-0">{right}</div>}
    </div>
  );
}

/* ---------- AI stepper ---------- */
export type StepState = "idle" | "loading" | "success" | "warning" | "blocked";

export function AiStepper({ steps, states }: { steps: string[]; states: StepState[] }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((s, i) => {
        const st = states[i] ?? "idle";
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2 min-w-[128px]">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                  st === "success"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : st === "loading"
                    ? "bg-white border-demo-blue text-demo-blue animate-pulse-ring"
                    : st === "blocked"
                    ? "bg-red-600 border-red-600 text-white"
                    : st === "warning"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {st === "success" ? (
                  <CheckCircle2 size={22} />
                ) : st === "loading" ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : st === "blocked" ? (
                  <XCircle size={22} />
                ) : st === "warning" ? (
                  <AlertTriangle size={20} />
                ) : (
                  <span className="text-[15px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[13px] font-semibold text-center leading-tight ${
                  st === "idle" ? "text-slate-400" : st === "blocked" ? "text-red-700" : "text-demo-dark"
                }`}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-[3px] rounded-full mx-2 mb-7 transition-colors ${
                  states[i + 1] && states[i + 1] !== "idle" ? "bg-demo-green" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- File icon ---------- */
export function FileIcon({ kind, size = 34 }: { kind: "pdf" | "docx" | "xlsx" | "zip"; size?: number }) {
  const map = {
    pdf: { cls: "bg-red-50 text-red-600 border-red-200", icon: <FileText size={size * 0.5} />, tag: "PDF" },
    docx: { cls: "bg-demo-light text-demo-blue border-demo-blue/25", icon: <FileText size={size * 0.5} />, tag: "DOC" },
    xlsx: { cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <FileSpreadsheet size={size * 0.5} />, tag: "XLS" },
    zip: { cls: "bg-amber-50 text-amber-600 border-amber-200", icon: <FileArchive size={size * 0.5} />, tag: "ZIP" },
  }[kind];
  return (
    <div className={`relative rounded-lg border flex items-center justify-center shrink-0 ${map.cls}`} style={{ width: size, height: size }}>
      {map.icon}
      <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-white rounded px-1 border border-current leading-tight">
        {map.tag}
      </span>
    </div>
  );
}

export { File as _FileIcon };
