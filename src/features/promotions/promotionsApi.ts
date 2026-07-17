import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PromotionVoucherListItem = {
  promotionVoucherId: string;
  userId: string;
  phoneNumber: string;
  fullName: string;
  userType: string;
  voucherCode: string;
  voucherName: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minimumOrderValue: number | null;
  applicableArea: string;
  quantityTotal: number;
  quantityUsed: number;
  remainingQuantity: number;
  status: string;
  sourceType: string;
  grantedByUserId: string | null;
  grantedReason: string | null;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type GrantPromotionVoucherRequest = {
  userId?: string | null;
  phoneNumber?: string | null;
  recipientMode?: string;
  userIds?: string[];
  phoneNumbers?: string[];
  voucherCode: string;
  voucherName: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minimumOrderValue?: number | null;
  applicableArea: string;
  quantityTotal?: number;
  validDays?: number;
  validFrom?: string | null;
  validTo?: string | null;
  grantedReason?: string | null;
};

export async function listPromotionVouchers(params: {
  q?: string;
  userType?: string;
  status?: string;
  sourceType?: string;
  page?: number;
  pageSize?: number;
}) {
  const resp = await http.get<PagedResponse<PromotionVoucherListItem>>("/admin/promotions/vouchers", { params });
  return resp.data;
}

export async function grantPromotionVoucher(payload: GrantPromotionVoucherRequest) {
  const resp = await http.post("/admin/promotions/vouchers", payload);
  return resp.data as { voucherId: string; userId: string };
}

export async function revokePromotionVoucher(voucherId: string, reason?: string) {
  await http.delete(`/admin/promotions/vouchers/${voucherId}`, {
    data: { reason: reason ?? null }
  });
}
