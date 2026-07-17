import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  grantPromotionVoucher,
  listPromotionVouchers,
  revokePromotionVoucher,
  type GrantPromotionVoucherRequest,
  type PromotionVoucherListItem
} from "./promotionsApi";
import { Modal } from "../../shared/components/Modal";

type FilterStatus = "" | "ACTIVE" | "REVOKED" | "EXPIRED";
type FilterSource = "" | "ADMIN" | "MEMBERSHIP";
type FilterUserType = "" | "CUSTOMER" | "MECHANIC";
type RecipientMode = "SINGLE" | "PHONE_LIST" | "USER_LIST" | "ALL_CUSTOMERS" | "ALL_MECHANICS";

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const text = value.endsWith("Z") || value.includes("+") || !value.includes("T") ? value : `${value}Z`;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
}

function discountText(item: PromotionVoucherListItem) {
  const type = item.discountType.toUpperCase();
  if (type === "FREE") return "Miễn phí";
  if (type === "AMOUNT") return formatMoney(item.discountValue);
  return `${item.discountValue}%`;
}

function areaText(area: string) {
  switch (area.toUpperCase()) {
    case "TRAVEL_FEE":
      return "Phí di chuyển";
    case "NIGHT_SURCHARGE":
      return "Phụ phí đêm";
    case "SERVICE_FEE":
      return "Phí dịch vụ";
    default:
      return "Tổng đơn";
  }
}

function statusText(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "Đang hiệu lực";
    case "REVOKED":
      return "Đã thu hồi";
    case "EXPIRED":
      return "Hết hạn";
    default:
      return status || "-";
  }
}

function sourceText(sourceType?: string | null) {
  return (sourceType ?? "").toUpperCase() === "ADMIN" ? "Admin tặng" : "Từ gói";
}

function splitMultiValue(value: string) {
  return value
    .split(/[\n,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

const DEFAULT_FORM = {
  recipientMode: "SINGLE" as RecipientMode,
  phoneNumber: "",
  userId: "",
  phoneNumbersText: "",
  userIdsText: "",
  voucherCode: "",
  voucherName: "",
  description: "",
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscountAmount: "",
  minimumOrderValue: "",
  applicableArea: "ORDER_TOTAL",
  quantityTotal: 1,
  validDays: 7,
  grantedReason: ""
};

export function PromotionsPage() {
  const [q, setQ] = useState("");
  const [userType, setUserType] = useState<FilterUserType>("");
  const [status, setStatus] = useState<FilterStatus>("");
  const [sourceType, setSourceType] = useState<FilterSource>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [grantOpen, setGrantOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  const query = useQuery({
    queryKey: ["promotion-vouchers", { q, userType, status, sourceType, page, pageSize }],
    queryFn: () =>
      listPromotionVouchers({
        q: q || undefined,
        userType: userType || undefined,
        status: status || undefined,
        sourceType: sourceType || undefined,
        page,
        pageSize
      })
  });

  const items = query.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: query.data?.total ?? 0,
      active: items.filter((item) => item.status.toUpperCase() === "ACTIVE").length,
      admin: items.filter((item) => item.sourceType.toUpperCase() === "ADMIN").length,
      remaining: items.reduce((sum, item) => sum + Math.max(item.remainingQuantity, 0), 0)
    }),
    [items, query.data?.total]
  );

  async function handleGrant() {
    const voucherName = form.voucherName.trim();
    if (!voucherName) {
      alert("Vui lòng nhập tên phiếu.");
      return;
    }

    const basePayload: GrantPromotionVoucherRequest = {
      recipientMode: form.recipientMode,
      voucherCode: form.voucherCode.trim(),
      voucherName,
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue ?? 0),
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      minimumOrderValue: form.minimumOrderValue === "" ? null : Number(form.minimumOrderValue),
      applicableArea: form.applicableArea,
      quantityTotal: Number(form.quantityTotal ?? 1),
      validDays: Number(form.validDays ?? 7),
      grantedReason: form.grantedReason.trim() || null
    };

    let payload: GrantPromotionVoucherRequest = { ...basePayload };

    if (form.recipientMode === "SINGLE") {
      const phoneNumber = form.phoneNumber.trim();
      const userId = form.userId.trim();
      if (!phoneNumber && !userId) {
        alert("Nhập số điện thoại hoặc UserId cho chế độ tặng một người.");
        return;
      }
      payload = { ...payload, phoneNumber: phoneNumber || null, userId: userId || null };
    }

    if (form.recipientMode === "PHONE_LIST") {
      const phoneNumbers = splitMultiValue(form.phoneNumbersText);
      if (phoneNumbers.length === 0) {
        alert("Nhập ít nhất một số điện thoại.");
        return;
      }
      payload = { ...payload, phoneNumbers };
    }

    if (form.recipientMode === "USER_LIST") {
      const userIds = splitMultiValue(form.userIdsText);
      if (userIds.length === 0) {
        alert("Nhập ít nhất một UserId.");
        return;
      }
      payload = { ...payload, userIds };
    }

    setGranting(true);
    try {
      await grantPromotionVoucher(payload);
      setGrantOpen(false);
      setForm(DEFAULT_FORM);
      await query.refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể tặng phiếu.");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke() {
    if (!revokeId) return;

    try {
      await revokePromotionVoucher(revokeId, revokeReason || undefined);
      setRevokeId(null);
      setRevokeReason("");
      await query.refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể thu hồi phiếu.");
    }
  }

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="page-header">
        <div className="page-header__info">
          <h1>Khuyến mãi & Phiếu giảm giá</h1>
          <p>Quản lý phiếu giảm giá kiểu Shopee, hỗ trợ tặng một người, tặng hàng loạt và thu hồi nhanh.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary btn--sm" onClick={() => setGrantOpen(true)}>
            <Gift size={14} />
            Tặng phiếu mới
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <SummaryCard title="Tổng phiếu" value={stats.total} accent="#E11D48" note="Theo bộ lọc hiện tại" />
        <SummaryCard title="Phiếu hiệu lực" value={stats.active} accent="#10B981" note="Còn có thể sử dụng" />
        <SummaryCard title="Phiếu admin" value={stats.admin} accent="#F59E0B" note="Admin tặng hoặc cấp hàng loạt" />
        <SummaryCard title="Lượt còn lại" value={stats.remaining} accent="#3B82F6" note="Tổng lượt khả dụng" />
      </div>

      <div className="filter-bar" style={{ alignItems: "center" }}>
        <label className="input" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã phiếu, tên phiếu, tên người nhận, số điện thoại..."
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", color: "inherit" }}
          />
        </label>

        <select
          className="select"
          style={{ width: 180 }}
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value as FilterUserType);
            setPage(1);
          }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="MECHANIC">Thợ sửa xe</option>
        </select>

        <select
          className="select"
          style={{ width: 180 }}
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value as FilterSource);
            setPage(1);
          }}
        >
          <option value="">Tất cả nguồn</option>
          <option value="ADMIN">Admin tặng</option>
          <option value="MEMBERSHIP">Từ gói</option>
        </select>

        <select
          className="select"
          style={{ width: 180 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FilterStatus);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiệu lực</option>
          <option value="REVOKED">Đã thu hồi</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>

        <button className="btn btn--ghost" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw size={14} />
          {query.isFetching ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      {query.isError ? (
        <div className="card" style={{ color: "var(--danger)" }}>
          {query.error instanceof Error ? query.error.message : "Không tải được danh sách phiếu giảm giá."}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Người nhận</th>
                <th>Giảm</th>
                <th>Phạm vi</th>
                <th>Lượt còn</th>
                <th>Nguồn</th>
                <th>Trạng thái</th>
                <th>Hiệu lực đến</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.promotionVoucherId}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.voucherCode}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.voucherName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.fullName}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {item.phoneNumber} · {item.userType}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{discountText(item)}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {item.maxDiscountAmount ? `Tối đa ${formatMoney(item.maxDiscountAmount)}` : "Không giới hạn tối đa"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{areaText(item.applicableArea)}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {item.minimumOrderValue ? `Đơn tối thiểu ${formatMoney(item.minimumOrderValue)}` : "Không giới hạn đơn"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.remainingQuantity}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.quantityTotal} lượt</div>
                  </td>
                  <td>
                    <Badge tone={(item.sourceType ?? "").toUpperCase() === "ADMIN" ? "accent" : "neutral"}>
                      {sourceText(item.sourceType)}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        item.status.toUpperCase() === "ACTIVE"
                          ? "success"
                          : item.status.toUpperCase() === "REVOKED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {statusText(item.status)}
                    </Badge>
                  </td>
                  <td>{formatDate(item.validTo)}</td>
                  <td>
                    <button className="btn btn--danger btn--sm" onClick={() => setRevokeId(item.promotionVoucherId)}>
                      <Trash2 size={14} />
                      Thu hồi
                    </button>
                  </td>
                </tr>
              ))}

              {!query.isFetching && items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "28px 16px" }}>
                    Chưa có phiếu giảm giá nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-footer">
        <div>
          Tổng cộng: <strong>{query.data?.total ?? 0}</strong> phiếu
        </div>
        <div className="pagination">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Trước
          </button>
          <span>
            Trang <strong>{page}</strong> / {totalPages}
          </span>
          <button
            className="btn btn--ghost btn--sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Sau
          </button>
        </div>
      </div>

      <Modal
        isOpen={grantOpen}
        onClose={() => {
          setGrantOpen(false);
          setForm(DEFAULT_FORM);
        }}
        title="Tặng phiếu giảm giá"
        size="lg"
        footer={
          <>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setGrantOpen(false);
                setForm(DEFAULT_FORM);
              }}
            >
              Đóng
            </button>
            <button className="btn btn--primary" disabled={granting} onClick={handleGrant}>
              {granting ? "Đang tặng..." : "Xác nhận tặng"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ border: "1px solid rgba(59,130,246,0.28)", background: "rgba(59,130,246,0.08)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <ShieldCheck size={18} style={{ marginTop: 2 }} />
              <div style={{ display: "grid", gap: 4 }}>
                <strong>Phiếu admin tặng có thể dùng chung với gói thành viên</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  Người dùng đang có gói vẫn dùng được phiếu này. Khi thanh toán, hệ thống sẽ áp dụng theo thứ tự: ưu đãi gói trước, phiếu admin tặng cộng thêm sau.
                </span>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <label className="form-group">
              <span>Chế độ tặng</span>
              <select
                className="select"
                value={form.recipientMode}
                onChange={(e) => setForm((prev) => ({ ...prev, recipientMode: e.target.value as RecipientMode }))}
              >
                <option value="SINGLE">Tặng một người</option>
                <option value="PHONE_LIST">Tặng nhiều số điện thoại</option>
                <option value="USER_LIST">Tặng nhiều UserId</option>
                <option value="ALL_CUSTOMERS">Tất cả khách hàng</option>
                <option value="ALL_MECHANICS">Tất cả thợ sửa xe</option>
              </select>
            </label>

            <label className="form-group">
              <span>Mã phiếu</span>
              <input
                className="input"
                value={form.voucherCode}
                onChange={(e) => setForm((prev) => ({ ...prev, voucherCode: e.target.value }))}
                placeholder="Ví dụ: SHIP5K"
              />
            </label>
          </div>

          {form.recipientMode === "SINGLE" ? (
            <div className="grid-2">
              <label className="form-group">
                <span>Số điện thoại khách</span>
                <input
                  className="input"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Ví dụ: 0982815244"
                />
              </label>
              <label className="form-group">
                <span>UserId (nếu có)</span>
                <input
                  className="input"
                  value={form.userId}
                  onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                  placeholder="UUID của người nhận"
                />
              </label>
            </div>
          ) : null}

          {form.recipientMode === "PHONE_LIST" ? (
            <label className="form-group">
              <span>Danh sách số điện thoại</span>
              <textarea
                className="textarea"
                rows={4}
                value={form.phoneNumbersText}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumbersText: e.target.value }))}
                placeholder="Mỗi dòng một số, hoặc ngăn cách bằng dấu phẩy"
              />
            </label>
          ) : null}

          {form.recipientMode === "USER_LIST" ? (
            <label className="form-group">
              <span>Danh sách UserId</span>
              <textarea
                className="textarea"
                rows={4}
                value={form.userIdsText}
                onChange={(e) => setForm((prev) => ({ ...prev, userIdsText: e.target.value }))}
                placeholder="Mỗi dòng một UUID, hoặc ngăn cách bằng dấu phẩy"
              />
            </label>
          ) : null}

          <div className="grid-2">
            <label className="form-group">
              <span>Tên phiếu</span>
              <input
                className="input"
                value={form.voucherName}
                onChange={(e) => setForm((prev) => ({ ...prev, voucherName: e.target.value }))}
                placeholder="Ví dụ: Giảm phí di chuyển 5%"
              />
            </label>
            <label className="form-group">
              <span>Loại giảm</span>
              <select
                className="select"
                value={form.discountType}
                onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value }))}
              >
                <option value="PERCENT">Phần trăm</option>
                <option value="AMOUNT">Số tiền</option>
                <option value="FREE">Miễn phí</option>
              </select>
            </label>
          </div>

          <div className="grid-3">
            <label className="form-group">
              <span>Giá trị giảm</span>
              <input
                className="input"
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
              />
            </label>
            <label className="form-group">
              <span>Giảm tối đa</span>
              <input
                className="input"
                type="number"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
                placeholder="Để trống nếu không giới hạn"
              />
            </label>
            <label className="form-group">
              <span>Đơn tối thiểu</span>
              <input
                className="input"
                type="number"
                value={form.minimumOrderValue}
                onChange={(e) => setForm((prev) => ({ ...prev, minimumOrderValue: e.target.value }))}
                placeholder="Để trống nếu không giới hạn"
              />
            </label>
          </div>

          <div className="grid-3">
            <label className="form-group">
              <span>Áp dụng cho</span>
              <select
                className="select"
                value={form.applicableArea}
                onChange={(e) => setForm((prev) => ({ ...prev, applicableArea: e.target.value }))}
              >
                <option value="ORDER_TOTAL">Tổng đơn</option>
                <option value="TRAVEL_FEE">Phí di chuyển</option>
                <option value="NIGHT_SURCHARGE">Phụ phí đêm</option>
                <option value="SERVICE_FEE">Phí dịch vụ</option>
              </select>
            </label>
            <label className="form-group">
              <span>Số lượng</span>
              <input
                className="input"
                type="number"
                value={form.quantityTotal}
                onChange={(e) => setForm((prev) => ({ ...prev, quantityTotal: Number(e.target.value) }))}
              />
            </label>
            <label className="form-group">
              <span>Số ngày hiệu lực</span>
              <input
                className="input"
                type="number"
                value={form.validDays}
                onChange={(e) => setForm((prev) => ({ ...prev, validDays: Number(e.target.value) }))}
              />
            </label>
          </div>

          <label className="form-group">
            <span>Mô tả</span>
            <textarea
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn cho người nhận"
            />
          </label>

          <label className="form-group">
            <span>Lý do / ghi chú</span>
            <textarea
              className="textarea"
              rows={2}
              value={form.grantedReason}
              onChange={(e) => setForm((prev) => ({ ...prev, grantedReason: e.target.value }))}
              placeholder="Ví dụ: Tặng khách mới, hỗ trợ chiến dịch..."
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!revokeId}
        onClose={() => {
          setRevokeId(null);
          setRevokeReason("");
        }}
        title="Thu hồi phiếu"
        footer={
          <>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setRevokeId(null);
                setRevokeReason("");
              }}
            >
              Hủy
            </button>
            <button className="btn btn--danger" onClick={handleRevoke}>
              Xác nhận thu hồi
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Phiếu sẽ chuyển sang trạng thái đã thu hồi để người dùng không dùng được nữa.
          </div>
          <label className="form-group">
            <span>Lý do thu hồi</span>
            <textarea
              className="textarea"
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Nhập lý do thu hồi"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  accent,
  note
}: {
  title: string;
  value: number;
  accent: string;
  note: string;
}) {
  return (
    <div
      className="card"
      style={{
        borderTop: `4px solid ${accent}`,
        display: "grid",
        gap: 8
      }}
    >
      <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{note}</div>
    </div>
  );
}

function Badge({
  tone,
  children
}: {
  tone: "success" | "warning" | "danger" | "accent" | "neutral";
  children: ReactNode;
}) {
  const palette: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#34D399" },
    warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#FBBF24" },
    danger: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", color: "#F87171" },
    accent: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", color: "#60A5FA" },
    neutral: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.24)", color: "var(--text-secondary)" }
  };
  const style = palette[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {children}
    </span>
  );
}
