import { http } from "../../shared/http";
import type { AppConfig } from "./configTypes";

export type GetConfigResponse = {
  key: string;
  config: AppConfig;
  updatedAt: string | null;
  updatedBy: string | null;
};

export async function getAppConfig() {
  const res = await http.get<GetConfigResponse>("/admin/config");
  return res.data;
}

export async function saveAppConfig(config: AppConfig) {
  await http.put("/admin/config", { config });
}

export type ConfigVersionResponse = {
  versionId: string;
  createdAt: string | null;
  createdBy: string | null;
  config: AppConfig;
};

export async function getConfigVersions(limit = 20) {
  const res = await http.get<ConfigVersionResponse[]>("/admin/config/versions", {
    params: { limit }
  });
  return res.data;
}

export async function rollbackConfig(versionId: string) {
  await http.post(`/admin/config/rollback/${versionId}`);
}
