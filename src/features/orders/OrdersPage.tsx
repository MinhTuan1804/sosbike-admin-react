import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "./ordersApi";

export function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const queryKey = useMemo(() => ["admin-orders", { q, status }], [q, status]);
  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => listOrders({ q: q || undefined, status: status || undefined, page: 1, pageSize: 50 })
  });

  return (
    <div>
      <h1>Đơn cứu hộ</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        <input placeholder="Tìm theo tên/sđt/địa chỉ" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="Status (PENDING/COMPLETED/...)" value={status} onChange={(e) => setStatus(e.target.value)} />
        <button onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
          {ordersQuery.isFetching ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      {ordersQuery.isError ? (
        <div style={{ color: "crimson" }}>{String(ordersQuery.error)}</div>
      ) : ordersQuery.data ? (
        <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th>Status</th>
              <th>Khách</th>
              <th>Thợ</th>
              <th>Địa chỉ</th>
              <th>Tổng tiền</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.data.items.map((o) => (
              <tr key={o.orderId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td>{o.status}</td>
                <td>
                  {o.customerName} ({o.customerPhone})
                </td>
                <td>{o.mechanicName ? `${o.mechanicName} (${o.mechanicPhone})` : "-"}</td>
                <td style={{ maxWidth: 420 }}>{o.requestAddress}</td>
                <td>{o.totalAmount ?? "-"}</td>
                <td>{o.createdAt ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>Đang tải...</div>
      )}
    </div>
  );
}
