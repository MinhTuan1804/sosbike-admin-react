import { useEffect, useMemo, useState } from "react";
import { getDashboardOverview, type DashboardOverviewResponse } from "./dashboardApi";
import { SimpleLineChart } from "../../shared/charts/SimpleLineChart";
import { SimpleStackedBars } from "../../shared/charts/SimpleStackedBars";
import { SimpleDonut } from "../../shared/charts/SimpleDonut";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(v));
}

export function DashboardPage() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await getDashboardOverview({ from: from || undefined, to: to || undefined });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueTotal = useMemo(() => data?.kpis.totalPayments ?? 0, [data]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div style={{ color: "#666", marginTop: 4 }}>
            Range: {data?.range.from ?? "-"} → {data?.range.to ?? "-"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Từ <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="yyyy-MM-dd" />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Đến <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="yyyy-MM-dd" />
          </label>
          <button onClick={refresh} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
        </div>
      </div>

      {data ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#666", fontSize: 12 }}>Tổng thanh toán</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(revenueTotal)} đ</div>
              <div style={{ color: "#666", fontSize: 12 }}>
                Subscription: {formatMoney(data.kpis.totalSubscriptionPayments)} đ · Rescue: {formatMoney(data.kpis.totalRescuePayments)} đ
              </div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#666", fontSize: 12 }}>User mới</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {data.kpis.totalNewCustomers + data.kpis.totalNewMechanics}
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>
                Customer: {data.kpis.totalNewCustomers} · Mechanic: {data.kpis.totalNewMechanics}
              </div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#666", fontSize: 12 }}>Đơn cứu hộ</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{data.kpis.totalOrders}</div>
              <div style={{ color: "#666", fontSize: 12 }}>
                Completed: {data.kpis.totalOrdersCompleted} · Cancelled: {data.kpis.totalOrdersCancelled}
              </div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#666", fontSize: 12 }}>Thời gian TB (phút)</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{Math.round(data.kpis.avgAcceptMins)}</div>
              <div style={{ color: "#666", fontSize: 12 }}>
                Accept: {Math.round(data.kpis.avgAcceptMins)} · Arrive: {Math.round(data.kpis.avgArriveMins)} · Complete:{" "}
                {Math.round(data.kpis.avgCompleteMins)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <h2 style={{ margin: "6px 0" }}>Doanh thu (gross)</h2>
              <SimpleLineChart labels={data.series.labels} values={data.series.revenue.total} />
            </div>
            <div>
              <h2 style={{ margin: "6px 0" }}>User mới (Customer/Mechanic)</h2>
              <SimpleStackedBars
                labels={data.series.labels}
                a={data.series.users.customers}
                b={data.series.users.mechanics}
                aLabel="Customer"
                bLabel="Mechanic"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <h2 style={{ margin: "6px 0" }}>Tỷ lệ đơn</h2>
              <SimpleDonut
                values={[
                  { label: "Completed", value: data.kpis.totalOrdersCompleted, color: "#16a34a" },
                  { label: "Cancelled", value: data.kpis.totalOrdersCancelled, color: "#ef4444" },
                  { label: "Other", value: Math.max(0, data.kpis.totalOrders - data.kpis.totalOrdersCompleted - data.kpis.totalOrdersCancelled), color: "#6b7280" }
                ]}
              />
            </div>
            <div>
              <h2 style={{ margin: "6px 0" }}>Số đơn theo ngày</h2>
              <SimpleLineChart labels={data.series.labels} values={data.series.orders.total} stroke="#111827" />
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: "#666" }}>Chưa có dữ liệu.</div>
      )}
    </div>
  );
}

