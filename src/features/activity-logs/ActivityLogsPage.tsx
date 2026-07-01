import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  KeyRound,
  UserCog,
  Wrench,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Wallet,
  Banknote,
  Bike,
  Settings,
  Lock,
  Unlock,
  Package,
  Warehouse,
  BadgeCheck,
  Star,
  ExternalLink,
  FolderOpen
} from "lucide-react";
import { ActivityLogBackupDriveInfo, ActivityLogItem, getActivityLogBackupDrive, listActivityLogs } from "./activityLogsApi";

const PAGE_SIZE = 20;

const EVENT_META: Record<string, { label: string; color: string; bg: string; Icon: typeof LogIn }> = {
  // A. Tài khoản & Xác thực
  LOGIN: { label: "Đăng nhập", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: LogIn },
  LOGIN_FAILED: { label: "Đăng nhập thất bại", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: ShieldAlert },
  REGISTER: { label: "Đăng ký", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: UserPlus },
  LOGOUT: { label: "Đăng xuất", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: LogOut },
  PASSWORD_CHANGE: { label: "Đổi mật khẩu", color: "#7c3aed", bg: "rgba(124,58,237,0.12)", Icon: KeyRound },
  PROFILE_UPDATE: { label: "Cập nhật hồ sơ", color: "#0891b2", bg: "rgba(8,145,178,0.12)", Icon: UserCog },

  // B. Đơn cứu hộ
  ORDER_CREATED: { label: "Tạo đơn cứu hộ", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: Bike },
  ORDER_ACCEPTED: { label: "Thợ nhận đơn", color: "#0891b2", bg: "rgba(8,145,178,0.12)", Icon: Wrench },
  ORDER_ARRIVED: { label: "Thợ đã đến", color: "#0d9488", bg: "rgba(13,148,136,0.12)", Icon: Bike },
  QUOTE_SENT: { label: "Gửi báo giá", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: FileText },
  QUOTE_APPROVED: { label: "Duyệt báo giá", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: CheckCircle2 },
  ORDER_COMPLETED: { label: "Hoàn thành đơn", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: CheckCircle2 },
  ORDER_CANCELLED: { label: "Hủy đơn", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: XCircle },

  // C. Thanh toán & Ví
  PAYMENT_CREATED: { label: "Tạo thanh toán", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: CreditCard },
  PAYMENT_SUCCESS: { label: "Thanh toán thành công", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: CreditCard },
  WALLET_DEPOSIT: { label: "Nạp ví", color: "#0891b2", bg: "rgba(8,145,178,0.12)", Icon: Wallet },
  WITHDRAW_REQUESTED: { label: "Yêu cầu rút tiền", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: Banknote },
  WITHDRAW_APPROVED: { label: "Duyệt rút tiền", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: Banknote },
  WITHDRAW_REJECTED: { label: "Từ chối rút tiền", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: Banknote },

  // D. Thợ & Dịch vụ
  MECHANIC_SERVICE_SUBMITTED: { label: "Thợ đăng ký dịch vụ", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: Wrench },
  MECHANIC_SERVICE_DELETED: { label: "Thợ xóa dịch vụ", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: Wrench },

  // E. Quản trị
  USER_CREATED: { label: "Tạo tài khoản", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: UserPlus },
  USER_DELETED: { label: "Xóa tài khoản", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: UserCog },
  USER_LOCKED: { label: "Khóa tài khoản", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: Lock },
  USER_UNLOCKED: { label: "Mở khóa tài khoản", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: Unlock },
  MECHANIC_APPROVED: { label: "Duyệt hồ sơ thợ", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: BadgeCheck },
  MECHANIC_REJECTED: { label: "Từ chối hồ sơ thợ", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: BadgeCheck },
  MECHANIC_SERVICE_APPROVED: { label: "Duyệt dịch vụ thợ", color: "#15803d", bg: "rgba(22,163,74,0.12)", Icon: CheckCircle2 },
  MECHANIC_SERVICE_REJECTED: { label: "Từ chối dịch vụ thợ", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: XCircle },
  CONFIG_UPDATED: { label: "Cập nhật cấu hình", color: "#7c3aed", bg: "rgba(124,58,237,0.12)", Icon: Settings },
  BLOG_CREATED: { label: "Tạo bài viết", color: "#1d4ed8", bg: "rgba(37,99,235,0.12)", Icon: FileText },
  BLOG_UPDATED: { label: "Sửa bài viết", color: "#0891b2", bg: "rgba(8,145,178,0.12)", Icon: FileText },
  BLOG_DELETED: { label: "Xóa bài viết", color: "#b91c1c", bg: "rgba(220,38,38,0.12)", Icon: FileText },
  SERVICE_MANAGED: { label: "Quản lý dịch vụ", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: Package },
  GARAGE_MANAGED: { label: "Quản lý garage", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: Warehouse },
  MEMBERSHIP_MANAGED: { label: "Quản lý gói thành viên", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: Package },

  // F. Đánh giá
  REVIEW_SUBMITTED: { label: "Gửi đánh giá", color: "#a16207", bg: "rgba(202,138,4,0.12)", Icon: Star }
};

const EVENT_GROUPS: { label: string; options: string[] }[] = [
  { label: "Tài khoản & Xác thực", options: ["LOGIN", "LOGIN_FAILED", "REGISTER", "LOGOUT", "PASSWORD_CHANGE", "PROFILE_UPDATE"] },
  { label: "Đơn cứu hộ", options: ["ORDER_CREATED", "ORDER_ACCEPTED", "ORDER_ARRIVED", "QUOTE_SENT", "QUOTE_APPROVED", "ORDER_COMPLETED", "ORDER_CANCELLED"] },
  { label: "Thanh toán & Ví", options: ["PAYMENT_CREATED", "PAYMENT_SUCCESS", "WALLET_DEPOSIT", "WITHDRAW_REQUESTED", "WITHDRAW_APPROVED", "WITHDRAW_REJECTED"] },
  { label: "Thợ & Dịch vụ", options: ["MECHANIC_SERVICE_SUBMITTED", "MECHANIC_SERVICE_DELETED", "MECHANIC_APPROVED", "MECHANIC_REJECTED", "MECHANIC_SERVICE_APPROVED", "MECHANIC_SERVICE_REJECTED"] },
  { label: "Quản trị", options: ["USER_CREATED", "USER_DELETED", "USER_LOCKED", "USER_UNLOCKED", "CONFIG_UPDATED", "BLOG_CREATED", "BLOG_UPDATED", "BLOG_DELETED", "SERVICE_MANAGED", "GARAGE_MANAGED", "MEMBERSHIP_MANAGED"] }
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function EventBadge({ eventType }: { eventType: string }) {
  const meta = EVENT_META[eventType] ?? {
    label: eventType,
    color: "var(--text-muted)",
    bg: "rgba(0,0,0,0.05)",
    Icon: Activity
  };
  const { Icon } = meta;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        color: meta.color,
        background: meta.bg
      }}
    >
      <Icon size={13} /> {meta.label}
    </span>
  );
}

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ eventType: "", q: "", from: "", to: "" });
  const [backupDrive, setBackupDrive] = useState<ActivityLogBackupDriveInfo | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    getActivityLogBackupDrive()
      .then(setBackupDrive)
      .catch((err) => console.warn("Không tải link Drive backup:", err));
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listActivityLogs({
        page,
        pageSize: PAGE_SIZE,
        eventType: appliedFilters.eventType || undefined,
        q: appliedFilters.q || undefined,
        from: appliedFilters.from || undefined,
        to: appliedFilters.to || undefined
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Lỗi tải nhật ký hoạt động:", err);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters({ eventType, q: search.trim(), from, to });
  }

  function resetFilters() {
    setEventType("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
    setAppliedFilters({ eventType: "", q: "", from: "", to: "" });
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "10px",
          background: "rgba(37,99,235,0.08)",
          border: "1px solid rgba(37,99,235,0.2)",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "#1e3a8a"
        }}
      >
        <strong>Tự động sao lưu:</strong> Hệ thống backup nhật ký hoạt động <strong>2 tuần/lần</strong>,
        xuất file Excel (tên dạng <code>nhat-ky-hoat-dong_tu-dd-MM-yyyy_den-dd-MM-yyyy.xlsx</code>),
        upload lên Google Drive thư mục <strong>{backupDrive?.folderName ?? "SOSBIKE-NhatKyHoatDong"}</strong>,
        sau đó tự động xóa dữ liệu đã backup khỏi DB.
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
          {backupDrive?.logFolderUrl && (
            <a
              href={backupDrive.logFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid rgba(37,99,235,0.35)",
                color: "#1d4ed8",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              <FolderOpen size={15} /> Mở thư mục backup log
              <ExternalLink size={13} />
            </a>
          )}
          {backupDrive?.parentFolderUrl && (
            <a
              href={backupDrive.parentFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid rgba(37,99,235,0.25)",
                color: "#1e40af",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none"
              }}
            >
              <FolderOpen size={15} /> Thư mục {backupDrive.parentFolderName ?? "cha"}
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={26} style={{ color: "var(--primary)" }} /> Nhật ký hoạt động
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Theo dõi lịch sử đăng nhập, đăng ký của người dùng trên toàn hệ thống.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "flex-end",
          background: "var(--card-bg)",
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)"
        }}
      >
        <div style={{ display: "grid", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Loại sự kiện</label>
              <select className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="">Tất cả</option>
                {EVENT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {EVENT_META[opt]?.label ?? opt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
        </div>
        <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tìm kiếm (tên / SĐT)</label>
          <input
            className="input"
            placeholder="Nhập tên hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        <div style={{ display: "grid", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Từ ngày</label>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: "4px" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Đến ngày</label>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn--primary" onClick={applyFilters} disabled={loading}>
          {loading ? "..." : "Lọc"}
        </button>
        <button className="btn" onClick={resetFilters} disabled={loading}>
          Đặt lại
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Sự kiện</th>
              <th>Người dùng</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Chi tiết</th>
              <th>Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                  Không có dữ liệu nhật ký.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.logid}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(log.createdat)}</td>
                <td><EventBadge eventType={log.eventtype} /></td>
                <td>{log.fullName ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td>{log.phonenumber ?? "—"}</td>
                <td>{log.usertype ?? "—"}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "12px", maxWidth: "320px" }}>{log.description ?? "—"}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{log.ipaddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-between" style={{ flexWrap: "wrap", gap: "10px" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Tổng {total.toLocaleString()} bản ghi · Trang {page}/{totalPages}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
            ← Trước
          </button>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
