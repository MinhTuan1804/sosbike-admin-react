import { useEffect, useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig, AppConfig } from "./configTypes";
import { __CONFIG_STORAGE_KEY__, loadConfig, saveConfig } from "./configStorage";
import { getAppConfig, getConfigVersions, rollbackConfig, saveAppConfig, ConfigVersionResponse } from "./configApi";

export function ConfigPage() {
  const localInitial = useMemo(() => loadConfig(), []);
  const [draftConfig, setDraftConfig] = useState<AppConfig>(localInitial);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dbUpdatedAt, setDbUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(localInitial, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonDirty, setJsonDirty] = useState(false);
  const [versions, setVersions] = useState<ConfigVersionResponse[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const validation = useMemo(() => AppConfigSchema.safeParse(draftConfig), [draftConfig]);
  const validationErrors = useMemo(() => {
    if (validation.success) return {};
    const errors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) errors[key] = issue.message;
    }
    return errors;
  }, [validation]);
  const hasValidationError = !validation.success;

  function fieldError(path: string) {
    return validationErrors[path];
  }

  async function loadFromDb() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAppConfig();
      setDbUpdatedAt(res.updatedAt);
      const parsed = AppConfigSchema.parse(res.config);
      setDraftConfig(parsed);
      // Backup to localStorage for offline debug.
      saveConfig(parsed);
      await loadVersions();
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

  useEffect(() => {
    if (jsonDirty) return;
    setJsonText(JSON.stringify(draftConfig, null, 2));
  }, [draftConfig, jsonDirty]);

  async function onSaveToDb() {
    setError(null);
    setLoading(true);
    try {
      if (!validation.success) {
        setError("Config không hợp lệ, vui lòng kiểm tra các trường bị lỗi.");
        return;
      }
      await saveAppConfig(validation.data);
      saveConfig(validation.data);
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

  async function loadVersions() {
    setVersionsLoading(true);
    try {
      const items = await getConfigVersions(20);
      setVersions(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được lịch sử cấu hình");
    } finally {
      setVersionsLoading(false);
    }
  }

  async function onRollback(versionId: string) {
    const ok = window.confirm("Bạn có chắc muốn rollback về phiên bản này?");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      await rollbackConfig(versionId);
      await loadFromDb();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rollback thất bại");
    } finally {
      setLoading(false);
    }
  }

  function onApplyJson() {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText) as AppConfig;
      const normalized = AppConfigSchema.parse(parsed);
      setDraftConfig(normalized);
      setJsonDirty(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON không hợp lệ.");
    }
  }

  function onFormatJson() {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonDirty(false);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON không hợp lệ.");
    }
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
        <button onClick={onSaveToDb} disabled={loading || hasValidationError}>
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

      {hasValidationError ? (
        <div style={{ color: "#b45309" }}>
          <strong>Cảnh báo:</strong> Có trường chưa hợp lệ. Hãy sửa trước khi lưu.
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
            {fieldError("platform.defaultPlatformFeeRate") ? (
              <span style={{ color: "crimson", fontSize: 12 }}>{fieldError("platform.defaultPlatformFeeRate")}</span>
            ) : null}
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
            {fieldError("platform.mechanicCommissionDefault") ? (
              <span style={{ color: "crimson", fontSize: 12 }}>{fieldError("platform.mechanicCommissionDefault")}</span>
            ) : null}
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
            {fieldError("ui.homeBackgroundUrl") ? (
              <span style={{ color: "crimson", fontSize: 12 }}>{fieldError("ui.homeBackgroundUrl")}</span>
            ) : null}
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
            {fieldError("ui.brandName") ? (
              <span style={{ color: "crimson", fontSize: 12 }}>{fieldError("ui.brandName")}</span>
            ) : null}
          </label>
        </fieldset>

        <fieldset style={{ display: "flex", flexDirection: "column", gap: 12, padding: 15 }}>
          <legend style={{ fontWeight: "bold" }}>Feature Flags</legend>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={draftConfig.featureFlags.maintenanceMode}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  featureFlags: { ...draftConfig.featureFlags, maintenanceMode: e.target.checked }
                })
              }
            />
            Maintenance mode (hiển thị banner bảo trì)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={draftConfig.featureFlags.sosEnabled}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  featureFlags: { ...draftConfig.featureFlags, sosEnabled: e.target.checked }
                })
              }
            />
            SOS enabled (hiện nút SOS)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={draftConfig.featureFlags.customerRegisterEnabled}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  featureFlags: { ...draftConfig.featureFlags, customerRegisterEnabled: e.target.checked }
                })
              }
            />
            Customer registration enabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={draftConfig.featureFlags.mechanicRegisterEnabled}
              onChange={(e) =>
                setDraftConfig({
                  ...draftConfig,
                  featureFlags: { ...draftConfig.featureFlags, mechanicRegisterEnabled: e.target.checked }
                })
              }
            />
            Mechanic registration enabled
          </label>
        </fieldset>

        <fieldset style={{ display: "flex", flexDirection: "column", gap: 12, padding: 15 }}>
          <legend style={{ fontWeight: "bold" }}>Preview</legend>
          <div
            style={{
              width: "100%",
              height: 180,
              borderRadius: 12,
              overflow: "hidden",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              position: "relative"
            }}
          >
            {draftConfig.ui.homeBackgroundUrl ? (
              <img
                src={draftConfig.ui.homeBackgroundUrl}
                alt="Home background preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: 12
                }}
              >
                Chưa có ảnh nền
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: 12,
                padding: "6px 10px",
                background: "rgba(0,0,0,0.45)",
                borderRadius: 8,
                color: "white",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {draftConfig.ui.brandName || "Brand Name"}
            </div>
          </div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Preview này mô phỏng nền + brandName trên home customer.
          </div>
        </fieldset>
      </div>

      <details style={{ marginTop: 20 }}>
        <summary>Advanced: Raw JSON</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, maxWidth: 800 }}>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonDirty(true);
            }}
            rows={16}
            style={{ width: "100%", fontFamily: "monospace", padding: 10 }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onApplyJson} disabled={loading}>
              Apply JSON
            </button>
            <button onClick={onFormatJson} disabled={loading}>
              Format JSON
            </button>
          </div>
          {jsonError ? <div style={{ color: "crimson" }}>{jsonError}</div> : null}
        </div>
      </details>

      <details style={{ marginTop: 20 }}>
        <summary>Version history</summary>
        <div style={{ marginTop: 10 }}>
          <button onClick={loadVersions} disabled={versionsLoading || loading}>
            {versionsLoading ? "Đang tải..." : "Reload history"}
          </button>
        </div>
        {versions.length === 0 ? (
          <div style={{ color: "#6b7280", marginTop: 10 }}>Chưa có lịch sử.</div>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {versions.map((item) => (
              <div
                key={item.versionId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <div>
                    <strong>{item.versionId}</strong>
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {item.createdAt ?? "-"} • {item.createdBy ?? "-"}
                  </div>
                </div>
                <button onClick={() => onRollback(item.versionId)} disabled={loading}>
                  Rollback
                </button>
              </div>
            ))}
          </div>
        )}
      </details>
    </div>
  );
}
