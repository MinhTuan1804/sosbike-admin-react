import { useEffect, useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig, AppConfig } from "./configTypes";
import { __CONFIG_STORAGE_KEY__, loadConfig, saveConfig } from "./configStorage";
import { getAppConfig, saveAppConfig } from "./configApi";

export function ConfigPage() {
  const localInitial = useMemo(() => loadConfig(), []);
  const [draftConfig, setDraftConfig] = useState<AppConfig>(localInitial);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dbUpdatedAt, setDbUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadFromDb() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAppConfig();
      setDbUpdatedAt(res.updatedAt);
      setDraftConfig(res.config);
      // Backup to localStorage for offline debug.
      saveConfig(res.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được config từ DB");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveToDb() {
    setError(null);
    setLoading(true);
    try {
      const parsed = AppConfigSchema.parse(draftConfig);
      await saveAppConfig(parsed);
      saveConfig(parsed);
      setSavedAt(new Date().toLocaleString());
      await loadFromDb();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Config không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  function onResetDefault() {
    setDraftConfig(defaultConfig);
    setError(null);
  }

  function onLoadLocal() {
    setDraftConfig(loadConfig());
    setError(null);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1>Config</h1>
      <p style={{ margin: 0, color: "#555" }}>
        Tab này để cấu hình mọi thứ trong app (phí sàn, UI...). Config được <b>lưu DB</b> qua API. LocalStorage chỉ là bản
        backup ở máy admin (<code>{__CONFIG_STORAGE_KEY__}</code>).
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={loadFromDb} disabled={loading}>
          {loading ? "Đang tải..." : "Reload từ DB"}
        </button>
        <button onClick={onSaveToDb} disabled={loading}>
          Lưu vào DB
        </button>
        <button onClick={onResetDefault} disabled={loading}>
          Reset mặc định
        </button>
        <button onClick={onLoadLocal} disabled={loading}>
          Load local backup
        </button>
        <span style={{ color: "#666" }}>
          DB updatedAt: <code>{dbUpdatedAt ?? "-"}</code>
        </span>
        {savedAt ? (
          <span style={{ color: "#666" }}>
            Đã lưu: <code>{savedAt}</code>
          </span>
        ) : null}
      </div>

      {error ? (
        <div style={{ color: "crimson" }}>
          <strong>Lỗi:</strong> {error}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10, maxWidth: 600 }}>
        <fieldset style={{ display: "flex", flexDirection: "column", gap: 15, padding: 15 }}>
          <legend style={{ fontWeight: "bold" }}>Platform Settings</legend>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            Default Platform Fee Rate (%)
            <input
              type="number"
              style={{ padding: 8 }}
              value={draftConfig.platform.defaultPlatformFeeRate}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  platform: { ...draftConfig.platform, defaultPlatformFeeRate: Number(e.target.value) }
                })
              }
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            Mechanic Commission Default (%)
            <input
              type="number"
              style={{ padding: 8 }}
              value={draftConfig.platform.mechanicCommissionDefault}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  platform: { ...draftConfig.platform, mechanicCommissionDefault: Number(e.target.value) }
                })
              }
            />
          </label>
        </fieldset>

        <fieldset style={{ display: "flex", flexDirection: "column", gap: 15, padding: 15 }}>
          <legend style={{ fontWeight: "bold" }}>UI Settings</legend>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            Home Background URL
            <input
              type="text"
              style={{ padding: 8 }}
              value={draftConfig.ui.homeBackgroundUrl}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  ui: { ...draftConfig.ui, homeBackgroundUrl: e.target.value }
                })
              }
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            Brand Name
            <input
              type="text"
              style={{ padding: 8 }}
              value={draftConfig.ui.brandName}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  ui: { ...draftConfig.ui, brandName: e.target.value }
                })
              }
            />
          </label>
        </fieldset>
      </div>

      <details style={{ marginTop: 20 }}>
        <summary>Advanced: Raw JSON</summary>
        <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 5 }}>
          {JSON.stringify(draftConfig, null, 2)}
        </pre>
      </details>
    </div>
  );
}

