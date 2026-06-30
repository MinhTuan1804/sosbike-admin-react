import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders, getOrderDetails, cancelOrder, deleteOrder } from "./ordersApi";
import { Modal } from "../../shared/components/Modal";
import { Flame, Search, RefreshCw, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN");
}

const STATUS_OPTIONS = [
  { value: "",          label: "Tất cả trạng thái" },
  { value: "PENDING",   label: "Chờ thợ (PENDING)" },
  { value: "ACCEPTED",  label: "Đã nhận (ACCEPTED)" },
  { value: "ARRIVED",   label: "Đã đến (ARRIVED)" },
  { value: "COMPLETED", label: "Hoàn thành (COMPLETED)" },
  { value: "CANCELLED", label: "Đã hủy (CANCELLED)" }
];

function getStatusBadge(st: string) {
  const s = st.toUpperCase();
  if (s === "COMPLETED")                    return <span className="badge badge--success">Hoàn thành</span>;
  if (s === "CANCELLED" || s === "CANCELED") return <span className="badge badge--danger">Đã hủy</span>;
  if (s === "PENDING")                      return <span className="badge badge--warning">Chờ thợ</span>;
  if (s === "ACCEPTED")                     return <span className="badge badge--info">Đang đến</span>;
  if (s === "ARRIVED")                      return <span className="badge badge--primary">Đang sửa</span>;
  return <span className="badge">{st}</span>;
}

export function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const queryKey = useMemo(() => ["admin-orders", { q, status, page }], [q, status, page]);
  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => listOrders({ q: q || undefined, status: status || undefined, page, pageSize: 20 })
  });

  const detailQuery = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => getOrderDetails(selectedOrderId!),
    enabled: !!selectedOrderId
  });

  const orderDetail = detailQuery.data;
  const total = ordersQuery.data?.total ?? 0;
  const from  = Math.min((page - 1) * 20 + 1, total);
  const to    = Math.min(page * 20, total);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <Flame size={22} style={{ color: "var(--warning)" }} />
              Đơn cứu hộ
            </span>
          </h1>
          <p>Danh sách và chi tiết tất cả đơn cứu hộ trên hệ thống SOSBIKE</p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn--primary"
            onClick={() => ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
          >
            <RefreshCw size={14} />
            {ordersQuery.isFetching ? "Đang tải..." : "Tải lại"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: "240px" }}>
          <span className="input-icon-wrap__icon"><Search size={14} /></span>
          <input
            className="input"
            placeholder="Tìm theo tên khách, SĐT, tên thợ, địa chỉ..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            id="orders-search"
            aria-label="Tìm kiếm đơn hàng"
          />
        </div>
        <select
          className="select"
          style={{ width: "210px" }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          id="orders-status-filter"
          aria-label="Lọc theo trạng thái"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {ordersQuery.isError && (
        <div className="card mb-16" style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "var(--danger-bg)" }}>
          <strong>Lỗi hệ thống:</strong> {String(ordersQuery.error)}
        </div>
      )}

      {/* Table */}
      {ordersQuery.isLoading ? (
        <div className="table-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "16px" }}>
              <span className="skeleton" style={{ width: "70px", height: "22px" }} />
              <span className="skeleton" style={{ width: "160px", height: "22px" }} />
              <span className="skeleton" style={{ width: "130px", height: "22px" }} />
              <span className="skeleton" style={{ flex: 1, height: "22px" }} />
              <span className="skeleton" style={{ width: "100px", height: "22px" }} />
            </div>
          ))}
        </div>
      ) : ordersQuery.data ? (
        <>
          <div className="table-container">
            <table className="table" role="grid" aria-label="Danh sách đơn cứu hộ">
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th>Khách hàng</th>
                  <th>Thợ cứu hộ</th>
                  <th>Địa chỉ cứu hộ</th>
                  <th style={{ textAlign: "right" }}>Tổng chi phí</th>
                  <th>Thời gian tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ordersQuery.data.items.map((o) => (
                  <tr
                    key={o.orderId}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedOrderId(o.orderId)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedOrderId(o.orderId)}
                  >
                    <td>{getStatusBadge(o.status)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                      <div className="text-muted text-xs">{o.customerPhone}</div>
                    </td>
                    <td>
                      {o.mechanicName ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{o.mechanicName}</div>
                          <div className="text-muted text-xs">{o.mechanicPhone}</div>
                        </>
                      ) : (
                        <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Chưa nhận</span>
                      )}
                    </td>
                    <td>
                      <div className="truncate" style={{ maxWidth: "280px" }} title={o.requestAddress}>
                        {o.requestAddress}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {o.totalAmount != null ? formatMoney(o.totalAmount) : "—"}
                      </span>
                    </td>
                    <td className="text-muted">{formatDate(o.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn--sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(o.orderId); }}
                        aria-label={`Xem chi tiết đơn ${o.orderId}`}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {ordersQuery.data.items.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state__icon"><Flame size={32} /></div>
                        <h3>Không tìm thấy đơn nào</h3>
                        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <span>
                Hiển thị <strong className="tabular-nums">{from}–{to}</strong> trong tổng số <strong className="tabular-nums">{total}</strong> đơn
              </span>
              <div className="pagination__controls">
                <button
                  className="btn btn--sm"
                  disabled={page <= 1 || ordersQuery.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <span style={{ padding: "0 10px", fontWeight: 600, fontSize: "13px" }}>Trang {page}</span>
                <button
                  className="btn btn--sm"
                  disabled={page * 20 >= total || ordersQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Trang sau"
                >
                  Sau
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Chi tiết đơn cứu hộ"
        size="lg"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end" }}>
            {orderDetail && !["COMPLETED", "CANCELLED", "CANCELLED_AFTER_ARRIVED"].includes(orderDetail.status) && (
              <button
                className="btn btn--danger"
                onClick={async () => {
                  const reason = prompt("Nhập lý do hủy đơn (hoặc bỏ trống):");
                  if (reason === null) return; // user cancelled prompt
                  try {
                    await cancelOrder(orderDetail.orderId, reason || undefined);
                    await detailQuery.refetch();
                    await ordersQuery.refetch();
                  } catch (err: any) {
                    alert(err.message || "Không thể hủy đơn hàng");
                  }
                }}
              >
                Hủy đơn
              </button>
            )}
            <button className="btn" onClick={() => setSelectedOrderId(null)}>Đóng</button>
          </div>
        }
      >
        {detailQuery.isFetching ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <span className="skeleton" style={{ height: "60px", borderRadius: "var(--radius-md)" }} />
            <div className="grid-2">
              <span className="skeleton" style={{ height: "100px" }} />
              <span className="skeleton" style={{ height: "100px" }} />
            </div>
            <span className="skeleton" style={{ height: "80px" }} />
          </div>
        ) : orderDetail ? (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Status + Total Panel */}
            <div className="flex-between" style={{ background: "var(--neutral-bg)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div>
                <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Trạng thái hiện tại</div>
                {getStatusBadge(orderDetail.status)}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Tổng chi phí</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                  {orderDetail.totalAmount != null ? formatMoney(orderDetail.totalAmount) : "0 đ"}
                </div>
              </div>
            </div>

            {/* Customer vs Mechanic */}
            <div className="grid-2">
              <div className="card">
                <div className="card__subtitle mb-12" style={{ textTransform: "uppercase" }}>Khách hàng</div>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>{orderDetail.customer?.fullName}</div>
                <div className="text-muted mt-4">SĐT: {orderDetail.customer?.phoneNumber}</div>
                {orderDetail.customerNote && (
                  <div className="mt-12" style={{ background: "var(--warning-bg)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                    <b>Ghi chú:</b> {orderDetail.customerNote}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card__subtitle mb-12" style={{ textTransform: "uppercase" }}>Thợ cứu hộ</div>
                {orderDetail.mechanic ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{orderDetail.mechanic.fullName}</div>
                    <div className="text-muted mt-4">SĐT: {orderDetail.mechanic.phoneNumber}</div>
                    <div className="flex-gap mt-8">
                      <span className="badge badge--info">Biển: {orderDetail.mechanic.licensePlate ?? "—"}</span>
                      <span className="badge">CCCD: {orderDetail.mechanic.identityCard ?? "—"}</span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Đơn chưa được thợ nào nhận.</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <div className="card__subtitle mb-8" style={{ textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={13} /> Vị trí cứu hộ
              </div>
              <div style={{ fontWeight: 500 }}>{orderDetail.requestAddress}</div>
              {orderDetail.locationNote && (
                <div className="text-muted text-sm mt-4">Ghi chú: {orderDetail.locationNote}</div>
              )}
              <div className="flex-gap mt-12 text-sm" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                <span>Quãng đường: <b>{orderDetail.distanceKm ?? "—"} km</b></span>
                {orderDetail.estimatedArrivalMins != null && (
                  <span>Thợ dự kiến đến: <b>{orderDetail.estimatedArrivalMins} phút</b></span>
                )}
              </div>
            </div>

            {/* Cancellation reason */}
            {orderDetail.cancellationReason && (
              <div className="card" style={{ border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
                <div style={{ fontWeight: 700, color: "var(--danger)", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>Lý do hủy đơn</div>
                <div style={{ fontWeight: 600, color: "var(--danger)" }}>{orderDetail.cancellationReason}</div>
              </div>
            )}

            {/* Quote details */}
            <div>
              <div className="section-header">
                <h2>Chi tiết báo giá dịch vụ & phụ tùng</h2>
              </div>
              <div className="table-container">
                <table className="table" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th>Tên dịch vụ / Phụ tùng</th>
                      <th>Loại</th>
                      <th>Số lượng</th>
                      <th style={{ textAlign: "right" }}>Đơn giá</th>
                      <th style={{ textAlign: "right" }}>Thành tiền</th>
                      <th>Khách duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.quoteDetails && orderDetail.quoteDetails.map((q: any) => (
                      <tr key={q.quoteDetailId}>
                        <td style={{ fontWeight: 600 }}>{q.itemName}</td>
                        <td>{q.itemType === "SERVICE" ? "Dịch vụ" : "Phụ tùng"}</td>
                        <td className="tabular-nums">{q.quantity}</td>
                        <td className="tabular-nums" style={{ textAlign: "right" }}>{formatMoney(q.unitPrice)}</td>
                        <td className="tabular-nums" style={{ textAlign: "right", fontWeight: 700 }}>{formatMoney(q.totalPrice)}</td>
                        <td>
                          {q.isCustomerApproved
                            ? <span className="badge badge--success">Đồng ý</span>
                            : <span className="badge badge--danger">Từ chối</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {(!orderDetail.quoteDetails || orderDetail.quoteDetails.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)", padding: "20px" }}>Chưa có báo giá chi tiết.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="grid-2">
              <div>
                <div className="section-header"><h2>Chi tiết thanh toán</h2></div>
                <div className="card" style={{ display: "grid", gap: "8px" }}>
                  {[
                    ["Phí di chuyển", orderDetail.travelFee],
                    ["Phí sửa chữa", orderDetail.repairFee],
                    ["Phụ thu đêm",   orderDetail.nightSurcharge]
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex-between text-sm">
                      <span className="text-muted">{label}:</span>
                      <span className="tabular-nums">{val != null ? formatMoney(val as number) : "0 đ"}</span>
                    </div>
                  ))}
                  <div className="flex-between text-sm" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "4px" }}>
                    <span className="text-muted">Chiết khấu sàn:</span>
                    <span className="font-semi tabular-nums">{orderDetail.platformFeePercentage ?? 10}%</span>
                  </div>
                  <div className="flex-between" style={{ fontWeight: 800, fontSize: "14px" }}>
                    <span>Tổng thực nhận:</span>
                    <span className="tabular-nums" style={{ color: "var(--primary)" }}>{formatMoney(orderDetail.totalAmount ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-header"><h2>Trạng thái giao dịch</h2></div>
                {orderDetail.payments && orderDetail.payments.map((p: any) => (
                  <div key={p.paymentId} className="card mb-8">
                    <div className="flex-between mb-4">
                      <span className="font-semi text-sm">Mã: {p.paymentCode ?? "N/A"}</span>
                      <span className={`badge ${p.status === "SUCCESS" ? "badge--success" : "badge--warning"}`}>{p.status}</span>
                    </div>
                    <div className="text-xs text-muted">
                      Số tiền: <span className="tabular-nums">{formatMoney(p.amount)}</span> • Cổng: {p.method} • Loại: {p.type}
                    </div>
                    {p.gatewayTransactionId && (
                      <div className="text-xs" style={{ color: "var(--text-light)", marginTop: "2px" }}>TransID: {p.gatewayTransactionId}</div>
                    )}
                  </div>
                ))}
                {(!orderDetail.payments || orderDetail.payments.length === 0) && (
                  <div className="card" style={{ textAlign: "center", color: "var(--text-light)", fontSize: "13px" }}>
                    Chưa tạo giao dịch thanh toán.
                  </div>
                )}
              </div>
            </div>

            {/* Issue Photos */}
            {orderDetail.issuePhotos && orderDetail.issuePhotos.length > 0 && (
              <div>
                <div className="section-header"><h2>Hình ảnh hiện trường sự cố</h2></div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {orderDetail.issuePhotos.map((url: string, index: number) => (
                    <a href={url} target="_blank" rel="noreferrer" key={index}>
                      <img
                        src={url}
                        alt={`Sự cố ${index + 1}`}
                        style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", cursor: "pointer", transition: "transform 0.2s" }}
                        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseOut={(e)  => e.currentTarget.style.transform = "scale(1)"}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div className="section-header">
                <h2><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Clock size={14} />Mốc thời gian xử lý</span></h2>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", background: "var(--neutral-bg)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div>Tạo đơn: <b>{formatDate(orderDetail.createdAt)}</b></div>
                {orderDetail.acceptedAt  && <div>Thợ nhận: <b>{formatDate(orderDetail.acceptedAt)}</b></div>}
                {orderDetail.arrivedAt   && <div>Thợ đến: <b>{formatDate(orderDetail.arrivedAt)}</b></div>}
                {orderDetail.completedAt && <div>Hoàn thành: <b>{formatDate(orderDetail.completedAt)}</b></div>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--danger)", textAlign: "center", padding: "32px" }}>Lỗi không thể tải thông tin đơn.</div>
        )}
      </Modal>
    </div>
  );
}
