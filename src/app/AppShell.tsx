import { NavLink, Outlet } from "react-router-dom";
import "./shell.css";
import { clearAccessToken } from "../features/auth/authStorage";

const navItems: Array<{ to: string; label: string }> = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/orders", label: "Đơn cứu hộ" },
  { to: "/finance", label: "Tài chính & Ví" },
  { to: "/membership", label: "Gói & Quyền lợi" },
  { to: "/services", label: "Dịch vụ & Garage" },
  { to: "/reviews", label: "Đánh giá" },
  { to: "/users", label: "Tài khoản" },
  { to: "/activity-logs", label: "Nhật ký hoạt động" },
  { to: "/config", label: "Config" }
];

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__title">SOSBIKE</div>
          <div className="brand__sub">Admin</div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav__item nav__item--active" : "nav__item")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar__title">SOSBIKE Admin</div>
          <div className="topbar__meta">
            <code>{import.meta.env.VITE_API_BASE_URL ?? "(no VITE_API_BASE_URL)"}</code>
            <button
              style={{ marginLeft: 12 }}
              onClick={() => {
                clearAccessToken();
                window.location.href = "/login";
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
