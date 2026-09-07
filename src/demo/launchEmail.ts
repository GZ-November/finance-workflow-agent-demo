import type { CaseItem, EmailDraft } from "./types";

function isClientACase(c: CaseItem) {
  return c.sourceScenario === "eli_client_a" || /SERIES-A-001|Client A/i.test(c.productName);
}

function isClientBCase(c: CaseItem) {
  return c.sourceScenario === "eli_client_b" || /Client B/i.test(c.productName);
}

function fieldValue(c: CaseItem, key: string, fallback: string) {
  return c.fields.find((field) => field.key === key)?.value?.trim() || fallback;
}

function buildClientALaunchingEmail(c: CaseItem) {
  const issuer = fieldValue(c, "issuer", "Client A Bank Limited");
  const series = fieldValue(c, "securitiesCode", "SERIES-A-001");
  const underlyings = fieldValue(c, "underlyings", "AAA.HK, BBB.HK");
  const coupon = fieldValue(c, "couponRate", "13.08% p.a.");
  const maturity = fieldValue(c, "maturityDate", "09 Apr 2027");
  const structure = fieldValue(c, "structure", "Daily Autocall + At-Expiry Knock-in");
  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#242424;font-size:14px;line-height:1.55;max-width:980px;">
  <p style="margin:0 0 18px;">Dear all,</p>
  <p style="margin:0 0 14px;font-weight:700;">
    We are launching a demo ELI tranche. Please review the indicative terms and the attached launch pack before placing any orders.
  </p>

  <table style="width:100%;border-collapse:collapse;margin:0 0 18px;border:1px solid #9aa7b4;">
    <thead>
      <tr><th colspan="2" style="padding:9px 12px;background:#fff5ed;border:1px solid #dedede;text-align:center;font-size:15px;">Indicative Product Terms</th></tr>
    </thead>
    <tbody>
      <tr><td style="width:32%;padding:7px 10px;border:1px solid #c8d0d8;">Issuer</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${issuer}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Series Number</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${series}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Underlyings</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${underlyings}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Structure</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${structure}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Coupon</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${coupon}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Maturity</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${maturity}</td></tr>
    </tbody>
  </table>

  <div style="margin:0 0 18px;padding:14px;border:1px solid #dedede;background:#fff9f5;">
    <p style="margin:0 0 8px;font-weight:700;">Offering Documents MUST be provided to clients before each transaction.</p>
    <ol style="margin:0 0 10px 22px;padding:0;">
      <li>Programme Memorandum</li>
      <li>Product Booklet</li>
      <li>Financial Disclosure Documents of the Issuer</li>
      <li>Relevant Indicative Term Sheet</li>
      <li>Application Form</li>
      <li>Transaction Related Disclosure</li>
    </ol>
  </div>

  <p style="margin:0 0 8px;font-weight:700;">Key risks</p>
  <ul style="margin:0 0 18px 22px;padding:0;columns:2;column-gap:34px;">
    <li>Structured Investment Product Embedded with Derivatives</li>
    <li>Not Principal Protected</li>
    <li>Limited Maximum Potential Gain</li>
    <li>Not the Same as Investment in the Reference Stocks</li>
    <li>Liquidity Risks</li>
    <li>Not Covered by Investor Compensation Fund</li>
    <li>Maximum Loss upon Issuer Default or Insolvency</li>
    <li>Conflicts of Interest</li>
  </ul>

  <p style="margin:0;">This is a fictional demonstration email. No email is sent; no original supporting documents are included.</p>
</div>`.trim();
}

function buildClientBLaunchingEmail(c: CaseItem) {
  const issuer = fieldValue(c, "issuer", "Client B Bank Europe SE");
  const series = fieldValue(c, "securitiesCode", "SERIES-B-001");
  const underlyings = fieldValue(c, "underlyings", "CCC.HK");
  const coupon = fieldValue(c, "couponRate", "10.08% p.a.");
  const maturity = fieldValue(c, "maturityDate", "07 Jan 2027");
  const structure = fieldValue(c, "structure", "Daily Call, No Knock-in");
  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#242424;font-size:14px;line-height:1.55;max-width:980px;">
  <p style="margin:0 0 18px;">Dear all,</p>
  <p style="margin:0 0 14px;font-weight:700;">
    We are launching a demo ELI tranche. Please review the indicative terms and the attached launch pack before placing any orders.
  </p>

  <table style="width:100%;border-collapse:collapse;margin:0 0 18px;border:1px solid #9aa7b4;">
    <thead>
      <tr><th colspan="2" style="padding:9px 12px;background:#fff5ed;border:1px solid #dedede;text-align:center;font-size:15px;">Indicative Product Terms</th></tr>
    </thead>
    <tbody>
      <tr><td style="width:32%;padding:7px 10px;border:1px solid #c8d0d8;">Issuer</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${issuer}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Series Number</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${series}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Underlyings</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${underlyings}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Structure</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${structure}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Coupon</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${coupon}</td></tr>
      <tr><td style="padding:7px 10px;border:1px solid #c8d0d8;">Maturity</td><td style="padding:7px 10px;border:1px solid #c8d0d8;">${maturity}</td></tr>
    </tbody>
  </table>

  <div style="margin:0 0 18px;padding:14px;border:1px solid #dedede;background:#fff9f5;">
    <p style="margin:0 0 8px;font-weight:700;">Offering Documents MUST be provided to clients before each transaction.</p>
    <ol style="margin:0 0 10px 22px;padding:0;">
      <li>Programme Memorandum</li>
      <li>Product Booklet</li>
      <li>Financial Disclosure Documents of the Issuer</li>
      <li>Relevant Indicative Term Sheet</li>
      <li>Application Form</li>
      <li>Transaction Related Disclosure</li>
    </ol>
  </div>

  <p style="margin:0 0 8px;font-weight:700;">Key risks</p>
  <ul style="margin:0 0 18px 22px;padding:0;columns:2;column-gap:34px;">
    <li>Not Capital Protected</li>
    <li>Unlisted Structured Investment Product</li>
    <li>Limited Maximum Potential Gain</li>
    <li>No Collateral</li>
    <li>Liquidity Risks</li>
    <li>Not Covered by Investor Compensation Fund</li>
    <li>Maximum Loss upon Issuer Default or Insolvency</li>
    <li>Conflicts of Interest</li>
  </ul>

  <p style="margin:0;">This is a fictional demonstration email. No email is sent; no original supporting documents are included.</p>
</div>`.trim();
}

export function buildLaunchEmailDraft(c: CaseItem, updatedAt: string): EmailDraft {
  if (isClientACase(c)) {
    return {
      to: "All Sales Staff",
      cc: "Flow Products Team; Treasury Settlement",
      bcc: "",
      subject: "ELI Launching – Client A SERIES-A-001 – 27 Jul 2026",
      body: buildClientALaunchingEmail(c),
      attachmentIds: c.documents.filter((doc) => doc.kind !== "zip").map((doc) => doc.id),
      updatedAt,
    };
  }

  if (isClientBCase(c)) {
    return {
      to: "All Sales Staff",
      cc: "Flow Products Team; Treasury Settlement",
      bcc: "",
      subject: "ELI Launching – Client B SERIES-B-001 – 24 Jun 2026",
      body: buildClientBLaunchingEmail(c),
      attachmentIds: c.documents.filter((doc) => doc.kind !== "zip").map((doc) => doc.id),
      updatedAt,
    };
  }

  const coupon = c.fields.find((field) => field.key === "couponRate")?.value ?? "—";
  const structure = c.fields.find((field) => field.key === "structure")?.value ?? c.structure ?? "ELI";
  return {
    to: "Sales Distribution",
    cc: "Flow Products Team",
    bcc: "",
    subject: `ELI Launch Documents — ${c.productName}`,
    body: `Dear all,\n\nPlease find the launch information for ${c.productName}, issued by ${c.issuer} and denominated in ${c.currency}.\n\nKey terms\n• Issuer: ${c.issuer}\n• Coupon: ${coupon}\n• Underlyings: ${c.underlyings.join(", ") || "—"}\n• Structure: ${structure}\n\nPlease review the launch documents and follow the applicable selling procedures.`,
    attachmentIds: c.documents.filter((doc) => doc.kind !== "zip").map((doc) => doc.id),
    updatedAt,
  };
}

export function isRichEmailBody(body: string) {
  return /^\s*<(div|p|table)\b/i.test(body);
}
