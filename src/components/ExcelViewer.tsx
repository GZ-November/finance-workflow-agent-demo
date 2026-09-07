import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function ExcelViewer({ filePath, initialSheetName, singleSheet }: { filePath: string; initialSheetName?: string; singleSheet?: boolean }) {
  const [result, setResult] = useState<{
    sourceKey: string;
    sheets: { name: string; data: string[][] }[];
    error: string;
  }>({ sourceKey: "", sheets: [], error: "" });
  const [activeSheet, setActiveSheet] = useState(0);
  const sourceKey = `${filePath}::${initialSheetName ?? ""}::${singleSheet ? "1" : "0"}`;

  useEffect(() => {
    if (!filePath) return;
    const controller = new AbortController();
    Promise.all([
      fetch(filePath, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("File not found");
        return response.arrayBuffer();
      }),
      import("xlsx"),
    ])
      .then(([buf, XLSX]) => {
        const wb = XLSX.read(buf, { type: "array" });
        const sheetsData = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
          return { name, data: data as string[][] };
        });
        const requestedSheet = initialSheetName?.trim().toLowerCase();
        const requestedIndex = requestedSheet
          ? sheetsData.findIndex((sheet) => sheet.name.trim().toLowerCase() === requestedSheet)
          : -1;
        const visibleSheets = singleSheet && requestedIndex >= 0 ? [sheetsData[requestedIndex]] : sheetsData;
        setResult({ sourceKey, sheets: visibleSheets, error: "" });
        setActiveSheet(singleSheet ? 0 : requestedIndex >= 0 ? requestedIndex : 0);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setResult({ sourceKey, sheets: [], error: e.message });
      });
    return () => controller.abort();
  }, [filePath, initialSheetName, singleSheet, sourceKey]);

  const loading = result.sourceKey !== sourceKey;
  const { sheets, error } = result;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading Excel file…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        Failed to load: {error}
        <br />
        <a href={filePath} target="_blank" rel="noopener noreferrer" className="text-demo-blue font-bold mt-2 inline-block">
          Download file instead
        </a>
      </div>
    );
  }

  if (sheets.length === 0) {
    return <div className="text-center py-16 text-slate-400">No data found in file.</div>;
  }

  const current = sheets[activeSheet];
  if (!current || current.data.length === 0) {
    return <div className="text-center py-16 text-slate-400">Empty sheet.</div>;
  }

  const maxCols = Math.max(...current.data.map((r) => r.length), 1);
  const colLetters = Array.from({ length: maxCols }, (_, i) => String.fromCharCode(65 + (i % 26)));

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-0.5 px-2 pt-2 bg-[#F0F0F0]">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveSheet(i)}
              className={`px-4 py-1.5 rounded-t-lg text-[13px] font-semibold transition-colors ${
                i === activeSheet
                  ? "bg-white text-demo-dark border-t border-x border-slate-200"
                  : "bg-slate-100 text-slate-500 hover:bg-white/50"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#F5F5F5] border-b border-slate-300 sticky top-0 z-10">
              <th className="py-1.5 px-2 text-[11px] text-slate-400 font-semibold border-r border-slate-200 w-10 text-center bg-[#F5F5F5]">#</th>
              {colLetters.map((c) => (
                <th key={c} className="py-1.5 px-2 text-[11px] text-slate-400 font-semibold border-r border-slate-200 font-mono bg-[#F5F5F5]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.data.map((row, ri) => (
              <tr key={ri} className="border-b border-slate-200 hover:bg-demo-light/40">
                <td className="py-1.5 px-2 text-[11px] text-slate-400 font-mono text-center border-r border-slate-200 bg-[#F5F5F5]">
                  {ri + 1}
                </td>
                {colLetters.map((_, ci) => (
                  <td
                    key={ci}
                    className={`py-1.5 px-2 border-r border-slate-200 ${
                      ri === 0 ? "font-bold text-demo-dark bg-slate-50" : "text-slate-600"
                    }`}
                  >
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
