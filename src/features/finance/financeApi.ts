import { z } from "zod";
import { http } from "../../shared/http";

const PagedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    pageSize: z.number()
  });

const WalletSchema = z.object({
  walletId: z.string(),
  userId: z.string(),
  userType: z.string(),
  phoneNumber: z.string(),
  fullName: z.string(),
  balance: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  isBankVerified: z.boolean(),
  dailyWithdrawLimit: z.number().nullable().optional(),
  lastUpdated: z.string().nullable().optional()
});

const TxSchema = z.object({
  transactionId: z.string(),
  walletId: z.string(),
  userId: z.string(),
  phoneNumber: z.string(),
  fullName: z.string(),
  amount: z.number(),
  flowType: z.string(),
  transactionType: z.string(),
  balanceBefore: z.number(),
  balanceAfter: z.number(),
  referenceOrderId: z.string().nullable().optional(),
  paymentId: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

const WithdrawReqSchema = z.object({
  requestId: z.string(),
  walletId: z.string(),
  userId: z.string(),
  phoneNumber: z.string(),
  fullName: z.string(),
  amount: z.number(),
  status: z.string(),
  note: z.string().nullable().optional(),
  requestedAt: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional()
});

export async function listWallets(params: { q?: string; userType?: string; page?: number; pageSize?: number }) {
  const resp = await http.get("/admin/finance/wallets", { params });
  return PagedSchema(WalletSchema).parse(resp.data);
}

export async function listTransactions(params: {
  walletId?: string;
  type?: string;
  flow?: string;
  page?: number;
  pageSize?: number;
}) {
  const resp = await http.get("/admin/finance/transactions", { params });
  return PagedSchema(TxSchema).parse(resp.data);
}

export async function listWithdrawRequests(params: { status?: string; page?: number; pageSize?: number }) {
  const resp = await http.get("/admin/finance/withdraw-requests", { params });
  return PagedSchema(WithdrawReqSchema).parse(resp.data);
}

export async function approveWithdraw(requestId: string, note?: string) {
  await http.post(`/admin/finance/withdraw-requests/${requestId}/approve`, { note: note ?? null });
}

export async function rejectWithdraw(requestId: string, note?: string) {
  await http.post(`/admin/finance/withdraw-requests/${requestId}/reject`, { note: note ?? null });
}

