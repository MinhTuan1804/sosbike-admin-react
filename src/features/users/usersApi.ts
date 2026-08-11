import { z } from "zod";
import { http } from "../../shared/http";

const UserListItemSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
  fullName: z.string(),
  userType: z.string(),
  isActive: z.boolean(),
  isLocked: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  isVerified: z.boolean().nullable().optional(),
  verifiedAt: z.string().nullable().optional()
});

const PagedSchema = z.object({
  items: z.array(UserListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
});

export type UserListItem = z.infer<typeof UserListItemSchema>;

export async function listUsers(params: { q?: string; userType?: string; page?: number; pageSize?: number }) {
  const resp = await http.get("/admin/users", { params });
  return PagedSchema.parse(resp.data);
}

export async function createUser(payload: {
  phoneNumber: string;
  password: string;
  fullName: string;
  userType: "CUSTOMER" | "MECHANIC" | "ADMIN";
  identityCard?: string;
  licensePlate?: string;
}) {
  const resp = await http.post("/admin/users", payload);
  return resp.data as { userId: string };
}

export async function updateUserFlags(userId: string, flags: { isLocked?: boolean; isActive?: boolean }) {
  await http.patch(`/admin/users/${userId}/flags`, flags);
}

export async function updateWalletStatus(userId: string, payload: { status?: "ACTIVE" | "LOCKED"; resetFailedAttempts?: boolean }) {
  await http.patch(`/admin/users/${userId}/wallet-status`, payload);
}

export async function getUser(userId: string) {
  const resp = await http.get(`/admin/users/${userId}`);
  return resp.data;
}

export async function verifyMechanic(userId: string, isVerified: boolean) {
  await http.post(`/admin/users/${userId}/verify-mechanic`, { isVerified });
}

export async function hardDeleteUser(userId: string) {
  await http.delete(`/admin/users/${userId}/hard`);
}

/**
 * Che mờ số CCCD/CMND: giữ 4 số đầu và 4 số cuối, giữa thay bằng ****
 * Ví dụ: 079200012345 -> 0792****2345
 */
export function maskIdentityCard(id?: string | null): string {
  if (!id || !id.trim()) return "(Chưa cập nhật)";
  const trimmed = id.trim();
  if (trimmed.length <= 6) return trimmed.slice(0, 2) + "****" + trimmed.slice(-2);
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Che mờ số Tài khoản ngân hàng: giữ 4 số cuối
 * Ví dụ: 1234567890 -> ****7890
 */
export function maskBankAccountNumber(accountNo?: string | null): string {
  if (!accountNo || !accountNo.trim()) return "(Chưa cập nhật)";
  const trimmed = accountNo.trim();
  if (trimmed.length <= 4) return "****" + trimmed;
  return "****" + trimmed.slice(-4);
}



