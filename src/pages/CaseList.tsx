import { FolderKanban } from "lucide-react";
import { useDemo, overallStatus } from "@/demo/store";
import { PageHeader, StatusPill, TypeBadge } from "@/components/bits";

/** Shared case list used by the "Cases" nav (both roles). */
export default function CaseList() {
  const d = useDemo();
  return (
    <div className="animate-fade-up">
      <PageHeader title="Cases" subtitle="All product launch cases in this demo session." />
      <div className="fb-card overflow-hidden">
        <div className="px-5 py-4 border-b border-demo-line flex items-center gap-2">
          <FolderKanban size={18} className="text-demo-blue" />
          <h2 className="text-[17px] font-bold text-demo-dark">All Cases ({d.cases.length})</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-demo-mist/70 text-left text-[12.5px] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Case ID</th>
              <th className="px-4 py-3 font-semibold">Product Name</th>
              <th className="px-4 py-3 font-semibold">Issuer</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {d.cases.map((c) => (
              <tr key={c.id} className="border-t border-demo-line/60 hover:bg-demo-pale/80">
                <td className="px-5 py-3.5 font-mono text-[12.5px] text-demo-dark font-semibold">{c.id}</td>
                <td className="px-4 py-3.5 font-semibold text-demo-dark">{c.productName}</td>
                <td className="px-4 py-3.5 text-slate-600">{c.issuer}</td>
                <td className="px-4 py-3.5"><TypeBadge type={c.productType} /></td>
                <td className="px-4 py-3.5 text-slate-500 text-[13px]">{c.submittedTime}</td>
                <td className="px-4 py-3.5 text-slate-500 text-[13px]">{c.owner}</td>
                <td className="px-4 py-3.5"><StatusPill status={overallStatus(c)} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button className="fb-btn-outline !px-3.5 !py-1.5 !text-[13px]" onClick={() => d.openCase(c.id)}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
