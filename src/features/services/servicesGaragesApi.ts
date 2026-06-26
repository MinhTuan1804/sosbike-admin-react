import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ServiceListItem = {
  serviceId: number;
  serviceName: string;
  suggestedLaborFee: number;
  description: string | null;
  isDeleted: boolean;
};

export type GarageListItem = {
  garageId: number;
  garageName: string;
  address: string;
  mechanicId: string;
  mechanicPhoneNumber: string;
  mechanicFullName: string;
  isDeleted: boolean;
  createdAt: string | null;
};

export async function listServices(params: { q?: string; includeDeleted?: boolean; page?: number; pageSize?: number }) {
  const res = await http.get<PagedResponse<ServiceListItem>>("/admin/services", { params });
  return res.data;
}

export async function createService(payload: { serviceName: string; description?: string; suggestedLaborFee: number }) {
  const res = await http.post<{ serviceId: number }>("/admin/services", payload);
  return res.data;
}

export async function updateService(serviceId: number, payload: any) {
  await http.patch(`/admin/services/${serviceId}`, payload);
}

export async function deleteService(serviceId: number) {
  await http.delete(`/admin/services/${serviceId}`);
}

export async function listGarages(params: { q?: string; includeDeleted?: boolean; page?: number; pageSize?: number }) {
  const res = await http.get<PagedResponse<GarageListItem>>("/admin/garages", { params });
  return res.data;
}

export async function createGarage(payload: { mechanicId: string; garageName: string; address: string }) {
  const res = await http.post<{ garageId: number }>("/admin/garages", payload);
  return res.data;
}

export async function updateGarage(garageId: number, payload: any) {
  await http.patch(`/admin/garages/${garageId}`, payload);
}

export async function deleteGarage(garageId: number) {
  await http.delete(`/admin/garages/${garageId}`);
}

