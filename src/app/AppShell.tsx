import { NavLink, Outlet } from "react-router-dom";
import "./shell.css";
import { clearAccessToken } from "../features/auth/authStorage";
import {
  LayoutDashboard,
  Flame,
  Wrench,
  MessageSquare,
  FileText,
  Wallet,
  Ticket,
  User,
  ClipboardCheck,
  Settings,
  Sparkles,
  LucideIcon
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Core",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard }
    ]
  },
  {
    title: "Operations",
    items: [
      { to: "/orders", label: "Đơn cứu hộ", icon: Flame },
      { to: "/services", label: "Dịch vụ & Garage", icon: Wrench },
      { to: "/reviews", label: "Đánh giá & Review", icon: MessageSquare },
      { to: "/blogs", label: "Blog", icon: FileText }
    ]
  },
  {
    title: "Finance & Wallet",
    items: [
      { to: "/finance", label: "Tài chính & Ví", icon: Wallet }
    ]
  },
  {
    title: "Business Model",
    items: [
      { to: "/membership", label: "Gói & Quyền lợi", icon: Ticket }
    ]
  },
  {
    title: "Management",
    items: [
      { to: "/users", label: "Tài khoản", icon: User },
      { to: "/verify-mechanics", label: "Duyệt hồ sơ thợ", icon: ClipboardCheck },
      { to: "/config", label: "Cấu hình hệ thống", icon: Settings }
    ]
  }
];

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand__title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} style={{ color: "var(--primary)" }} />
              <span>SOSBIKE</span>
            </div>
            <div className="brand__sub">Enterprise Admin</div>
          </div>
          <nav className="nav">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="nav__group-title">{group.title}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        isActive ? "nav__item nav__item--active" : "nav__item"
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
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
