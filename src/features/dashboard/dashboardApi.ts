import { http } from "../../shared/http";

export type DashboardOverviewResponse = {
  range: { from: string; to: string; days: number };
  kpis: {
    totalPayments: number;
    totalSubscriptionPayments: number;
    totalRescuePayments: number;
    totalNewCustomers: number;
    totalNewMechanics: number;
    totalOrders: number;
    totalOrdersCompleted: number;
    totalOrdersCancelled: number;
    avgAcceptMins: number;
    avgArriveMins: number;
    avgCompleteMins: number;
  };
  series: {
    labels: string[];
    revenue: { subscription: number[]; rescueOrder: number[]; total: number[] };
    users: { customers: number[]; mechanics: number[]; admins: number[] };
    orders: { total: number[]; completed: number[]; cancelled: number[] };
  };
};

export async function getDashboardOverview(params?: { from?: string; to?: string }) {
  const res = await http.get<DashboardOverviewResponse>("/admin/dashboard/overview", { params });
  return res.data;
}

export async function exportDashboardOverview(params?: { from?: string; to?: string }) {
  const res = await http.get("/admin/dashboard/export", {
    params,
    responseType: "blob"
  });
  return res.data;
}

