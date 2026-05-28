import { useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig } from "./configTypes";
import { loadConfig, saveConfig } from "./configStorage";

export function ConfigPage() {
  const initial = useMemo(() => loadConfig(), []);
  const [draftText, setDraftText] = useState(() => JSON.stringify(initial, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function onSave() {
    setError(null);
    try {
      const parsed = AppConfigSchema.parse(JSON.parse(draftText));
      saveConfig(parsed);
      setSavedAt(new Date().toLocaleString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid config");
    }
  }

  function onReset() {
    setDraftText(JSON.stringify(defaultConfig, null, 2));
    setError(null);
  }

  return (
    <div>
      <h1>Config</h1>
      <p>
        Tab này để cấu hình mọi thứ trong app (phí sàn, background, …). Hiện lưu vào{" "}
        <code>localStorage</code>.
      </p>

      <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <button onClick={onSave}>Lưu</button>
        <button onClick={onReset}>Reset mặc định</button>
        {savedAt ? <span>Đã lưu: {savedAt}</span> : null}
      </div>

      {error ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>
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

