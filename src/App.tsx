import { Routes, Route } from "react-router";
import { DemoProvider, useDemo } from "@/demo/store";
import TopBar from "@/components/TopBar";
import TraderDashboard from "@/pages/TraderDashboard";
import UploadTermSheet from "@/pages/UploadTermSheet";
import AIProcessing from "@/pages/AIProcessing";
import SanctionBlocked from "@/pages/SanctionBlocked";
import CaseWorkspace from "@/pages/CaseWorkspace";
import LaunchDocsReview from "@/pages/LaunchDocsReview";
import OutlookDraft from "@/pages/OutlookDraft";
import LaunchConfirmation from "@/pages/LaunchConfirmation";
import OpsDashboard from "@/pages/OpsDashboard";
import CodeTemplateReview from "@/pages/CodeTemplateReview";
import InternalUpload from "@/pages/InternalUpload";
import BondRoute from "@/pages/BondRoute";
import AuditTrail from "@/pages/AuditTrail";
import CaseList from "@/pages/CaseList";
import ProductCodeList from "@/pages/ProductCodeList";

function Shell() {
  const d = useDemo();

  const page = (() => {
    switch (d.page) {
      case "dashboard": return <TraderDashboard />;
      case "upload": return <UploadTermSheet />;
      case "processing": return <AIProcessing />;
      case "sanctionBlocked": return <SanctionBlocked />;
      case "caseWorkspace": return <CaseWorkspace />;
      case "launchDocs": return <LaunchDocsReview />;
      case "outlook": return <OutlookDraft />;
      case "launchConfirmation": return <LaunchConfirmation />;
      case "opsDashboard": return <OpsDashboard />;
      case "codeReview": return <CodeTemplateReview />;
      case "internalUpload": return <InternalUpload />;
      case "bondRoute": return <BondRoute />;
      case "auditTrail": return <AuditTrail />;
      case "cases": return <CaseList />;
      case "productCodes": return <ProductCodeList />;
      default: return <TraderDashboard />;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-demo-mist/60 via-background to-background">
      <TopBar />
      <main className="max-w-[1440px] mx-auto px-6 py-7 pb-16">{page}</main>
      <footer className="border-t border-demo-line py-5">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between text-[12.5px] text-slate-400">
          <span>Portfolio Demo — AI Product Launch Workbench · Demonstration build</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Routes>
        <Route path="*" element={<Shell />} />
      </Routes>
    </DemoProvider>
  );
}
