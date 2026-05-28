import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OrdersPage } from "../features/orders/OrdersPage";
import { FinancePage } from "../features/finance/FinancePage";
import { MembershipPage } from "../features/membership/MembershipPage";
import { ServicesGaragesPage } from "../features/services/ServicesGaragesPage";
import { ReviewsPage } from "../features/reviews/ReviewsPage";
import { ConfigPage } from "../features/config/ConfigPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RequireAuth } from "../features/auth/RequireAuth";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/services" element={<ServicesGaragesPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
