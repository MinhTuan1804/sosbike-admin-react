import { useEffect, useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig, AppConfig } from "./configTypes";
import { __CONFIG_STORAGE_KEY__, loadConfig, saveConfig } from "./configStorage";
import { getAppConfig, getConfigVersions, rollbackConfig, saveAppConfig, ConfigVersionResponse } from "./configApi";
import { Modal } from "../../shared/components/Modal";
import { Cloud, Coins, Palette, Sliders, AlertTriangle, Globe, Key, Eye, EyeOff } from "lucide-react";

function formatDateTime(isoString: string | null | undefined) {
  if (!isoString) return "Chưa rõ";
  try {
    let dateStr = isoString.trim();
    // Nếu chuỗi ISO không có chỉ định múi giờ, thêm 'Z' để trình duyệt hiểu là UTC và tự chuyển sang giờ địa phương (ICT)
    if (!dateStr.endsWith("Z") && !dateStr.includes("+") && dateStr.includes("T")) {
      dateStr += "Z";
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return isoString;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  } catch {
    return isoString;
  }
}

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
  const [showGoongKey, setShowGoongKey] = useState(false);

  // Dialog State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

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
      setSavedAt(new Date().toLocaleTimeString());
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

  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmModalOpen(true);
  }

  async function onRollback(versionId: string) {
    triggerConfirm(`Bạn có chắc chắn muốn rollback cấu hình hệ thống về phiên bản [${versionId}] không?`, async () => {
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
    });
  }

  function onApplyJson() {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText) as AppConfig;
      const normalized = AppConfigSchema.parse(parsed);
      setDraftConfig(normalized);
      setJsonDirty(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON không đúng chuẩn schema.");
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
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Cấu hình hệ thống</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Quản lý phí sàn, tỷ lệ hoa hồng thợ, giao diện app và các công tắc kiểm soát hoạt động.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn" onClick={loadFromDb} disabled={loading}>
            {loading ? "Đang tải..." : "Reload cấu hình"}
          </button>
          <button className="btn btn--primary" onClick={onSaveToDb} disabled={loading || hasValidationError}>
            Lưu cài đặt vào DB
          </button>
        </div>
      </div>

      {/* Connection and Sync Status Alert */}
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--neutral-bg)", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Cloud size={24} style={{ color: "var(--primary)" }} />
          <div>
            <div style={{ fontWeight: "700", fontSize: "13px" }}>Trạng thái đồng bộ cơ sở dữ liệu</div>
            <div style={{ fontSize: "11px", color: "var(--text-light)" }}>Đồng bộ lần cuối: {formatDateTime(dbUpdatedAt)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn--sm" onClick={onResetDefault}>Reset Default</button>
          <button className="btn btn--sm" onClick={onLoadLocal}>Tải bản backup local</button>
        </div>
      </div>

      {/* Error and Alert Message Banners */}
      {error && (
        <div style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid var(--danger)", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
          <b>Lỗi đồng bộ:</b> {error}
        </div>
      )}

      {hasValidationError && (
        <div style={{ color: "var(--warning)", background: "var(--warning-bg)", border: "1px solid var(--warning)", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
          <b>Cảnh báo:</b> Có một vài giá trị nhập vào chưa đúng định dạng. Hãy kiểm tra các ô màu đỏ trước khi lưu.
        </div>
      )}

      {/* Config Grid Panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Column: Form Settings */}
        <div style={{ display: "grid", gap: "24px" }}>
          
          {/* 1. Platform Settings */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Coins size={18} style={{ color: "var(--primary)" }} />
              <span>Cấu hình Phí & Chiết khấu</span>
            </h3>
            
            <div style={{ display: "grid", gap: "16px" }}>
              <div className="form-group">
                <label>Phí sàn mặc định (%)</label>
                <input
                  type="number"
                  className="input"
                  value={draftConfig.platform.defaultPlatformFeeRate}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      platform: { ...draftConfig.platform, defaultPlatformFeeRate: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("platform.defaultPlatformFeeRate") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("platform.defaultPlatformFeeRate")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Tỷ lệ hoa hồng chia sẻ cho Thợ mặc định (%)</label>
                <input
                  type="number"
                  className="input"
                  value={draftConfig.platform.mechanicCommissionDefault}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      platform: { ...draftConfig.platform, mechanicCommissionDefault: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("platform.mechanicCommissionDefault") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("platform.mechanicCommissionDefault")}</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. UI App Settings */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Palette size={18} style={{ color: "var(--primary)" }} />
              <span>Cấu hình Giao diện Khách hàng</span>
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              <div className="form-group">
                <label>Tên thương hiệu ứng dụng (Brand Name)</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.ui.brandName}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      ui: { ...draftConfig.ui, brandName: e.target.value }
                    })
                  }
                />
                {fieldError("ui.brandName") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("ui.brandName")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Đường dẫn hình nền trang chủ (Home Background URL)</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.ui.homeBackgroundUrl}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      ui: { ...draftConfig.ui, homeBackgroundUrl: e.target.value }
                    })
                  }
                />
                {fieldError("ui.homeBackgroundUrl") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("ui.homeBackgroundUrl")}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                <div className="form-group">
                  <label>Màu nền App</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: "12px", padding: "6px" }}
                      value={draftConfig.ui.appBackgroundColor ?? "#FFFFFF"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appBackgroundColor: e.target.value }
                        })
                      }
                    />
                    <input
                      type="color"
                      style={{ width: "38px", height: "38px", padding: "1px", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", background: "none", flexShrink: 0 }}
                      value={draftConfig.ui.appBackgroundColor?.match(/^#([0-9a-fA-F]{3}){1,2}$/) ? draftConfig.ui.appBackgroundColor : "#FFFFFF"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appBackgroundColor: e.target.value }
                        })
                      }
                    />
                  </div>
                  {fieldError("ui.appBackgroundColor") && (
                    <span style={{ color: "var(--danger)", fontSize: "10px" }}>{fieldError("ui.appBackgroundColor")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Màu Bottom Navbar</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: "12px", padding: "6px" }}
                      value={draftConfig.ui.appNavbarBottomColor ?? "#D02121"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appNavbarBottomColor: e.target.value }
                        })
                      }
                    />
                    <input
                      type="color"
                      style={{ width: "38px", height: "38px", padding: "1px", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", background: "none", flexShrink: 0 }}
                      value={draftConfig.ui.appNavbarBottomColor?.match(/^#([0-9a-fA-F]{3}){1,2}$/) ? draftConfig.ui.appNavbarBottomColor : "#D02121"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appNavbarBottomColor: e.target.value }
                        })
                      }
                    />
                  </div>
                  {fieldError("ui.appNavbarBottomColor") && (
                    <span style={{ color: "var(--danger)", fontSize: "10px" }}>{fieldError("ui.appNavbarBottomColor")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Màu Header Appbar</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: "12px", padding: "6px" }}
                      value={draftConfig.ui.appNavbarHeaderColor ?? "#D02121"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appNavbarHeaderColor: e.target.value }
                        })
                      }
                    />
                    <input
                      type="color"
                      style={{ width: "38px", height: "38px", padding: "1px", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", background: "none", flexShrink: 0 }}
                      value={draftConfig.ui.appNavbarHeaderColor?.match(/^#([0-9a-fA-F]{3}){1,2}$/) ? draftConfig.ui.appNavbarHeaderColor : "#D02121"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          ui: { ...draftConfig.ui, appNavbarHeaderColor: e.target.value }
                        })
                      }
                    />
                  </div>
                  {fieldError("ui.appNavbarHeaderColor") && (
                    <span style={{ color: "var(--danger)", fontSize: "10px" }}>{fieldError("ui.appNavbarHeaderColor")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Third-Party Integrations */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Key size={18} style={{ color: "var(--primary)" }} />
              <span>Tích hợp Bên thứ ba</span>
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              <div className="form-group">
                <label>Goong Map API Key</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showGoongKey ? "text" : "password"}
                    className="input"
                    style={{ paddingRight: "40px" }}
                    value={draftConfig.thirdParty?.goongApiKey ?? ""}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        thirdParty: { ...draftConfig.thirdParty, goongApiKey: e.target.value }
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoongKey(!showGoongKey)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                  >
                    {showGoongKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldError("thirdParty.goongApiKey") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.goongApiKey")}</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Landing Page Settings */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={18} style={{ color: "var(--primary)" }} />
              <span>Cấu hình Landing Page</span>
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              <div className="form-group">
                <label>Hotline hiển thị</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.landingPage?.hotline ?? ""}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      landingPage: { ...draftConfig.landingPage, hotline: e.target.value }
                    })
                  }
                />
                {fieldError("landingPage.hotline") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("landingPage.hotline")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Facebook Fanpage URL</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.landingPage?.facebookUrl ?? ""}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      landingPage: { ...draftConfig.landingPage, facebookUrl: e.target.value }
                    })
                  }
                />
                {fieldError("landingPage.facebookUrl") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("landingPage.facebookUrl")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Link tải ứng dụng App Store (iOS)</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.landingPage?.appStoreUrl ?? ""}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      landingPage: { ...draftConfig.landingPage, appStoreUrl: e.target.value }
                    })
                  }
                />
                {fieldError("landingPage.appStoreUrl") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("landingPage.appStoreUrl")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Link tải ứng dụng Google Play (Android)</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.landingPage?.googlePlayUrl ?? ""}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      landingPage: { ...draftConfig.landingPage, googlePlayUrl: e.target.value }
                    })
                  }
                />
                {fieldError("landingPage.googlePlayUrl") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("landingPage.googlePlayUrl")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Đường dẫn hình nền Landing Page (Background URL)</label>
                <input
                  type="text"
                  className="input"
                  value={draftConfig.landingPage?.backgroundImageUrl ?? ""}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      landingPage: { ...draftConfig.landingPage, backgroundImageUrl: e.target.value }
                    })
                  }
                />
                {fieldError("landingPage.backgroundImageUrl") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("landingPage.backgroundImageUrl")}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div className="form-group">
                  <label>Màu chủ đạo (Primary Color)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: "12px", padding: "6px" }}
                      value={draftConfig.landingPage?.primaryColor ?? "#DA251D"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          landingPage: { ...draftConfig.landingPage, primaryColor: e.target.value }
                        })
                      }
                    />
                    <input
                      type="color"
                      style={{ width: "38px", height: "38px", padding: "1px", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", background: "none", flexShrink: 0 }}
                      value={draftConfig.landingPage?.primaryColor?.match(/^#([0-9a-fA-F]{3}){1,2}$/) ? draftConfig.landingPage.primaryColor : "#DA251D"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          landingPage: { ...draftConfig.landingPage, primaryColor: e.target.value }
                        })
                      }
                    />
                  </div>
                  {fieldError("landingPage.primaryColor") && (
                    <span style={{ color: "var(--danger)", fontSize: "10px" }}>{fieldError("landingPage.primaryColor")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Màu phụ (Secondary Color)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: "12px", padding: "6px" }}
                      value={draftConfig.landingPage?.secondaryColor ?? "#3B82F6"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          landingPage: { ...draftConfig.landingPage, secondaryColor: e.target.value }
                        })
                      }
                    />
                    <input
                      type="color"
                      style={{ width: "38px", height: "38px", padding: "1px", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", background: "none", flexShrink: 0 }}
                      value={draftConfig.landingPage?.secondaryColor?.match(/^#([0-9a-fA-F]{3}){1,2}$/) ? draftConfig.landingPage.secondaryColor : "#3B82F6"}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          landingPage: { ...draftConfig.landingPage, secondaryColor: e.target.value }
                        })
                      }
                    />
                  </div>
                  {fieldError("landingPage.secondaryColor") && (
                    <span style={{ color: "var(--danger)", fontSize: "10px" }}>{fieldError("landingPage.secondaryColor")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Flags & Previews */}
        <div style={{ display: "grid", gap: "24px" }}>
          
          {/* 3. Feature Flags Switch Toggles (Premium Micro-interactions) */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={18} style={{ color: "var(--primary)" }} />
              <span>Công tắc chức năng hệ thống (Feature Flags)</span>
            </h3>

            <div style={{ display: "grid", gap: "14px" }}>
              
              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Bảo trì hệ thống (Maintenance Mode)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Khóa ứng dụng và hiện banner bảo trì</div>
                </div>
                <label className="switch">
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
                  <span className="slider" />
                </label>
              </div>

              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Chức năng SOS Khẩn cấp (SOS Button)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Hiển thị nút gọi khẩn cấp trên app</div>
                </div>
                <label className="switch">
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
                  <span className="slider" />
                </label>
              </div>

              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Đăng ký Khách hàng mới (Customer Gate)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cho phép khách hàng tạo mới tài khoản</div>
                </div>
                <label className="switch">
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
                  <span className="slider" />
                </label>
              </div>

              <div className="flex-between" style={{ padding: "4px 0" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Đăng ký Thợ sửa xe mới (Mechanic Gate)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cho phép thợ nộp hồ sơ xin việc trên app</div>
                </div>
                <label className="switch">
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
                  <span className="slider" />
                </label>
              </div>

            </div>
          </div>

          {/* 4. Mock Screen Background Preview */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--secondary)" }}>Mockup Giao diện ứng dụng</h3>
            
            <div style={{ width: "100%", height: "180px", position: "relative", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", background: "#1e293b", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {draftConfig.ui.homeBackgroundUrl ? (
                <img
                  src={draftConfig.ui.homeBackgroundUrl}
                  alt="Homebg mockup"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
                />
              ) : (
                <span style={{ color: "#94a3b8" }}>Chưa cấu hình ảnh nền</span>
              )}
              
              {/* Brand Floating Badge mockup */}
              <div style={{ position: "absolute", left: "16px", bottom: "16px", padding: "8px 14px", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", borderRadius: "var(--radius-md)", color: "#fff", fontWeight: "700", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                {draftConfig.ui.brandName || "SOSBIKE App"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced: Raw JSON Panel */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "var(--secondary)" }}>Cấu hình nâng cao (Raw JSON Editor)</h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          Chỉ chỉnh sửa nội dung bên dưới khi bạn hiểu rõ cấu trúc dữ liệu cấu hình. Bấm Apply JSON trước khi Lưu cài đặt.
        </p>

        <textarea
          className="textarea"
          style={{ fontFamily: "monospace", fontSize: "13px", background: "#0f172a", color: "#38bdf8", border: "1px solid #1e293b" }}
          rows={12}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setJsonDirty(true);
          }}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button className="btn btn--sm" onClick={onApplyJson}>Áp dụng thay đổi JSON</button>
          <button className="btn btn--sm" onClick={onFormatJson}>Tự động Định dạng</button>
          {jsonError && (
            <span style={{ color: "var(--danger)", fontSize: "12px", alignSelf: "center", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={14} /> {jsonError}
            </span>
          )}
        </div>
      </div>

      {/* Version History Log Timeline */}
      <div className="card" style={{ padding: "20px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--secondary)" }}>Lịch sử chỉnh sửa cài đặt</h3>
          <button className="btn btn--sm" onClick={loadVersions} disabled={versionsLoading}>
            {versionsLoading ? "Đang tải..." : "Tải lại lịch sử"}
          </button>
        </div>

        {versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-light)" }}>Chưa ghi nhận lịch sử chỉnh sửa cấu hình nào.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {versions.map((ver) => (
              <div
                key={ver.versionId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "var(--neutral-bg)"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>ID phiên bản: <code>{ver.versionId}</code></div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Người cập nhật: <b>{ver.createdBy ?? "Hệ thống"}</b> • Thời gian: {formatDateTime(ver.createdAt)}
                  </div>
                </div>
                <button className="btn btn--sm btn--primary" onClick={() => onRollback(ver.versionId)}>Rollback lại bản này</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận Rollback cấu hình"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>Hủy bỏ</button>
            <button
              className="btn btn--primary"
              onClick={() => {
                if (confirmAction) confirmAction.onConfirm();
                setConfirmModalOpen(false);
              }}
            >
              Đồng ý Rollback
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <AlertTriangle size={28} style={{ color: "var(--warning)" }} />
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
            {confirmAction?.message}
          </div>
        </div>
      </Modal>

    </div>
  );
}
