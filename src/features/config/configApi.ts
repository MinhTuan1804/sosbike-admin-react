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

