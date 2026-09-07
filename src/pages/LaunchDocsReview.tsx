import { useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, Download, ExternalLink, Eye,
  FileSpreadsheet, FileText, MailPlus, Paperclip, ShieldCheck,
} from "lucide-react";
import { useDemo } from "@/demo/store";
import { getLaunchDocumentAsset } from "@/demo/documentAssets";
import { ExcelViewer } from "@/components/ExcelViewer";
import { FileIcon, PageHeader } from "@/components/bits";
import type { CaseItem, LaunchDoc } from "@/demo/types";

type SummarySegment = string | { highlight: string };

type ExecutiveSummary = {
  sentences: SummarySegment[][];
};

const H = (highlight: string): SummarySegment => ({ highlight });

function caseValue(c: CaseItem, key: string, fallback = "—") {
  return c.fields.find((field) => field.key === key)?.value || fallback;
}

function isProductCodeDocument(doc: LaunchDoc) {
  const name = doc.name.toLowerCase();
  return name.includes("copia") || name.includes("summit") || name.includes("code setup");
}

function getExecutiveSummary(c: CaseItem, doc: LaunchDoc): ExecutiveSummary {
  const name = doc.name.toLowerCase();
  const issuer = caseValue(c, "issuer", c.issuer);
  const currency = caseValue(c, "currency", c.currency);
  const underlyings = caseValue(c, "underlyings", c.underlyings.join(", "));
  const coupon = caseValue(c, "couponRate", caseValue(c, "coupon"));
  const strike = caseValue(c, "strike", caseValue(c, "strikePrice"));
  const maturity = caseValue(c, "maturityDate");
  const structure = caseValue(c, "structure", c.structure || "Equity Linked Investment");
  const issuePrice = caseValue(c, "issuePrice", "100%");
  const minimumSubscription = caseValue(c, "minSubscription", caseValue(c, "minimumSubscription"));
  // The client-provided downstream setup confirms P5 for these ELI packs. Read
  // that generated template value for the document summary, while keeping the
  // extracted Trader field manual and blank until the Trader confirms it.
  const templateRiskRating = c.templates
    .flatMap((template) => template.rows)
    .find((row) => /risk rating/i.test(row.field))?.value;
  const riskRating = caseValue(c, "riskRating", templateRiskRating || (c.productType === "ELI" ? "P5" : "—"));
  const knockIn = caseValue(c, "knockIn", "Not applicable");

  if (name.includes("term sheet") || name.includes("indicative")) {
    return {
      sentences: [
        ["This document sets out the key commercial terms for ", H(c.productName), ", issued by ", H(issuer), "."],
        ["The product is linked to ", H(underlyings), ", denominated in ", H(currency), ", and pays a coupon of ", H(coupon), "."],
        ["Strike is set at ", H(strike), " with structure ", H(structure), ", and the product matures on ", H(maturity), "."],
        ["Review the economics, underlying identifiers and key dates against the approved Sales instruction."],
      ],
    };
  }

  if (name.includes("application")) {
    return {
      sentences: [
        ["This application form captures the customer instructions and subscription details required to place ", H(c.productName), "."],
        ["Issue price ", H(issuePrice), ", minimum subscription ", H(minimumSubscription), ", product currency ", H(currency), "."],
        ["Customer particulars, investment amount and authorised signature remain subject to completion."],
        ["Confirm all client instructions before the document is included in the launch email."],
      ],
    };
  }

  if (name.includes("control") || name.includes("code setup") || doc.kind === "xlsx") {
    return {
      sentences: [
        ["This workbook consolidates the reviewed product data into a controlled source for Product Code creation and the COPIA and Summit workflows."],
        ["Issuer ", H(issuer), " · Currency ", H(currency), " · Underlying exposure ", H(underlyings), "."],
        ["Product economics, identifiers and lifecycle dates are aligned to the Term Sheet."],
        ["Operations should review exceptions before approving the controlled upload."],
      ],
    };
  }

  if (name.includes("payoff")) {
    return {
      sentences: [
        ["This illustration explains how the return and redemption amount for ", H(c.productName), " may change under different underlying performance scenarios."],
        ["Structure ", H(structure), " · Underlyings ", H(underlyings), "."],
        ["Strike ", H(strike), " · Knock-in ", H(knockIn), " · Coupon ", H(coupon), " · Final maturity ", H(maturity), "."],
        ["Includes early-redemption, base-case and adverse maturity outcomes; figures are illustrative."],
      ],
    };
  }

  if (name.includes("product booklet")) {
    return {
      sentences: [
        ["This booklet provides the broader programme framework, product mechanics and standard terms applicable to ", H(c.productName), "."],
        ["Issuer / guarantor ", H(issuer), " · Underlying exposure ", H(underlyings), "."],
        ["Product structure ", H(structure), " · Risk rating ", H(riskRating), "."],
        ["Review product mechanics, investor eligibility and programme-level risk factors."],
      ],
    };
  }

  if (name.includes("financial disclosure") || name.includes("guarantor")) {
    return {
      sentences: [
        ["This disclosure provides financial, regulatory and credit information relevant to ", H(issuer), "."],
        ["It covers financial condition, regulatory status and material credit considerations."],
        ["Product payments remain subject to the issuer's ability to meet its obligations."],
        ["Review together with the Product Booklet, Term Sheet and transaction disclosure."],
      ],
    };
  }

  if (name.includes("disclosure")) {
    return {
      sentences: [
        ["This disclosure highlights the material product, market and issuer risks associated with ", H(c.productName), "."],
        ["Non-capital-protected exposure to ", H(underlyings), " · Issuer and credit exposure to ", H(issuer), "."],
        ["Risk rating ", H(riskRating), " · Market, liquidity and early-redemption risks included."],
        ["Customer suitability, risk acknowledgement and distribution requirements should be confirmed."],
      ],
    };
  }

  return {
    sentences: [
      ["This document was generated for ", H(c.productName), " using the reviewed Case data."],
      doc.highlightFields.length > 0
        ? [doc.highlightFields.slice(0, 3).join(" · ")]
        : ["Product terms aligned to the source document · Key values populated from the reviewed Case."],
      ["Confirm the content before including it in the customer launch email."],
    ],
  };
}

export default function LaunchDocsReview() {
  const d = useDemo();
  const c = d.activeCase;
  const [selectedDocId, setSelectedDocId] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [attachmentsChecked, setAttachmentsChecked] = useState(false);

  if (!c || c.documents.length === 0) {
    return <div className="fb-card p-10 text-center text-slate-500">No launch documents available.</div>;
  }

  const docs = c.documents.filter((doc) => doc.kind !== "zip" && !isProductCodeDocument(doc));
  if (docs.length === 0) {
    return <div className="fb-card p-10 text-center text-slate-500">No launch documents available.</div>;
  }
  const selectedDoc = docs.find((doc) => doc.id === selectedDocId) ?? docs[0];
  const selectedAsset = selectedDoc ? getLaunchDocumentAsset(c, selectedDoc) : undefined;
  const executiveSummary = getExecutiveSummary(c, selectedDoc);
  const ready = termsChecked && attachmentsChecked;
  const sourceReferences = (c.realFiles ?? []).filter((file) => /\.(pdf|docx)$/i.test(file.path));

  const confirm = () => {
    d.approveLaunchPack(c.id);
    d.saveOutlookDraft(c.id);
    d.go("outlook");
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="All launch documents have been generated"
        right={<button className="fb-btn-ghost" onClick={() => d.go("caseWorkspace")}><ArrowLeft size={16} /> Back</button>}
      />

      <div className="grid grid-cols-[280px_minmax(0,1fr)_340px] items-start gap-4">
        <section className="fb-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-demo-line bg-slate-50 px-4 py-3.5">
            <Paperclip size={16} className="text-demo-blue" />
            <h2 className="text-[14px] font-extrabold text-demo-dark">Generated Files</h2>
            <span className="ml-auto text-[11px] font-bold text-slate-400">{docs.length}</span>
          </div>

          <div className="divide-y divide-demo-line/70">
            {docs.map((doc) => {
              const active = doc.id === selectedDoc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active ? "bg-demo-light ring-1 ring-inset ring-demo-blue/30" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <FileIcon kind={doc.kind} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-extrabold text-demo-dark">{doc.name}</span>
                    <span className="mt-0.5 block text-[10.5px] text-slate-400">Generated {doc.generatedAt}</span>
                  </span>
                  {active
                    ? <Eye size={15} className="shrink-0 text-demo-blue" />
                    : <CheckCircle2 size={14} className="shrink-0 text-emerald-500 opacity-70" />}
                </button>
              );
            })}
          </div>

          {sourceReferences.length > 0 && (
            <div className="border-t border-demo-line bg-demo-pale px-4 py-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source references</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {sourceReferences.map((file) => (
                  <a key={file.path} href={file.path} target="_blank" rel="noreferrer" className="truncate text-[11.5px] font-semibold text-demo-blue hover:underline">
                    {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="fb-card min-w-0 overflow-hidden">
          <div className="flex min-h-[62px] items-center gap-3 border-b border-demo-line bg-white px-4 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              selectedAsset?.previewKind === "xlsx" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}>
              {selectedAsset?.previewKind === "xlsx" ? <FileSpreadsheet size={19} /> : <FileText size={19} />}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-extrabold text-demo-dark">{selectedDoc.name}</div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Web document preview</div>
            </div>
            {selectedAsset && (
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <a href={selectedAsset.path} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg border border-demo-line bg-white px-2.5 text-[11px] font-bold text-demo-blue hover:bg-demo-light">
                  <ExternalLink size={13} /> Open
                </a>
                <a href={selectedAsset.path} download className="flex h-8 w-8 items-center justify-center rounded-lg border border-demo-line bg-white text-slate-500 hover:bg-slate-50" title="Download">
                  <Download size={14} />
                </a>
              </div>
            )}
          </div>

          <div className="border-b border-demo-line bg-gradient-to-b from-demo-pale/60 to-white px-7 py-6">
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-demo-blue">Demo</div>
              <div className="shrink-0 text-[10.5px] text-slate-400">{caseValue(c, "issueDate", c.submittedTime)}</div>
            </div>
            <div className="mt-1.5 text-[19px] font-black leading-snug text-demo-dark">{selectedDoc.name.replace(/\.(pdf|xlsx|docx)$/i, "")}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">Simulated AI Agent output · {c.productName}</div>
            <div className="my-4 border-t border-demo-line/80" />
            <div className="space-y-3">
              {executiveSummary.sentences.map((sentence, index) => (
                <p key={index} className="text-[12.5px] leading-7 text-slate-600">
                  {sentence.map((segment, segmentIndex) =>
                    typeof segment === "string" ? (
                      <span key={segmentIndex}>{segment}</span>
                    ) : (
                      <span key={segmentIndex} className="mx-0.5 inline-block whitespace-nowrap rounded-md bg-demo-light px-2 py-0.5 align-middle text-[11.5px] font-bold leading-5 text-demo-blue">
                        {segment.highlight}
                      </span>
                    )
                  )}
                </p>
              ))}
            </div>
          </div>

          <div className="h-[540px] bg-slate-100">
            {!selectedAsset ? (
              <div className="h-full overflow-auto bg-white p-6">
                <p className="mb-4 text-sm font-semibold text-slate-500">Fictional summary preview · Original attachments are excluded from this public portfolio.</p>
                <table className="w-full text-left text-sm"><tbody>{c.fields.map((field) => (
                  <tr key={field.key} className="border-b border-slate-200"><th className="p-3 text-slate-600">{field.label}</th><td className="p-3">{field.value}</td></tr>
                ))}</tbody></table>
              </div>
            ) : selectedAsset.previewKind === "xlsx" ? (
              <div className="h-full overflow-auto p-3">
                <ExcelViewer filePath={selectedAsset.path} />
              </div>
            ) : (
              <iframe
                title={`${selectedDoc.name} preview`}
                src={`${selectedAsset.path}#toolbar=1&navpanes=0&view=FitH`}
                className="h-full w-full border-0 bg-white"
              />
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="fb-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={20} /></div>
              <div><h3 className="text-[16px] font-extrabold text-demo-dark">Final Confirmation</h3></div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <button onClick={() => setTermsChecked((value) => !value)} className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left ${termsChecked ? "border-emerald-300 bg-emerald-50/60" : "border-demo-line bg-white"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${termsChecked ? "bg-emerald-600 text-white" : "border-2 border-slate-300"}`}>{termsChecked && <Check size={14} />}</span>
                <span><b className="block text-[13.5px] text-demo-dark">All launch documents are complete</b></span>
              </button>
              <button onClick={() => setAttachmentsChecked((value) => !value)} className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left ${attachmentsChecked ? "border-emerald-300 bg-emerald-50/60" : "border-demo-line bg-white"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${attachmentsChecked ? "bg-emerald-600 text-white" : "border-2 border-slate-300"}`}>{attachmentsChecked && <Check size={14} />}</span>
                <span><b className="block text-[13.5px] text-demo-dark">All product terms are accurate</b></span>
              </button>
            </div>
          </section>

          <button className="fb-btn-primary w-full !py-3.5 !text-[15px]" disabled={!ready} onClick={confirm}>
            <MailPlus size={18} /> Confirm &amp; create Outlook draft
          </button>
        </div>
      </div>
    </div>
  );
}
