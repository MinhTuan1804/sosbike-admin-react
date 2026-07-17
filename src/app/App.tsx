import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { RequireAuth } from "../features/auth/RequireAuth";
import { LoadingProvider, LoadingScreen } from "../shared/components/LoadingScreen";

const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage").then(m => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import("../features/orders/OrdersPage").then(m => ({ default: m.OrdersPage })));
const FinancePage = lazy(() => import("../features/finance/FinancePage").then(m => ({ default: m.FinancePage })));
const PromotionsPage = lazy(() => import("../features/promotions/PromotionsPage").then(m => ({ default: m.PromotionsPage })));
const MembershipPage = lazy(() => import("../features/membership/MembershipPage").then(m => ({ default: m.MembershipPage })));
const ServicesGaragesPage = lazy(() => import("../features/services/ServicesGaragesPage").then(m => ({ default: m.ServicesGaragesPage })));
const ReviewsPage = lazy(() => import("../features/reviews/ReviewsPage").then(m => ({ default: m.ReviewsPage })));
const ConfigPage = lazy(() => import("../features/config/ConfigPage").then(m => ({ default: m.ConfigPage })));
const BlogsPage = lazy(() => import("../features/blogs/BlogsPage").then(m => ({ default: m.BlogsPage })));
const UsersPage = lazy(() => import("../features/users/UsersPage").then(m => ({ default: m.UsersPage })));
const VerifyMechanicsPage = lazy(() => import("../features/users/VerifyMechanicsPage").then(m => ({ default: m.VerifyMechanicsPage })));
const ActivityLogsPage = lazy(() => import("../features/activity-logs/ActivityLogsPage").then(m => ({ default: m.ActivityLogsPage })));
const EmailCampaignsPage = lazy(() => import("../features/email-campaigns/EmailCampaignsPage").then(m => ({ default: m.EmailCampaignsPage })));

export function App() {
  return (
    <LoadingProvider>
      <Suspense fallback={<LoadingScreen message="Đang tải trang..." />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/services" element={<ServicesGaragesPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/verify-mechanics" element={<VerifyMechanicsPage />} />
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
              <Route path="/email-campaigns" element={<EmailCampaignsPage />} />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </LoadingProvider>
  );
}
