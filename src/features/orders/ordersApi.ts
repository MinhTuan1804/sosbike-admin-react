import { z } from "zod";
import { http } from "../../shared/http";

const OrderListItemSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  createdAt: z.string().nullable().optional(),
  acceptedAt: z.string().nullable().optional(),
  arrivedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  requestAddress: z.string(),
  customerNote: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
  customerId: z.string(),
  customerPhone: z.string(),
  customerName: z.string(),
  mechanicId: z.string().nullable().optional(),
  mechanicPhone: z.string().nullable().optional(),
  mechanicName: z.string().nullable().optional(),
  totalAmount: z.number().nullable().optional()
});

const PagedSchema = z.object({
  items: z.array(OrderListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
});

export async function listOrders(params: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const resp = await http.get("/admin/orders", { params });
  return PagedSchema.parse(resp.data);
}

