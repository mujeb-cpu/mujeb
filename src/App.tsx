import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { PublicLayout } from "@/layouts/public-layout";
import { MerchantLayout } from "@/layouts/merchant-layout";
import { CustomerLayout } from "@/layouts/customer-layout";
import { LandingPage } from "@/pages/landing";
import { AuthPage } from "@/pages/auth";
import { PrivacyPage, TermsPage } from "@/pages/legal";
import { OnboardingPage } from "@/pages/onboarding";
import { OverviewPage } from "@/pages/overview";
import { PolicyListPage } from "@/pages/policies/list";
import { PolicyNewPage } from "@/pages/policies/new";
import { PolicyReviewPage } from "@/pages/policies/review";
import { CaseListPage } from "@/pages/cases/list";
import { CaseDetailPage } from "@/pages/cases/detail";
import { IntegrationsPage } from "@/pages/integrations";
import { SettingsPage } from "@/pages/settings";
import { ReturnVerifyPage } from "@/pages/return/verify";
import { ReturnDetailsPage } from "@/pages/return/details";
import { ReturnResultPage } from "@/pages/return/result";
import { NotFoundPage } from "@/pages/not-found";
import { RequireMerchantAccess } from "@/components/auth-provider";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        <Route element={<CustomerLayout />}>
          <Route path="/return" element={<ReturnVerifyPage />} />
          <Route path="/return/details" element={<ReturnDetailsPage />} />
          <Route path="/return/result" element={<ReturnResultPage />} />
        </Route>

        <Route element={<RequireMerchantAccess />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/app" element={<MerchantLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="policies" element={<PolicyListPage />} />
            <Route path="policies/new" element={<PolicyNewPage />} />
            <Route path="policies/review/:draftId" element={<PolicyReviewPage />} />
            <Route path="cases" element={<CaseListPage />} />
            <Route path="cases/:caseId" element={<CaseDetailPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
