import { AppConfig, AppConfigSchema, defaultConfig } from "./configTypes";

const KEY = "sosbike_admin_config_v1";

export function loadConfig(): AppConfig {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultConfig;
  try {
    return AppConfigSchema.parse(JSON.parse(raw));
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export const __CONFIG_STORAGE_KEY__ = KEY;
