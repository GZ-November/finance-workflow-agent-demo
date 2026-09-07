import { useState } from "react";
import { Bell, RotateCcw, UserRound } from "lucide-react";
import { useDemo } from "@/demo/store";
import { DemoMark } from "./bits";
import type { PageId, Role } from "@/demo/types";

export default function TopBar() {
  const d = useDemo();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = d.notifications.filter((n) => !n.read).length;

  const nav: { id: PageId; label: string; roles: ("trader" | "operations")[] }[] = [
    { id: "dashboard", label: "Dashboard", roles: ["trader", "operations"] },
    { id: "cases", label: "Cases", roles: ["trader", "operations"] },
    { id: "launchDocs", label: "Launch Documents", roles: ["trader"] },
    { id: "productCodes", label: "Product Codes", roles: ["trader", "operations"] },
    { id: "auditTrail", label: "Audit Trail", roles: ["trader", "operations"] },
  ];

  const handleNav = (id: PageId) => {
    if (id === "dashboard") {
      d.go(d.role === "trader" ? "dashboard" : "opsDashboard");
      return;
    }
    if (id === "launchDocs") {
      if (d.activeCase && d.activeCase.documents.length > 0) d.go("launchDocs");
      else d.go("cases");
      return;
    }
    d.go(id);
  };

  const activeNav = (id: PageId) => {
    if (id === "dashboard") return d.page === "dashboard" || d.page === "opsDashboard";
    if (id === "launchDocs") return d.page === "launchDocs" || d.page === "outlook" || d.page === "launchConfirmation";
    if (id === "productCodes") return d.page === "productCodes" || d.page === "codeReview" || d.page === "internalUpload";
    if (id === "cases") return d.page === "cases" || d.page === "caseWorkspace";
    return d.page === id;
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-slate-900 px-4 py-2 text-center text-xs font-semibold text-white">Interview prototype · Hard-coded frontend · No backend or live AI · All actions simulated</div>
      {/* Main header */}
      <div className="bg-white border-b border-demo-line shadow-xs">
        <div className="max-w-[1440px] mx-auto px-6 h-[64px] flex items-center gap-3">
          <button onClick={() => d.go(d.role === "trader" ? "dashboard" : "opsDashboard")} className="shrink-0">
            <DemoMark size={36} />
          </button>

          <nav className="hidden lg:flex items-center gap-0.5 ml-3">
            {nav
              .filter((n) => n.roles.includes(d.role))
              .map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNav(n.id)}
                  className={`px-3 py-2 rounded-lg text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                    activeNav(n.id)
                      ? "bg-demo-blue/10 text-demo-blue"
                      : "text-slate-600 hover:text-demo-blue hover:bg-demo-light/60"
                  }`}
                >
                  {n.label}
                </button>
              ))}
          </nav>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen) d.markNotificationsRead();
              }}
              className="relative w-10 h-10 rounded-lg hover:bg-demo-mist flex items-center justify-center text-slate-500"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[380px] fb-card text-foreground overflow-hidden animate-fade-up z-50">
                <div className="px-4 py-3 border-b border-demo-line font-bold text-demo-dark text-[15px]">
                  Notifications
                </div>
                <div className="max-h-[320px] overflow-auto">
                  {d.notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 text-[14px]">No notifications yet</div>
                  ) : (
                    d.notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-demo-line/60 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-[14px] ${n.tone === "success" ? "text-emerald-700" : "text-demo-dark"}`}>
                            {n.title}
                          </span>
                          <span className="text-[11.5px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[13.5px] text-slate-600 mt-1">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex rounded-lg border border-demo-line bg-demo-mist p-0.5">
            {(["trader", "operations"] as Role[]).map((r) => {
              const selected = d.role === r;
              return (
                <button
                  key={r}
                  onClick={() => {
                    if (selected) return;
                    d.setRole(r);
                    d.go(r === "trader" ? "dashboard" : "opsDashboard");
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                    selected
                      ? "bg-demo-blue text-black shadow-sm"
                      : "text-slate-500 hover:text-demo-dark"
                  }`}
                >
                  <UserRound size={14} />
                  {r === "trader" ? "Trader" : "Operations"}
                </button>
              );
            })}
          </div>

          <button
            onClick={d.resetDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12.5px] font-semibold whitespace-nowrap transition-colors"
            title="Restore initial demo data"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Demo signature orange with warm supporting tones. */}
      <div className="h-[3px] bg-gradient-to-r from-demo-blue via-demo-accent to-demo-green" />
    </header>
  );
}
