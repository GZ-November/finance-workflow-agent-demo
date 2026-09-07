import { KeyRound } from "lucide-react";
import { useDemo } from "@/demo/store";
import { PageHeader, TypeBadge } from "@/components/bits";

/** Product code registry view ("Product Codes" nav). */
export default function ProductCodeList() {
  const d = useDemo();
  const created = d.cases.filter((c) => c.productCodeResult);
  const pending = d.cases.filter(
    (c) => !c.productCodeResult && c.classification === "classified" && c.compliance === "clear"
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title="Product Codes" subtitle="Codes created via the simulated COPIA / Summit upload flow." />
      <div className="fb-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-demo-line flex items-center gap-2">
          <KeyRound size={18} className="text-demo-blue" />
          <h2 className="text-[17px] font-bold text-demo-dark">Created Codes ({created.length})</h2>
        </div>
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-demo-mist/70 text-left text-[12.5px] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Product Code</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">COPIA Ref</th>
              <th className="px-4 py-3 font-semibold">Summit Ref</th>
              <th className="px-5 py-3 font-semibold">Created By</th>
            </tr>
          </thead>
          <tbody>
            {created.map((c) => (
              <tr key={c.id} className="border-t border-demo-line/60 hover:bg-demo-pale/80">
                <td className="px-5 py-3.5 font-mono font-bold text-[14px] text-demo-dark">{c.productCodeResult!.code}</td>
                <td className="px-4 py-3.5 font-semibold text-demo-dark">{c.productName}</td>
                <td className="px-4 py-3.5"><TypeBadge type={c.productType} /></td>
                <td className="px-4 py-3.5 text-slate-500 text-[13px]">{c.productCodeResult!.createdTime}</td>
                <td className="px-4 py-3.5 text-slate-500 text-[13px] font-mono">{c.productCodeResult!.copiaRef}</td>
                <td className="px-4 py-3.5 text-slate-500 text-[13px] font-mono">{c.productCodeResult!.summitRef}</td>
                <td className="px-5 py-3.5 text-slate-500 text-[13px]">{c.productCodeResult!.createdBy}</td>
              </tr>
            ))}
            {created.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No product codes created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pending.length > 0 && (
        <div className="fb-card p-5">
          <h3 className="text-[15px] font-bold text-demo-dark mb-3">Pending Code Creation</h3>
          <div className="flex flex-wrap gap-2.5">
            {pending.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  d.openCase(c.id);
                  if (c.compliance !== "blocked") d.go("codeReview");
                }}
                className="px-4 py-2.5 rounded-lg border border-demo-line hover:border-demo-blue/50 text-left"
              >
                <div className="font-bold text-[14px] text-demo-dark">{c.productName}</div>
                <div className="text-[12px] text-slate-400 font-mono">{c.id}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
