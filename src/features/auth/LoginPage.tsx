import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithPassword } from "./authApi";
import { setAccessToken } from "./authStorage";
import { Phone, Lock, Eye, EyeOff, Bike, ShieldAlert } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("0982815244");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginWithPassword(phoneNumber.trim(), password);
      const userType = data.user?.userType?.toUpperCase() ?? "";
      if (userType && userType !== "ADMIN") {
        setError("Tài khoản không có quyền truy cập admin.");
        return;
      }
      setAccessToken(data.accessToken);
      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--neutral-bg)",
      padding: "16px"
    }}>
      <div className="card" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "32px",
        boxShadow: "var(--shadow-lg)",
        background: "var(--card-bg)"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "48px", 
            height: "48px", 
            borderRadius: "12px", 
            background: "var(--primary-light)", 
            color: "var(--primary)",
            marginBottom: "12px"
          }}>
            <Bike size={28} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>
            SOSBIKE Admin
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px", fontWeight: 500 }}>
            Hệ thống quản trị cứu hộ xe máy
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "20px" }}>
          {/* Phone Input */}
          <div style={{ display: "grid", gap: "6px" }}>
            <label htmlFor="login-phone" style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Số điện thoại
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "14px", color: "var(--text-light)" }}>
                <Phone size={18} />
              </div>
              <input
                id="login-phone"
                type="tel"
                autoComplete="tel"
                placeholder="Nhập số điện thoại"
                className="input"
                style={{ paddingLeft: "42px", minHeight: "44px", fontSize: "14px" }}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: "grid", gap: "6px" }}>
            <label htmlFor="login-password" style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
              Mật khẩu
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "14px", color: "var(--text-light)" }}>
                <Lock size={18} />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="input"
                style={{ paddingLeft: "42px", paddingRight: "44px", minHeight: "44px", fontSize: "14px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "var(--text-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "var(--radius-sm)"
                }}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error ? (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "12px 14px",
              background: "var(--danger-bg)",
              border: "1px solid hsl(0, 84%, 90%)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "13px",
              lineHeight: "1.4"
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Lỗi:</strong> {error}
              </div>
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "44px",
              fontSize: "14px",
              marginTop: "4px",
              boxShadow: "0 2px 4px 0 rgb(59 130 246 / 0.1)"
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập vào Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
