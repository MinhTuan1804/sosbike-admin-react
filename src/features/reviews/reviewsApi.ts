import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReviewListItem = {
  reviewId: string;
  orderId: string;
  rating: number | null;
  comment: string | null;
  createdAt: string | null;
  isHidden: boolean;
  customerId: string;
  customerPhoneNumber: string;
  customerFullName: string;
  mechanicId: string;
  mechanicPhoneNumber: string;
  mechanicFullName: string;
};

export async function listReviews(params: {
  q?: string;
  rating?: number;
  includeHidden?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const res = await http.get<PagedResponse<ReviewListItem>>("/admin/reviews", { params });
  return res.data;
}

export async function setReviewVisibility(reviewId: string, isHidden: boolean) {
  await http.patch(`/admin/reviews/${reviewId}/visibility`, { isHidden });
}

