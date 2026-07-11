import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CampaignListItem = {
  campaignId: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
};

export type EmailLogItem = {
  emailLogId: string;
  recipientEmail: string;
  resendEmailId: string | null;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
};

export type CampaignDetailResponse = {
  campaignInfo: {
    campaignId: string;
    name: string;
    subject: string;
    bodyHtml: string;
    status: string;
    createdAt: string;
  };
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplained: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  recipients: PagedResponse<EmailLogItem>;
};

export type CreateCampaignPayload = {
  name: string;
  subject: string;
  bodyHtml: string;
  recipients: string[];
};

export type DashboardStatsResponse = {
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplained: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  chartData: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }[];
};

export async function listCampaigns(page = 1, pageSize = 10) {
  const res = await http.get<PagedResponse<CampaignListItem>>("/admin/email-campaigns", {
    params: { page, pageSize }
  });
  return res.data;
}

export async function getCampaignDetail(
  id: string,
  params?: { status?: string; q?: string; page?: number; pageSize?: number }
) {
  const res = await http.get<CampaignDetailResponse>(`/admin/email-campaigns/${id}`, { params });
  return res.data;
}

export async function createCampaign(payload: CreateCampaignPayload) {
  const res = await http.post<{ campaignId: string; name: string; status: string }>(
    "/admin/email-campaigns",
    payload
  );
  return res.data;
}

export async function getDashboardStats() {
  const res = await http.get<DashboardStatsResponse>("/admin/email-campaigns/dashboard-stats");
  return res.data;
}
