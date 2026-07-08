import { FormEvent, useState, useEffect } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("reason") === "inactivity") {
      navigate("/login", { replace: true });
      alert("Phiên làm việc đã hết hạn do bạn không hoạt động lâu. Vui lòng đăng nhập lại.");
    }
  }, [location.search, navigate]);

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
        padding: "36px 32px",
        boxShadow: "var(--shadow-md)",
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-xl)"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "40px", 
            height: "40px", 
            borderRadius: "50%", 
            background: "var(--primary-light)", 
            color: "var(--primary)",
            marginBottom: "16px"
          }}>
            <Bike size={20} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--secondary)", letterSpacing: "-0.02em" }}>
            SOSBIKE Enterprise
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>
            Nhập tài khoản admin để quản trị hệ thống cứu hộ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "16px" }}>
          {/* Phone Input */}
          <div style={{ display: "grid", gap: "6px" }}>
            <label htmlFor="login-phone" style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-main)" }}>
              Số điện thoại
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", color: "var(--text-light)" }}>
                <Phone size={15} />
              </div>
              <input
                id="login-phone"
                type="tel"
                autoComplete="tel"
                placeholder="0982xxxxxx"
                className="input"
                style={{ paddingLeft: "36px", height: "40px", fontSize: "14px" }}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: "grid", gap: "6px" }}>
            <label htmlFor="login-password" style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-main)" }}>
              Mật khẩu
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "12px", color: "var(--text-light)" }}>
                <Lock size={15} />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••"
                className="input"
                style={{ paddingLeft: "36px", paddingRight: "36px", height: "40px", fontSize: "14px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
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
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error ? (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "13px",
              lineHeight: "1.4"
            }}>
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                {error}
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
              height: "40px",
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: 500
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
