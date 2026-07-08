import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./shell.css";
import { http } from "../shared/http";
import axios from "axios";
import { clearAccessToken } from "../features/auth/authStorage";
import {
  AdminNotificationItem,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../features/notifications/notificationsApi";
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
  const navigate = useNavigate();
  const currentLabel = routeLabels[location.pathname] ?? "Admin";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [isApiOnline, setIsApiOnline] = useState(true);
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

  useEffect(() => {
    async function checkApiStatus() {
      try {
        await http.get("/config/app");
        setIsApiOnline(true);
      } catch (err: any) {
        if (axios.isAxiosError(err) && !err.response) {
          setIsApiOnline(false);
        } else {
          setIsApiOnline(true);
        }
      }
    }

    void checkApiStatus();
    const timerId = window.setInterval(() => {
      void checkApiStatus();
    }, 15_000);

    const reqInterceptor = http.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    );

    const resInterceptor = http.interceptors.response.use(
      (response) => {
        setIsApiOnline(true);
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error) && !error.response) {
          setIsApiOnline(false);
        } else {
          setIsApiOnline(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      window.clearInterval(timerId);
      http.interceptors.request.eject(reqInterceptor);
      http.interceptors.response.eject(resInterceptor);
    };
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleLogoutInactivity();
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      const data = await listMyNotifications(10);
      setNotifications(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleNotificationClick(item: AdminNotificationItem) {
    if (!item.isRead) {
      await markNotificationRead(item.notificationId);
      await loadNotifications();
    }

    const target = resolveAdminNotificationUrl(item.actionUrl);
    if (target) {
      setNotificationOpen(false);
      navigate(target);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await loadNotifications();
  }

  function toggleTheme() {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }

  function handleLogout() {
    clearAccessToken();
    window.location.href = "/login";
  }

  function handleLogoutInactivity() {
    clearAccessToken();
    window.location.href = "/login?reason=inactivity";
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

            <div className="topbar__notifications" ref={notificationRef}>
              <button
                className="topbar__icon-btn topbar__icon-btn--notification"
                aria-label="Thông báo"
                title="Thông báo"
                onClick={() => setNotificationOpen(prev => !prev)}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="topbar__notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="notification-popover" role="dialog" aria-label="Thông báo admin">
                  <div className="notification-popover__header">
                    <div>
                      <div className="notification-popover__title">Thông báo</div>
                      <div className="notification-popover__subtitle">Tự động lưu tối đa 7 ngày</div>
                    </div>
                    <button
                      className="notification-popover__action"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                    >
                      Đã đọc
                    </button>
                  </div>

                  <div className="notification-popover__list">
                    {notificationsLoading ? (
                      <div className="notification-popover__empty">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-popover__empty">Chưa có thông báo mới.</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.notificationId}
                          className={
                            item.isRead
                              ? "notification-popover__item"
                              : "notification-popover__item notification-popover__item--unread"
                          }
                          onClick={() => void handleNotificationClick(item)}
                        >
                          <span className="notification-popover__dot" aria-hidden="true" />
                          <span className="notification-popover__body">
                            <span className="notification-popover__item-title">{item.title}</span>
                            <span className="notification-popover__item-content">{item.content}</span>
                            <span className="notification-popover__item-time">
                              {formatNotificationTime(item.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`topbar__status ${isApiOnline ? "" : "topbar__status--offline"}`}
              aria-label={`Trạng thái API: ${isApiOnline ? "Online" : "Offline"}`}
              title={import.meta.env.VITE_API_BASE_URL ?? "(no VITE_API_BASE_URL)"}
            >
              {isApiOnline ? "API Online" : "API Offline"}
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

function formatNotificationTime(value?: string | null) {
  if (!value) return "";
  let str = value.trim();
  if (!str.endsWith("Z") && !str.includes("+") && str.includes("T")) {
    str += "Z";
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function resolveAdminNotificationUrl(actionUrl?: string | null) {
  if (!actionUrl) return null;

  if (actionUrl.startsWith("/admin/finance")) return "/finance";
  if (actionUrl.startsWith("/users/verify-mechanics")) return "/verify-mechanics";
  if (actionUrl.startsWith("/admin/")) return actionUrl.replace(/^\/admin/, "") || "/dashboard";
  if (actionUrl.startsWith("/")) return actionUrl;

  return null;
}
