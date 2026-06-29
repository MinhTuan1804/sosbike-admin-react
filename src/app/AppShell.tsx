import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  Activity,
  Zap,
  LogOut,
  LucideIcon,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown
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
    title: "Tổng quan",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "Vận hành",
    items: [
      { to: "/orders",   label: "Đơn cứu hộ",       icon: Flame },
      { to: "/services", label: "Dịch vụ & Garage",  icon: Wrench },
      { to: "/reviews",  label: "Đánh giá & Review", icon: MessageSquare },
      { to: "/blogs",    label: "Blog",               icon: FileText }
    ]
  },
  {
    title: "Tài chính",
    items: [
      { to: "/finance",    label: "Tài chính & Ví",  icon: Wallet },
      { to: "/membership", label: "Gói & Quyền lợi", icon: Ticket }
    ]
  },
  {
    title: "Quản lý",
    items: [
      { to: "/users",            label: "Tài khoản",         icon: User },
      { to: "/verify-mechanics", label: "Duyệt hồ sơ thợ",  icon: ClipboardCheck },
      { to: "/activity-logs",    label: "Nhật ký hoạt động", icon: Activity },
      { to: "/config",           label: "Cấu hình hệ thống", icon: Settings }
    ]
  }
];

// Map route → breadcrumb label
const routeLabels: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/orders":           "Đơn cứu hộ",
  "/services":         "Dịch vụ & Garage",
  "/reviews":          "Đánh giá & Review",
  "/blogs":            "Blog",
  "/finance":          "Tài chính & Ví",
  "/membership":       "Gói & Quyền lợi",
  "/users":            "Tài khoản",
  "/verify-mechanics": "Duyệt hồ sơ thợ",
  "/activity-logs":    "Nhật ký hoạt động",
  "/config":           "Cấu hình hệ thống"
};

export function AppShell() {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] ?? "Admin";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }

  function handleLogout() {
    clearAccessToken();
    window.location.href = "/login";
  }

  return (
    <div className={isCollapsed ? "shell shell--collapsed" : "shell"}>
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Scrollable nav area */}
        <div className="sidebar__inner">
          {/* Brand */}
          <div className="brand">
            <div className="brand__logo">
              <div className="brand__icon" aria-hidden="true">
                <Zap size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="brand__title">SOSBIKE</div>
                <div className="brand__sub">Enterprise Admin</div>
              </div>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="nav" aria-label="Main navigation">
            {navGroups.map((group) => (
              <div className="nav__group" key={group.title}>
                <div className="nav__group-title" aria-hidden="true">{group.title}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        isActive ? "nav__item nav__item--active" : "nav__item"
                      }
                      aria-label={item.label}
                    >
                      <span className="nav__item-icon" aria-hidden="true">
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer: user info + logout */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden="true">AD</div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">Admin</div>
              <div className="sidebar__user-role">Super Admin</div>
            </div>
            {!isCollapsed && <ChevronDown size={14} style={{ opacity: 0.5 }} />}
          </div>
          <button
            className="btn btn--ghost"
            style={{
              width: "100%",
              justifyContent: isCollapsed ? "center" : "flex-start",
              color: "var(--sidebar-nav-color)",
              gap: "10px",
              fontSize: "13px",
              height: "36px",
              padding: isCollapsed ? "0" : "0 10px"
            }}
            onClick={handleLogout}
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={15} strokeWidth={2} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="main" style={{ minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header className="topbar" role="banner">
          <div className="topbar__left">
            <button 
              className="topbar__toggle" 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              aria-label="Thu gọn/Mở rộng sidebar"
              title="Thu gọn/Mở rộng sidebar"
            >
              <Menu size={15} />
            </button>
            <div className="topbar__breadcrumb">
              <span>SOSBIKE</span>
              <ChevronRight size={14} aria-hidden="true" style={{ color: "var(--text-light)" }} />
              <strong>{currentLabel}</strong>
            </div>
          </div>
          <div className="topbar__right">
            {/* Search Input Mock */}
            <div className="topbar__search-mock" title="Tìm kiếm (Chức năng mô phỏng)">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Search size={14} style={{ color: "var(--text-muted)" }} />
                <span>Tìm kiếm...</span>
              </div>
              <kbd className="topbar__search-kbd">⌘K</kbd>
            </div>

            {/* Dark Mode Switcher */}
            <button 
              className="topbar__icon-btn" 
              onClick={toggleTheme} 
              aria-label="Đổi chủ đề" 
              title={theme === "light" ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng"}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Notification Bell Mock */}
            <button className="topbar__icon-btn" aria-label="Thông báo" title="Thông báo (Chức năng mô phỏng)">
              <Bell size={15} />
            </button>

            <div className="topbar__status" aria-label="Trạng thái API: Online" title={import.meta.env.VITE_API_BASE_URL ?? "(no VITE_API_BASE_URL)"}>
              API Online
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content" style={{ overflowX: "hidden" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
