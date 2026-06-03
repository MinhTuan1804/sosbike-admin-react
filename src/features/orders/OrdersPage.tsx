import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders, getOrderDetails } from "./ordersApi";
import { Modal } from "../../shared/components/Modal";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("vi-VN");
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

  const statuses = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "PENDING", label: "Đang chờ (PENDING)" },
    { value: "ACCEPTED", label: "Đã nhận (ACCEPTED)" },
    { value: "ARRIVED", label: "Đã đến (ARRIVED)" },
    { value: "COMPLETED", label: "Hoàn thành (COMPLETED)" },
    { value: "CANCELLED", label: "Đã hủy (CANCELLED)" }
  ];

  function getStatusBadge(st: string) {
    const s = st.toUpperCase();
    if (s === "COMPLETED") return <span className="badge badge--success">Hoàn thành</span>;
    if (s === "CANCELLED" || s === "CANCELED") return <span className="badge badge--danger">Đã hủy</span>;
    if (s === "PENDING") return <span className="badge badge--warning">Chờ thợ</span>;
    if (s === "ACCEPTED") return <span className="badge badge--info">Đang đến</span>;
    if (s === "ARRIVED") return <span className="badge badge--info">Đang sửa</span>;
    return <span className="badge">{st}</span>;
  }

  const orderDetail = detailQuery.data;

  return (
    <div>
      <div className="flex-between">
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Đơn cứu hộ</h1>
        <button className="btn btn--primary" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
          {ordersQuery.isFetching ? "Đang tải..." : "Lọc lại danh sách"}
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "12px", margin: "20px 0", flexWrap: "wrap", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: "240px" }}
          placeholder="Tìm theo tên khách, sđt khách, tên thợ, địa chỉ..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select
          className="select"
          style={{ width: "220px" }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Grid Content */}
      {ordersQuery.isError ? (
        <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
          <strong>Lỗi hệ thống:</strong> {String(ordersQuery.error)}
        </div>
      ) : ordersQuery.data ? (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th>Khách hàng</th>
                  <th>Thợ cứu hộ</th>
                  <th>Địa chỉ cứu hộ</th>
                  <th>Tổng chi phí</th>
                  <th>Thời gian tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ordersQuery.data.items.map((o) => (
                  <tr key={o.orderId} style={{ cursor: "pointer" }} onClick={() => setSelectedOrderId(o.orderId)}>
                    <td>{getStatusBadge(o.status)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{o.customerPhone}</div>
                    </td>
                    <td>
                      {o.mechanicName ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{o.mechanicName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{o.mechanicPhone}</div>
                        </>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>Chưa nhận</span>
                      )}
                    </td>
                    <td>
                      <div style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.requestAddress}>
                        {o.requestAddress}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--secondary)" }}>
                      {o.totalAmount != null ? formatMoney(o.totalAmount) : "-"}
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(o.orderId); }}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {ordersQuery.data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Không tìm thấy đơn cứu hộ nào khớp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex-between" style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Hiển thị đơn từ {Math.min((page - 1) * 20 + 1, ordersQuery.data.total)} đến {Math.min(page * 20, ordersQuery.data.total)} trong tổng số <b>{ordersQuery.data.total}</b> đơn
            </span>
            <div className="flex-gap">
              <button
                className="btn btn--sm"
                disabled={page <= 1 || ordersQuery.isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "0 8px" }}>Trang {page}</span>
              <button
                className="btn btn--sm"
                disabled={page * 20 >= ordersQuery.data.total || ordersQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách đơn...</div>
      )}

      {/* Details Drawer Modal */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="Chi tiết đơn cứu hộ"
        size="lg"
        footer={
          <button className="btn" onClick={() => setSelectedOrderId(null)}>Đóng</button>
        }
      >
        {detailQuery.isFetching ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Đang tải chi tiết đơn...</div>
        ) : orderDetail ? (
          <div style={{ display: "grid", gap: "20px" }}>
            
            {/* Status Panel */}
            <div className="flex-between" style={{ background: "var(--neutral-bg)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Trạng thái hiện tại</span>
                <div style={{ marginTop: "4px" }}>{getStatusBadge(orderDetail.status)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Tổng chi phí</span>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                  {orderDetail.totalAmount != null ? formatMoney(orderDetail.totalAmount) : "0 đ"}
                </div>
              </div>
            </div>

            {/* Customer vs Mechanic Grid */}
            <div className="grid-2">
              <div className="card" style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>Khách hàng</h3>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>{orderDetail.customer?.fullName}</div>
                <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>SĐT: {orderDetail.customer?.phoneNumber}</div>
                {orderDetail.customerNote && (
                  <div style={{ marginTop: "12px", background: "var(--warning-bg)", color: "var(--text-main)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                    <b>Ghi chú của khách:</b> {orderDetail.customerNote}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>Thợ cứu hộ</h3>
                {orderDetail.mechanic ? (
                  <>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{orderDetail.mechanic.fullName}</div>
                    <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>SĐT: {orderDetail.mechanic.phoneNumber}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px", fontSize: "12px" }}>
                      <span className="badge badge--info">Biển: {orderDetail.mechanic.licensePlate ?? "-"}</span>
                      <span className="badge">CCCD: {orderDetail.mechanic.identityCard ?? "-"}</span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Đơn chưa được thợ nào nhận.</span>
                )}
              </div>
            </div>

            {/* Address and Distance */}
            <div className="card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Vị trí cứu hộ</h3>
              <div style={{ fontWeight: 500 }}>{orderDetail.requestAddress}</div>
              {orderDetail.locationNote && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ghi chú: {orderDetail.locationNote}</div>}
              <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "13px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                <div>Quãng đường: <b>{orderDetail.distanceKm ?? "-"} km</b></div>
                {orderDetail.estimatedArrivalMins != null && <div>Thời gian dự kiến thợ đến: <b>{orderDetail.estimatedArrivalMins} phút</b></div>}
              </div>
            </div>

            {/* Cancelled Reason */}
            {orderDetail.cancellationReason && (
              <div className="card" style={{ padding: "16px", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
                <h3 style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "4px", textTransform: "uppercase" }}>Lý do hủy đơn</h3>
                <div style={{ fontWeight: 600, color: "var(--danger)" }}>{orderDetail.cancellationReason}</div>
              </div>
            )}

            {/* Quote details */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Chi tiết báo giá dịch vụ & phụ tùng</h3>
              <div className="table-container" style={{ marginTop: 0 }}>
                <table className="table" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th>Tên dịch vụ / Phụ tùng</th>
                      <th>Loại</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Khách duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.quoteDetails && orderDetail.quoteDetails.map((q: any) => (
                      <tr key={q.quoteDetailId}>
                        <td style={{ fontWeight: 600 }}>{q.itemName}</td>
                        <td>{q.itemType === "SERVICE" ? "Dịch vụ" : "Phụ tùng"}</td>
                        <td>{q.quantity}</td>
                        <td>{formatMoney(q.unitPrice)}</td>
                        <td style={{ fontWeight: "700" }}>{formatMoney(q.totalPrice)}</td>
                        <td>
                          {q.isCustomerApproved ? (
                            <span className="badge badge--success" style={{ fontSize: "9px" }}>Đồng ý</span>
                          ) : (
                            <span className="badge badge--danger" style={{ fontSize: "9px" }}>Từ chối</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!orderDetail.quoteDetails || orderDetail.quoteDetails.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)", padding: "12px" }}>Chưa có báo giá chi tiết.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment breakdowns */}
            <div className="grid-2">
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Chi tiết thanh toán</h3>
                <div className="card" style={{ padding: "16px", display: "grid", gap: "6px" }}>
                  <div className="flex-between" style={{ fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phí di chuyển:</span>
                    <span>{orderDetail.travelFee != null ? formatMoney(orderDetail.travelFee) : "0 đ"}</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phí sửa chữa:</span>
                    <span>{orderDetail.repairFee != null ? formatMoney(orderDetail.repairFee) : "0 đ"}</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phụ thu đêm:</span>
                    <span>{orderDetail.nightSurcharge != null ? formatMoney(orderDetail.nightSurcharge) : "0 đ"}</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "6px", marginTop: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phần trăm chiết khấu sàn:</span>
                    <span style={{ fontWeight: "600" }}>{orderDetail.platformFeePercentage ?? "10"}%</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "14px", fontWeight: "800", color: "var(--secondary)" }}>
                    <span>Tổng tiền thực nhận:</span>
                    <span>{formatMoney(orderDetail.totalAmount ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Trạng thái giao dịch</h3>
                {orderDetail.payments && orderDetail.payments.map((p: any) => (
                  <div key={p.paymentId} className="card" style={{ padding: "12px", marginBottom: "8px", display: "grid", gap: "4px" }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: "600", fontSize: "12px" }}>Mã: {p.paymentCode ?? "N/A"}</span>
                      <span className={`badge ${p.status === "SUCCESS" ? "badge--success" : "badge--warning"}`}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Số tiền: {formatMoney(p.amount)} • Cổng: {p.method} • Loại: {p.type}
                    </div>
                    {p.gatewayTransactionId && <div style={{ fontSize: "10px", color: "var(--text-light)" }}>TransID: {p.gatewayTransactionId}</div>}
                  </div>
                ))}
                {(!orderDetail.payments || orderDetail.payments.length === 0) && (
                  <div className="card" style={{ padding: "16px", color: "var(--text-light)", textAlign: "center", fontSize: "13px" }}>Chưa tạo giao dịch thanh toán.</div>
                )}
              </div>
            </div>

            {/* Photos of issue */}
            {orderDetail.issuePhotos && orderDetail.issuePhotos.length > 0 && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Hình ảnh hiện trường sự cố</h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {orderDetail.issuePhotos.map((url: string, index: number) => (
                    <a href={url} target="_blank" rel="noreferrer" key={index}>
                      <img
                        src={url}
                        alt={`Sự cố ${index + 1}`}
                        style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", cursor: "pointer", transition: "0.2s" }}
                        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline logs */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Mốc thời gian xử lý</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", background: "var(--neutral-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div>Tạo đơn: <b>{formatDate(orderDetail.createdAt)}</b></div>
                {orderDetail.acceptedAt && <div>Thợ nhận đơn: <b>{formatDate(orderDetail.acceptedAt)}</b></div>}
                {orderDetail.arrivedAt && <div>Thợ đến nơi: <b>{formatDate(orderDetail.arrivedAt)}</b></div>}
                {orderDetail.completedAt && <div>Hoàn thành: <b>{formatDate(orderDetail.completedAt)}</b></div>}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ color: "var(--danger)" }}>Lỗi không thể tải thông tin đơn.</div>
        )}
      </Modal>
    </div>
  );
}
