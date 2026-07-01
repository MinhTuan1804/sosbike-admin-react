import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ActivityLogItem = {
  logid: string;
  userid: string | null;
  fullName: string | null;
  eventtype: string;
  phonenumber: string | null;
  usertype: string | null;
  ipaddress: string | null;
  useragent: string | null;
  description: string | null;
  createdat: string;
};

export type ListActivityLogsParams = {
  eventType?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export async function listActivityLogs(params: ListActivityLogsParams) {
  const res = await http.get<PagedResponse<ActivityLogItem>>("/admin/activity-logs", { params });
  return res.data;
}

export type ActivityLogBackupDriveInfo = {
  folderName: string;
  logFolderUrl: string | null;
  parentFolderName: string | null;
  parentFolderUrl: string | null;
};

export async function getActivityLogBackupDrive() {
  const res = await http.get<ActivityLogBackupDriveInfo>("/admin/activity-logs/backup-drive");
  return res.data;
}
