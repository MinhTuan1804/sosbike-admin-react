import { http } from "../../shared/http";
import type { PagedResponse } from "./servicesGaragesApi";

export type MechanicServiceListItem = {
  mechanicServiceId: number;
  mechanicId: string;
  mechanicName: string;
  mechanicPhone: string;
  serviceName: string;
  description: string | null;
  laborFee: number;
  status: string;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
};

export async function listMechanicServices(params: {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await http.get<PagedResponse<MechanicServiceListItem>>("/admin/mechanic-services", { params });
  return res.data;
}

export async function approveMechanicService(mechanicServiceId: number) {
  const res = await http.post(`/admin/mechanic-services/${mechanicServiceId}/approve`, {});
  return res.data;
}

export async function rejectMechanicService(mechanicServiceId: number, reason?: string) {
  const res = await http.post(`/admin/mechanic-services/${mechanicServiceId}/reject`, { reason });
  return res.data;
}
