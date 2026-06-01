import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithPassword } from "./authApi";
import { setAccessToken } from "./authStorage";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("0982815244");
  const [password, setPassword] = useState("123456");
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1>Đăng nhập Admin</h1>
      <p style={{ color: "#64748b" }}>Dùng API `POST /api/Auth/login`.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Số điện thoại</span>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        {error ? (
          <div style={{ color: "crimson" }}>
            <strong>Lỗi:</strong> {error}
          </div>
        ) : null}
      </form>
    </div>
  );
}
