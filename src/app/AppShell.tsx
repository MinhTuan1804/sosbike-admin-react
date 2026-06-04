import { NavLink, Outlet } from "react-router-dom";
import "./shell.css";
import { clearAccessToken } from "../features/auth/authStorage";

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Core",
    items: [
      { to: "/dashboard", label: "Overview", icon: "📊" }
    ]
  },
  {
    title: "Operations",
    items: [
      { to: "/orders", label: "Đơn cứu hộ", icon: "🚨" },
      { to: "/services", label: "Dịch vụ & Garage", icon: "🔧" },
      { to: "/reviews", label: "Đánh giá & Review", icon: "💬" },
      { to: "/blogs", label: "Blog", icon: "📝" }
    ]
  },
  {
    title: "Finance & Wallet",
    items: [
      { to: "/finance", label: "Tài chính & Ví", icon: "💳" }
    ]
  },
  {
    title: "Business Model",
    items: [
      { to: "/membership", label: "Gói & Quyền lợi", icon: "🎟️" }
    ]
  },
  {
    title: "Management",
    items: [
      { to: "/users", label: "Tài khoản", icon: "👤" },
      { to: "/verify-mechanics", label: "Duyệt hồ sơ thợ", icon: "📋" },
      { to: "/config", label: "Cấu hình hệ thống", icon: "⚙️" }
    ]
  }
];

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand__title">
              <span style={{ color: "var(--primary)" }}>✦</span> SOSBIKE
            </div>
            <div className="brand__sub">Enterprise Admin</div>
          </div>
          <nav className="nav">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="nav__group-title">{group.title}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? "nav__item nav__item--active" : "nav__item"
                    }
                  >
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
        
        <div style={{ padding: "12px", borderTop: "1px solid var(--border-color)", marginTop: "16px" }}>
          <button
            className="btn btn--danger"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              clearAccessToken();
              window.location.href = "/login";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      
      <main className="main">
        <header className="topbar">
          <div className="topbar__title">SOSBIKE Control Panel</div>
          <div className="topbar__meta">
            <div className="flex-gap">
              <span className="badge badge--success" style={{ textTransform: "none", fontSize: "10px" }}>
                ● API Online
              </span>
              <code>{import.meta.env.VITE_API_BASE_URL ?? "(no VITE_API_BASE_URL)"}</code>
            </div>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
