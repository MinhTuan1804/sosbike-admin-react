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


