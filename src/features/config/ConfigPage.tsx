import { useEffect, useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig } from "./configTypes";
import { __CONFIG_STORAGE_KEY__, loadConfig, saveConfig } from "./configStorage";
import { getAppConfig, saveAppConfig } from "./configApi";

export function ConfigPage() {
  const localInitial = useMemo(() => loadConfig(), []);
  const [draftText, setDraftText] = useState(() => JSON.stringify(localInitial, null, 2));
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
      setDraftText(JSON.stringify(res.config, null, 2));
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
      const parsed = AppConfigSchema.parse(JSON.parse(draftText));
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
    setDraftText(JSON.stringify(defaultConfig, null, 2));
    setError(null);
  }

  function onLoadLocal() {
    setDraftText(JSON.stringify(loadConfig(), null, 2));
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

      <textarea
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: 520,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        }}
      />
    </div>
  );
}

