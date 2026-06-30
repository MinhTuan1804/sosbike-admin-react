import { http } from "../../shared/http";

export type AdminNotificationItem = {
  notificationId: number;
  userId: string;
  title: string;
  content: string;
  notificationType: string;
  referenceId?: string | null;
  entityType?: string | null;
  actionUrl?: string | null;
  payloadJson?: string | null;
  isRead: boolean;
  createdAt?: string | null;
};

export type AdminNotificationListResponse = {
  items: AdminNotificationItem[];
  unreadCount: number;
  page: number;
  pageSize: number;
};

export async function listMyNotifications(pageSize = 10) {
  const res = await http.get<AdminNotificationListResponse>("/notifications", {
    params: { page: 1, pageSize }
  });
  return res.data;
}

export async function markNotificationRead(notificationId: number) {
  await http.put(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  await http.put("/notifications/read-all");
}
