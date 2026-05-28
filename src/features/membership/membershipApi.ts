import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SubscriptionPlanListItem = {
  planId: number;
  planName: string;
  targetAudience: string; // B2C/B2B/DRIVER
  price: number;
  durationDays: number;
  platformFeeRate: number | null;
  isDeleted: boolean;
  createdAt: string | null;
};

export type BenefitListItem = {
  benefitId: number;
  benefitCode: string;
  benefitName: string;
  description: string | null;
};

export type PlanDetail = {
  planId: number;
  planName: string;
  targetAudience: string;
  price: number;
  durationDays: number;
  description: string | null;
  platformFeeRate: number | null;
  isDeleted: boolean;
  createdAt: string | null;
  deletedAt: string | null;
  benefits: Array<{
    planBenefitId: number;
    benefitId: number;
    benefitCode: string;
    benefitName: string;
    benefitValue: number | null;
    usageLimit: number | null;
  }>;
};

export async function listPlans(params: {
  q?: string;
  targetAudience?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const res = await http.get<PagedResponse<SubscriptionPlanListItem>>("/admin/membership/plans", { params });
  return res.data;
}

export async function getPlan(planId: number) {
  const res = await http.get<PlanDetail>(`/admin/membership/plans/${planId}`);
  return res.data;
}

export async function createPlan(payload: {
  planName: string;
  targetAudience: string;
  price: number;
  durationDays: number;
  description?: string;
  platformFeeRate?: number | null;
}) {
  const res = await http.post<{ planId: number }>("/admin/membership/plans", payload);
  return res.data;
}

export async function updatePlan(planId: number, payload: any) {
  await http.patch(`/admin/membership/plans/${planId}`, payload);
}

export async function deletePlan(planId: number) {
  await http.delete(`/admin/membership/plans/${planId}`);
}

export async function listBenefits(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await http.get<PagedResponse<BenefitListItem>>("/admin/membership/benefits", { params });
  return res.data;
}

export async function createBenefit(payload: { benefitCode: string; benefitName: string; description?: string }) {
  const res = await http.post<{ benefitId: number }>("/admin/membership/benefits", payload);
  return res.data;
}

export async function updateBenefit(benefitId: number, payload: any) {
  await http.patch(`/admin/membership/benefits/${benefitId}`, payload);
}

export async function deleteBenefit(benefitId: number) {
  await http.delete(`/admin/membership/benefits/${benefitId}`);
}

export async function upsertPlanBenefit(
  planId: number,
  benefitId: number,
  payload: { benefitValue?: number | null; usageLimit?: number | null }
) {
  await http.put(`/admin/membership/plans/${planId}/benefits/${benefitId}`, payload);
}

export async function removePlanBenefit(planId: number, benefitId: number) {
  await http.delete(`/admin/membership/plans/${planId}/benefits/${benefitId}`);
}

