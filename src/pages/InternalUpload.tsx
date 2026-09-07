import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  Database,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Server,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader } from "@/components/bits";

export default function InternalUpload() {
  const d = useDemo();
  const c = d.activeCase;
  const [notifyPhase, setNotifyPhase] = useState<"idle" | "sending" | "sent">(
    c?.traderNotified ? "sent" : "idle"
  );
  const createStartedRef = useRef(false);
  const notifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyStartedRef = useRef(false);

  const result = c?.productCodeResult;
  const bothDone = Boolean(result);

  useEffect(() => {
    if (!c || createStartedRef.current) return;
    createStartedRef.current = true;
    if (c.productCode !== "code_created") {
      d.recordAudit({
        actor: "Demo Operations",
        action: "Core-system upload initiated",
        detail: "Approved template values submitted to the controlled COPIA and Summit creation flow",
        tone: "info",
        category: "system",
        caseId: c.id,
        productName: c.productName,
      });
      d.completeUpload(c.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id]);

  useEffect(() => {
    if (!bothDone || !c || c.traderNotified) {
      if (c?.traderNotified) setNotifyPhase("sent");
      return;
    }
    if (notifyStartedRef.current) return;
    notifyStartedRef.current = true;
    setNotifyPhase("sending");
    notifyTimerRef.current = setTimeout(() => {
      d.notifyTrader(c.id);
      setNotifyPhase("sent");
    }, 1400);
    return () => {
      if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothDone, c?.id, c?.traderNotified]);

  if (!c) {
    return (
      <div className="fb-card p-10 text-center text-slate-500">
        No active case.{" "}
        <button className="text-demo-green font-semibold" onClick={() => d.go("opsDashboard")}>Operations Dashboard</button>
      </div>
    );
  }

  const systems = [
    {
      name: "COPIA",
      title: "COPIA Product Code",
      code: result?.copiaRef,
      icon: <Database size={23} />,
      isCopia: true,
    },
    {
      name: "Summit",
      title: "Summit Product Code",
      code: result?.summitRef,
      icon: <Server size={23} />,
      isCopia: false,
    },
  ];

  return (
    <div className="animate-fade-up max-w-[1120px] mx-auto">
      <PageHeader
        title="AI-to-Core-System Upload"
        right={
          <button className="fb-btn-ghost" onClick={() => d.go("codeReview")}>
            <ArrowLeft size={16} /> Template Review
          </button>
        }
      />

      {bothDone && result && (
        <>
          <div className="grid grid-cols-2 gap-5">
            {systems.map((system) => (
              <section
                key={system.name}
                className="fb-card overflow-hidden border-2 !border-slate-300 shadow-[0_12px_35px_rgba(100,116,139,0.12)]"
              >
                <div className="h-1.5 bg-slate-400" />
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      {system.icon}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-extrabold text-demo-dark">{system.title}</h2>
                    </div>
                    <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                      Created
                    </span>
                  </div>

                  <div className="mt-6 animate-fade-up rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
                    <div className="font-mono text-[36px] font-black tracking-wide text-demo-dark">{system.code}</div>
                    <div className="mt-3 text-[11.5px] text-slate-500">{result.createdTime} · {result.createdBy}</div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5 animate-fade-up overflow-hidden rounded-xl border-2 border-amber-300 bg-white shadow-[0_12px_35px_rgba(217,119,6,0.14)]">
            <div className="h-1.5 bg-amber-500" />
            <div className="flex items-center gap-4 p-6">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                notifyPhase === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}>
                {notifyPhase === "sent" ? <BellRing size={26} /> : <Bell size={26} className="animate-pulse" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[18px] font-extrabold text-demo-dark">
                  {notifyPhase === "sent" ? "Trader notified" : "Notifying Trader…"}
                </h2>
                <div className="mt-1 text-[12.5px] text-slate-500">
                  {notifyPhase === "sent"
                    ? "Product codes have been automatically sent to Demo Trader"
                    : "Both product codes are created — the system is alerting the Trader automatically."}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {notifyPhase === "sent" ? (
                  <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-700">
                    <CheckCircle2 size={16} /> Sent automatically
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[12px] font-bold text-amber-700">
                    <Loader2 size={16} className="animate-spin" /> Sending
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-up">
            <button className="fb-btn-outline" onClick={() => d.go("auditTrail")}>
              <ListChecks size={16} /> View Audit Trail
            </button>
            <button className="fb-btn-outline" onClick={() => d.go("opsDashboard")}>
              <LayoutDashboard size={16} /> Back to Dashboard
            </button>
          </div>
        </>
      )}

    </div>
  );
}
