import { useEffect, useMemo, useState } from "react";
import { AppConfigSchema, defaultConfig, AppConfig } from "./configTypes";
import { __CONFIG_STORAGE_KEY__, loadConfig, saveConfig } from "./configStorage";
import { getAppConfig, getConfigVersions, rollbackConfig, saveAppConfig, ConfigVersionResponse } from "./configApi";
import { Modal } from "../../shared/components/Modal";
import { Cloud, Coins, Palette, Sliders, AlertTriangle, Globe, Key, Eye, EyeOff, RefreshCw, Save, Wrench, Database, Wallet, Moon } from "lucide-react";

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
  const [versions, setVersions] = useState<ConfigVersionResponse[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [showGoongKey, setShowGoongKey] = useState(false);
  const [showGoogleMapKey, setShowGoogleMapKey] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);
  const [showPayOsApiKey, setShowPayOsApiKey] = useState(false);
  const [showPayOsChecksumKey, setShowPayOsChecksumKey] = useState(false);
  const [showEsmsApiKey, setShowEsmsApiKey] = useState(false);
  const [showEsmsSecretKey, setShowEsmsSecretKey] = useState(false);

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

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>Cấu hình hệ thống</h1>
          <p>Quản lý phí sàn, tỷ lệ hoa hồng thợ, giao diện app và các công tắc kiểm soát hoạt động.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--ghost" onClick={loadFromDb} disabled={loading}>
            <RefreshCw size={14} />
            {loading ? "Đang tải..." : "Reload cấu hình"}
          </button>
          <button className="btn btn--primary" onClick={onSaveToDb} disabled={loading || hasValidationError}>
            <Save size={14} />
            Lưu cài đặt vào DB
          </button>
        </div>
      </div>

      {/* Connection and Sync Status Alert */}
      <div className="card" style={{ padding: "16px" }}>
        <div className="flex-between">
          <div className="flex-gap" style={{ alignItems: "center" }}>
            <Cloud size={24} style={{ color: "var(--primary)" }} />
            <div>
              <div style={{ fontWeight: "700", fontSize: "13px" }}>Trạng thái đồng bộ cơ sở dữ liệu</div>
              <div style={{ fontSize: "11px", color: "var(--text-light)" }}>
                Đồng bộ lần cuối: {formatDateTime(dbUpdatedAt)}
                {savedAt && <span style={{ marginLeft: "8px", color: "var(--success)" }}>• Đã lưu lúc {savedAt}</span>}
              </div>
            </div>
          </div>
          <div className="flex-gap gap-8">
            <button className="btn btn--sm" onClick={onResetDefault}>Reset Default</button>
            <button className="btn btn--sm" onClick={onLoadLocal}>Tải bản backup local</button>
          </div>
        </div>
      </div>

      {/* Error and Alert Message Banners */}
      {error && (
        <div style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid var(--danger)", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} />
          <span><b>Lỗi đồng bộ:</b> {error}</span>
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
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Coins size={18} style={{ color: "var(--primary)" }} />
                Cấu hình Phí &amp; Chiết khấu
              </h2>
            </div>
            
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
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Palette size={18} style={{ color: "var(--primary)" }} />
                Cấu hình Giao diện Khách hàng
              </h2>
            </div>

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
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Key size={18} style={{ color: "var(--primary)" }} />
                Tích hợp Bên thứ ba
              </h2>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              
              {/* SECTION: MAPS */}
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--primary)", marginBottom: "12px" }}>Cấu hình Bản đồ (Maps API)</div>
                <div style={{ display: "grid", gap: "12px" }}>
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

                  <div className="form-group">
                    <label>Google Map API Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showGoogleMapKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.googleMapApiKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, googleMapApiKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowGoogleMapKey(!showGoogleMapKey)}
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
                        {showGoogleMapKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.googleMapApiKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.googleMapApiKey")}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: RESEND EMAIL */}
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--primary)", marginBottom: "12px" }}>Cấu hình Email (Resend)</div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="form-group">
                    <label>Resend API Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showResendApiKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.resendApiKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, resendApiKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendApiKey(!showResendApiKey)}
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
                        {showResendApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.resendApiKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.resendApiKey")}</span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Email gửi đi (From Email)</label>
                      <input
                        type="text"
                        className="input"
                        value={draftConfig.thirdParty?.resendFromEmail ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, resendFromEmail: e.target.value }
                          })
                        }
                      />
                      {fieldError("thirdParty.resendFromEmail") && (
                        <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.resendFromEmail")}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Tên người gửi (From Name)</label>
                      <input
                        type="text"
                        className="input"
                        value={draftConfig.thirdParty?.resendFromName ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, resendFromName: e.target.value }
                          })
                        }
                      />
                      {fieldError("thirdParty.resendFromName") && (
                        <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.resendFromName")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: PAYOS */}
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--primary)", marginBottom: "12px" }}>Cổng thanh toán payOS</div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="form-group">
                    <label>payOS Client ID</label>
                    <input
                      type="text"
                      className="input"
                      value={draftConfig.thirdParty?.payOsClientId ?? ""}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          thirdParty: { ...draftConfig.thirdParty, payOsClientId: e.target.value }
                        })
                      }
                    />
                    {fieldError("thirdParty.payOsClientId") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.payOsClientId")}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>payOS API Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showPayOsApiKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.payOsApiKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, payOsApiKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPayOsApiKey(!showPayOsApiKey)}
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
                        {showPayOsApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.payOsApiKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.payOsApiKey")}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>payOS Checksum Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showPayOsChecksumKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.payOsChecksumKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, payOsChecksumKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPayOsChecksumKey(!showPayOsChecksumKey)}
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
                        {showPayOsChecksumKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.payOsChecksumKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.payOsChecksumKey")}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: ESMS SMS */}
              <div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--primary)", marginBottom: "12px" }}>Dịch vụ gửi SMS (ESMS)</div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="form-group">
                    <label>ESMS API Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showEsmsApiKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.esmsApiKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, esmsApiKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowEsmsApiKey(!showEsmsApiKey)}
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
                        {showEsmsApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.esmsApiKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.esmsApiKey")}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>ESMS Secret Key</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showEsmsSecretKey ? "text" : "password"}
                        className="input"
                        style={{ paddingRight: "40px" }}
                        value={draftConfig.thirdParty?.esmsSecretKey ?? ""}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            thirdParty: { ...draftConfig.thirdParty, esmsSecretKey: e.target.value }
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowEsmsSecretKey(!showEsmsSecretKey)}
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
                        {showEsmsSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldError("thirdParty.esmsSecretKey") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.esmsSecretKey")}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Tên Brandname hiển thị (Brandname)</label>
                    <input
                      type="text"
                      className="input"
                      value={draftConfig.thirdParty?.esmsBrandName ?? ""}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          thirdParty: { ...draftConfig.thirdParty, esmsBrandName: e.target.value }
                        })
                      }
                    />
                    {fieldError("thirdParty.esmsBrandName") && (
                      <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("thirdParty.esmsBrandName")}</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Landing Page Settings */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Globe size={18} style={{ color: "var(--primary)" }} />
                Cấu hình Landing Page
              </h2>
            </div>

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
          
          {/* Feature Flags Switch Toggles */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Sliders size={18} style={{ color: "var(--primary)" }} />
                Công tắc chức năng hệ thống (Feature Flags)
              </h2>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              
              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Bảo trì hệ thống (Maintenance Mode)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Khóa ứng dụng và hiện banner bảo trì</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: draftConfig.featureFlags.maintenanceMode ? "var(--success)" : "var(--text-muted)" }}>
                    {draftConfig.featureFlags.maintenanceMode ? "Bật" : "Tắt"}
                  </span>
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
              </div>

              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Chức năng SOS Khẩn cấp (SOS Button)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Hiển thị nút gọi khẩn cấp trên app</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: draftConfig.featureFlags.sosEnabled ? "var(--success)" : "var(--text-muted)" }}>
                    {draftConfig.featureFlags.sosEnabled ? "Bật" : "Tắt"}
                  </span>
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
              </div>

              <div className="flex-between" style={{ padding: "4px 0", borderBottom: "1px solid var(--neutral-bg)" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Đăng ký Khách hàng mới (Customer Gate)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cho phép khách hàng tạo mới tài khoản</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: draftConfig.featureFlags.customerRegisterEnabled ? "var(--success)" : "var(--text-muted)" }}>
                    {draftConfig.featureFlags.customerRegisterEnabled ? "Bật" : "Tắt"}
                  </span>
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
              </div>

              <div className="flex-between" style={{ padding: "4px 0" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Đăng ký Thợ sửa xe mới (Mechanic Gate)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cho phép thợ nộp hồ sơ xin việc trên app</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: draftConfig.featureFlags.mechanicRegisterEnabled ? "var(--success)" : "var(--text-muted)" }}>
                    {draftConfig.featureFlags.mechanicRegisterEnabled ? "Bật" : "Tắt"}
                  </span>
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
          </div>

          {/* Rescue Settings */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Wrench size={18} style={{ color: "var(--primary)" }} />
                Cấu hình Cứu hộ (Rescue)
              </h2>
            </div>
            
            <div style={{ display: "grid", gap: "12px" }}>
              <div className="form-group">
                <label>Bán kính tìm kiếm thợ cứu hộ (km)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={draftConfig.rescue?.matchingRadiusKm ?? 30}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      rescue: { ...draftConfig.rescue, matchingRadiusKm: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("rescue.matchingRadiusKm") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.matchingRadiusKm")}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Chờ thợ nhận đơn (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.pendingTimeoutMinutes ?? 5}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, pendingTimeoutMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.pendingTimeoutMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.pendingTimeoutMinutes")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Chờ thợ đến nơi tối đa (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.acceptedTimeoutMinutes ?? 45}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, acceptedTimeoutMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.acceptedTimeoutMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.acceptedTimeoutMinutes")}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Nhắc thợ di chuyển (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.acceptedReminderMinutes ?? 30}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, acceptedReminderMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.acceptedReminderMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.acceptedReminderMinutes")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Nhắc thợ khi đã đến nơi (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.arrivedReminderMinutes ?? 30}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, arrivedReminderMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.arrivedReminderMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.arrivedReminderMinutes")}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Cảnh báo thợ đến trễ (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.arrivedAlertAdminMinutes ?? 60}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, arrivedAlertAdminMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.arrivedAlertAdminMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.arrivedAlertAdminMinutes")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Cảnh báo sửa chữa lâu (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.repairingAlertAdminMinutes ?? 180}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, repairingAlertAdminMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.repairingAlertAdminMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.repairingAlertAdminMinutes")}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Nhắc thợ báo giá (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.quotingReminderMinutes ?? 15}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, quotingReminderMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.quotingReminderMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.quotingReminderMinutes")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Chờ thợ báo giá tối đa (phút)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.rescue?.quotingTimeoutMinutes ?? 30}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rescue: { ...draftConfig.rescue, quotingTimeoutMinutes: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("rescue.quotingTimeoutMinutes") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("rescue.quotingTimeoutMinutes")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log Settings */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Database size={18} style={{ color: "var(--primary)" }} />
                Sao lưu Nhật ký (Activity Log)
              </h2>
            </div>
            
            <div style={{ display: "grid", gap: "14px" }}>
              <div className="flex-between" style={{ padding: "4px 0" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Bật sao lưu nhật ký hoạt động (Drive Backup)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tự động sao lưu dữ liệu nhật ký lên Google Drive</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: (draftConfig.activityLog?.backupEnabled ?? true) ? "var(--success)" : "var(--text-muted)" }}>
                    {(draftConfig.activityLog?.backupEnabled ?? true) ? "Bật" : "Tắt"}
                  </span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={draftConfig.activityLog?.backupEnabled ?? true}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          activityLog: { ...draftConfig.activityLog, backupEnabled: e.target.checked }
                        })
                      }
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Chu kỳ sao lưu nhật ký (ngày)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.activityLog?.backupIntervalDays ?? 14}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        activityLog: { ...draftConfig.activityLog, backupIntervalDays: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("activityLog.backupIntervalDays") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("activityLog.backupIntervalDays")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Chu kỳ kiểm tra sao lưu (giờ)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.activityLog?.checkIntervalHours ?? 24}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        activityLog: { ...draftConfig.activityLog, checkIntervalHours: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("activityLog.checkIntervalHours") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("activityLog.checkIntervalHours")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Settings */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Wallet size={18} style={{ color: "var(--primary)" }} />
                Cấu hình Ví &amp; Giao dịch
              </h2>
            </div>
            
            <div style={{ display: "grid", gap: "12px" }}>
              <div className="form-group">
                <label>Số tiền rút tối thiểu mỗi lần (VND)</label>
                <input
                  type="number"
                  className="input"
                  value={draftConfig.wallet?.minWithdrawAmount ?? 50000}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      wallet: { ...draftConfig.wallet, minWithdrawAmount: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("wallet.minWithdrawAmount") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("wallet.minWithdrawAmount")}</span>
                )}
              </div>

              <div className="form-group">
                <label>Số tiền rút tối đa hàng ngày (VND)</label>
                <input
                  type="number"
                  className="input"
                  value={draftConfig.wallet?.maxDailyWithdrawAmount ?? 5000000}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      wallet: { ...draftConfig.wallet, maxDailyWithdrawAmount: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("wallet.maxDailyWithdrawAmount") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("wallet.maxDailyWithdrawAmount")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Night Surcharge Settings */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
                <Moon size={18} style={{ color: "var(--primary)" }} />
                Phụ thu ban đêm cho cứu hộ
              </h2>
            </div>
            
            <div style={{ display: "grid", gap: "14px" }}>
              <div className="flex-between" style={{ padding: "4px 0" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>Bật phụ thu ban đêm (Night Surcharge)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tự động cộng thêm phụ thu cho các đơn cứu hộ ban đêm</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: (draftConfig.nightSurcharge?.nightSurchargeEnabled ?? true) ? "var(--success)" : "var(--text-muted)" }}>
                    {(draftConfig.nightSurcharge?.nightSurchargeEnabled ?? true) ? "Bật" : "Tắt"}
                  </span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={draftConfig.nightSurcharge?.nightSurchargeEnabled ?? true}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          nightSurcharge: { ...draftConfig.nightSurcharge, nightSurchargeEnabled: e.target.checked }
                        })
                      }
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Giờ bắt đầu phụ thu (0-23)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.nightSurcharge?.nightStartHour ?? 22}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        nightSurcharge: { ...draftConfig.nightSurcharge, nightStartHour: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("nightSurcharge.nightStartHour") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("nightSurcharge.nightStartHour")}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Giờ kết thúc phụ thu (0-23)</label>
                  <input
                    type="number"
                    className="input"
                    value={draftConfig.nightSurcharge?.nightEndHour ?? 5}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        nightSurcharge: { ...draftConfig.nightSurcharge, nightEndHour: Number(e.target.value) }
                      })
                    }
                  />
                  {fieldError("nightSurcharge.nightEndHour") && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("nightSurcharge.nightEndHour")}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Số tiền phụ thu thêm (VND)</label>
                <input
                  type="number"
                  className="input"
                  value={draftConfig.nightSurcharge?.nightSurchargeFee ?? 25000}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      nightSurcharge: { ...draftConfig.nightSurcharge, nightSurchargeFee: Number(e.target.value) }
                    })
                  }
                />
                {fieldError("nightSurcharge.nightSurchargeFee") && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>{fieldError("nightSurcharge.nightSurchargeFee")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mock Screen Background Preview */}
          <div className="card">
            <h3 className="card__title" style={{ marginBottom: "12px" }}>Mockup Giao diện ứng dụng</h3>
            
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

      {/* Version History Log Timeline */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <div className="section-header" style={{ margin: 0 }}>
            <h2>Lịch sử chỉnh sửa cài đặt</h2>
          </div>
          <button className="btn btn--sm btn--ghost" onClick={loadVersions} disabled={versionsLoading}>
            <RefreshCw size={13} />
            {versionsLoading ? "Đang tải..." : "Tải lại lịch sử"}
          </button>
        </div>

        {versions.length === 0 ? (
          <div className="empty-state">Chưa ghi nhận lịch sử chỉnh sửa cấu hình nào.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {versions.map((ver) => (
              <div
                key={ver.versionId}
                className="flex-between"
                style={{
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
          <div className="flex-gap">
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
        <div className="flex-gap" style={{ alignItems: "center" }}>
          <AlertTriangle size={28} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
            {confirmAction?.message}
          </div>
        </div>
      </Modal>

    </div>
  );
}
