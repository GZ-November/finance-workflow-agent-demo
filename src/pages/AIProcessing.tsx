import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Bot, CheckCircle2, FileCheck2, GitBranch, Loader2,
  ScanSearch, ShieldAlert, ShieldCheck, Sparkles, WandSparkles,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, type StepState } from "@/components/bits";

const STEPS = [
  "Detect & Classify",
  "Extract Terms & Screen Sanctions",
  "Select Workflow & Templates",
  "Generate Outputs",
];

export default function AIProcessing() {
  const d = useDemo();
  const scenario = d.scenario ?? "eli_client_b";
  const [activeStep, setActiveStep] = useState(0);
  const [revealedLine, setRevealedLine] = useState(-1);
  const [done, setDone] = useState(false);
  const applied = useRef(false);
  const timers = useRef<number[]>([]);
  const isBond = scenario === "bond_primary" || scenario === "bond_secondary";
  const isSecondary = scenario === "bond_secondary";
  const isSanction = scenario === "sanction_hit";
  const codeOnly = d.productCodeOnly;
  const isEliLaunch = !isBond && !codeOnly && !isSanction;

  const details = useMemo(() => {
    if (scenario === "sanction_hit") return {
      product: "Sanction Hit", terms: "Screening matched a demo sanction record", screening: "Blocked · no downstream outputs",
      rule: "SANCTION_BLOCK_V1", outputs: "None — case terminated",
    };
    if (scenario === "bond_primary") return {
      product: "Primary Bond", terms: "14 key bond terms detected", screening: "No equity underlyings · fixed-income screening applied",
      rule: "BOND_CODE_V1", outputs: "Bond Code Creation + COPIA + Summit",
    };
    if (scenario === "bond_secondary") return {
      product: "Secondary Bond", terms: "13 terms parsed from Outlook and Market Data Source source", screening: "NBMCE numeric exception detected",
      rule: "BOND_CODE_V1", outputs: "2 code views · 1 human exception",
    };
    if (scenario === "eli_client_a") return {
      product: "Complex ELI", terms: "17 terms · 2 underlyings extracted", screening: "AAA.HK and BBB.HK clear",
      rule: "ELI_COMPLEX_V1", outputs: "5 launch files + 2 product code views",
    };
    if (scenario === "eli_client_b") return {
      product: "Standard ELI", terms: "18 terms · 1 underlying extracted", screening: "BBB.HK clear",
      rule: "ELI_STANDARD_V1", outputs: "5 launch files + 2 product code views",
    };
    return {
      product: "Standard ELI", terms: "18 terms · 1 underlying extracted", screening: "BBB.HK clear",
      rule: "ELI_STANDARD_V1", outputs: "5 launch files + 2 product code views",
    };
  }, [scenario]);

  useEffect(() => {
    const scheduled = timers.current;
    const lineCount = 12;
    const lineDelay = isEliLaunch ? 1450 : 1250;

    Array.from({ length: lineCount }).forEach((_, index) => {
      scheduled.push(window.setTimeout(() => {
        setRevealedLine(index);
        setActiveStep(Math.floor(index / 3));
      }, 350 + index * lineDelay));
    });
    scheduled.push(window.setTimeout(
      () => setDone(true),
      900 + lineCount * lineDelay,
    ));
    return () => scheduled.forEach(window.clearTimeout);
  }, [isEliLaunch]);

  useEffect(() => {
    if (done && !applied.current) {
      applied.current = true;
      d.finishProcessing();
    }
  }, [done, d]);

  const states: StepState[] = STEPS.map((_, index) => {
    if (index < activeStep || done) return "success";
    if (index === activeStep) return "loading";
    return "idle";
  });

  const cards = [
    {
      icon: <ScanSearch size={19} />, title: "Product detected",
      lines: ["Source document read", `Classification: ${details.product}`, `Route: ${isSanction ? "Sanctions review" : isBond ? "Bond" : "ELI"}`],
    },
    {
      icon: <ShieldCheck size={19} />, title: isSanction ? "Sanctions screening" : isEliLaunch ? "Key terms extracted" : "Terms & controls",
      lines: isSanction ? [details.terms, details.screening, "Case terminated"] : [details.terms, details.screening, "Mandatory control completed"],
    },
    {
      icon: <GitBranch size={19} />, title: "Workflow selected",
      lines: isSanction ? [
        `Rule: ${details.rule}`,
        "No downstream workflow",
        "Locked for review",
      ] : [
        `Rule: ${details.rule}`,
        isEliLaunch ? "Launch documents and product code workflows selected" : codeOnly || isBond ? "Product Code workflow selected" : "Trader and Operations lanes created",
        isSecondary ? "Human validation task added" : "No routing exception",
      ],
    },
    {
      icon: <WandSparkles size={19} />, title: "Outputs generated",
      lines: isSanction ? ["No outputs generated", "No files prepared", "Case remains blocked"] : [codeOnly && !isBond ? "Product Code + COPIA + Summit" : details.outputs, codeOnly || isBond ? "Operations package ready" : "Launch email workflow ready", "Shared data used once across all outputs"],
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={<span className="flex items-center gap-3"><Sparkles className="text-demo-blue" size={26} /> AI is processing...</span>}
      />

      <div className="fb-card bg-gradient-to-br from-white to-demo-mist/50 px-6 pb-6 pt-7">
        <div className="grid grid-cols-4 gap-4 px-2">
          {STEPS.map((step, index) => {
            const state = states[index];
            const circleClass =
              state === "success"
                ? "border-demo-green bg-demo-green text-white"
                : state === "loading"
                ? "border-demo-blue bg-white text-demo-blue shadow-[0_0_0_6px_rgba(0,137,209,0.10)]"
                : state === "blocked"
                ? "border-red-600 bg-red-600 text-white"
                : "border-slate-300 bg-white text-slate-400";
            const labelClass = state === "idle" ? "text-slate-400" : state === "blocked" ? "text-red-700" : "text-demo-dark";
            return (
              <div key={step} className="relative flex min-h-[92px] flex-col items-center text-center">
                {index > 0 && (
                  <div className={`absolute -left-2 right-1/2 top-[21px] h-[3px] ${state !== "idle" ? state === "blocked" ? "bg-red-400" : "bg-demo-green" : "bg-slate-200"}`} />
                )}
                {index < STEPS.length - 1 && (
                  <div className={`absolute left-1/2 -right-2 top-[21px] h-[3px] ${states[index + 1] !== "idle" ? states[index + 1] === "blocked" ? "bg-red-400" : "bg-demo-green" : "bg-slate-200"}`} />
                )}
                <div className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${circleClass}`}>
                  {state === "success" ? <CheckCircle2 size={22} /> : state === "loading" ? <Loader2 size={21} className="animate-spin [animation-duration:1.8s]" /> : state === "blocked" ? <ShieldAlert size={21} /> : <span className="text-[14px] font-black">{index + 1}</span>}
                </div>
                <div className={`mt-3 min-h-[38px] max-w-[240px] text-[13px] font-extrabold leading-[1.25] ${labelClass}`}>{step}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-4 px-2">
          {cards.map((card, index) => {
            const reached = index <= activeStep || done;
            return (
              <div key={card.title} className="relative h-full pt-7">
                <div className={`absolute left-1/2 top-0 h-7 w-px -translate-x-1/2 ${reached ? "bg-demo-blue/50" : "bg-slate-200"}`} />
                <div className={`h-full min-h-[250px] rounded-xl border-2 p-4 transition-all ${reached ? "border-demo-blue/25 bg-white shadow-card" : "border-slate-200 bg-slate-50/70 opacity-55"}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-demo-blue/10 text-demo-blue">{card.icon}</div>
                  <h3 className="mt-3 text-[15px] font-extrabold text-demo-dark">{card.title}</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {card.lines.map((line, lineIndex) => {
                      const globalLineIndex = index * 3 + lineIndex;
                      const visible = done || globalLineIndex <= revealedLine;
                      const complete = done || globalLineIndex < revealedLine;
                      const current = !done && globalLineIndex === revealedLine;
                      if (!visible) return null;
                      return (
                        <div
                          key={line}
                          className={`flex min-h-[42px] animate-fade-up items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] leading-snug ${
                            complete
                              ? "bg-emerald-50/70 text-slate-600"
                              : "border border-demo-blue/20 bg-demo-light text-demo-dark"
                          }`}
                        >
                          {complete ? (
                            <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                          ) : current ? (
                            <Loader2 size={13} className="shrink-0 animate-spin text-demo-blue" />
                          ) : null}
                          <span className={current ? "font-semibold" : ""}>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                  {index === activeStep && !done && <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-demo-blue"><Bot size={14} className="animate-pulse" /> Working…</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {done && d.activeCase?.compliance === "blocked" && (
        <div className="mt-5 flex items-center gap-5 rounded-xl border-2 border-red-300 bg-red-50 p-6 shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert size={29} />
          </div>
          <div className="flex-1">
            <div className="text-[20px] font-black text-red-700">Sanction match detected — case blocked</div>
            <div className="mt-1 text-[13.5px] text-slate-600">No launch documents or product code templates were generated.</div>
          </div>
          <button className="fb-btn-danger !px-6 !py-3" onClick={() => d.go("sanctionBlocked")}>
            View sanction details <ArrowRight size={17} />
          </button>
        </div>
      )}

      {done && d.activeCase?.compliance !== "blocked" && (
        <div className="mt-5 flex items-center gap-5 rounded-xl border-2 border-demo-blue/25 bg-white p-6 shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FileCheck2 size={29} />
          </div>
          <div className="flex-1">
            <div className="text-[20px] font-black text-demo-dark">{codeOnly ? "Product Code templates ready for Operations review" : `${details.product} ready for human review`}</div>
          </div>
          <button className="fb-btn-primary !px-6 !py-3" onClick={() => d.go(codeOnly ? "codeReview" : isBond ? "bondRoute" : "caseWorkspace")}>
            {codeOnly ? "Review Product Code" : "Continue to review"} <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
