export type Role = "trader" | "operations";

export type PageId =
  | "dashboard"
  | "upload"
  | "processing"
  | "sanctionBlocked"
  | "caseWorkspace"
  | "launchDocs"
  | "outlook"
  | "launchConfirmation"
  | "opsDashboard"
  | "codeReview"
  | "internalUpload"
  | "bondRoute"
  | "auditTrail"
  | "cases"
  | "productCodes";

export type ProductType = "ELI" | "Bond" | "Unsupported";
export type DemoScenario =
  | "eli_client_a"
  | "eli_client_b"
  | "bond_primary"
  | "bond_secondary"
  | "sanction_hit";

export type ClassificationStatus = "pending" | "classified" | "unsupported";
export type ComplianceStatus = "pending" | "clear" | "blocked";
export type LaunchDocStatus =
  | "not_required"
  | "generating"
  | "trader_review"
  | "outlook_draft"
  | "launch_email_sent"
  | "approved";
export type ProductCodeStatus =
  | "not_started"
  | "generating"
  | "operations_review"
  | "approved"
  | "uploading"
  | "code_created";

export type OverallStatus =
  | "New"
  | "Processing"
  | "Blocked"
  | "Trader Review"
  | "Operations Review"
  | "Awaiting Customer Confirmation"
  | "In Progress"
  | "Completed";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0-100
  sourcePage: string;
  edited?: boolean;
  manualRequired?: boolean;
  sourceKind?: "term-sheet" | "sales-email" | "rule-derived" | "human-required";
}

export type DocStatus = "generated" | "needs_input" | "approved";

export interface LaunchDoc {
  id: string;
  name: string;
  kind: "pdf" | "docx" | "xlsx" | "zip";
  status: DocStatus;
  generatedAt: string;
  highlightFields: string[];
}

export interface TemplateRow {
  field: string;
  value: string;
  source: "ai" | "manual" | "ops";
  issue?: boolean;
  issueReason?: string;
  expectedValue?: string;
  reviewed?: boolean;
}

export interface EmailDraft {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  attachmentIds: string[];
  updatedAt: string;
}

export interface ExcelTemplate {
  id: "pcc" | "copia" | "summit";
  name: string;
  status: "generated" | "in_review" | "approved";
  rows: TemplateRow[];
}

export interface AuditEvent {
  id: string;
  time: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  tone: "info" | "success" | "warning" | "danger";
  category: "case" | "document" | "field" | "email" | "template" | "system" | "security";
  caseId?: string;
  productName?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CaseItem {
  id: string;
  productName: string;
  issuer: string;
  productType: ProductType | "Unknown";
  currency: string;
  underlyings: string[];
  submittedTime: string;
  owner: string;
  classification: ClassificationStatus;
  compliance: ComplianceStatus;
  launchDocs: LaunchDocStatus;
  productCode: ProductCodeStatus;
  fields: ExtractedField[];
  documents: LaunchDoc[];
  templates: ExcelTemplate[];
  templateRule?: string;
  structure?: string;
  classificationReason?: string;
  sanctionReason?: string;
  sanctionHitUnderlying?: string;
  productCodeResult?: {
    code: string;
    createdTime: string;
    copiaRef: string;
    summitRef: string;
    createdBy: string;
  };
  manualInputDone?: boolean;
  outlookDraftSaved?: boolean;
  emailDetected?: boolean;
  emailDraft?: EmailDraft;
  launchEmailSentAt?: string;
  isSeeded?: boolean;
  fieldsConfirmed?: boolean;
  opsAlerted?: boolean;
  traderNotified?: boolean;
  sourceScenario?: DemoScenario;
  salesRequestEmail?: {
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
    table?: { key: string; value: string }[];
    attachments?: string[];
  };
  realFiles?: { name: string; path: string; systemFileId?: string }[];
  copiaEmail?: {
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
    highlights?: string[];
  };
}

export interface Notification {
  id: string;
  time: string;
  title: string;
  body: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}
