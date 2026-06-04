import { useEffect, useMemo, useState } from "react";
import { getDashboardOverview, type DashboardOverviewResponse } from "./dashboardApi";
import { SimpleLineChart } from "../../shared/charts/SimpleLineChart";
import { SimpleStackedBars } from "../../shared/charts/SimpleStackedBars";
import { SimpleDonut } from "../../shared/charts/SimpleDonut";
import { listBlogs, type BlogListItem } from "../blogs/blogsApi";
import { useNavigate } from "react-router-dom";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await getDashboardOverview({ from: from || undefined, to: to || undefined });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  async function refreshBlogs() {
    setBlogLoading(true);
    setBlogError(null);
    try {
      const res = await listBlogs({ includeDeleted: false, page: 1, pageSize: 8 });
      setBlogs(res.items);
    } catch (err) {
      setBlogs([]);
      setBlogError(err instanceof Error ? err.message : "Không tải được blog");
    } finally {
      setBlogLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    refreshBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueTotal = useMemo(() => data?.kpis.totalPayments ?? 0, [data]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Header and Filter Row */}
      <div className="flex-between" style={{ flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Dashboard</h1>
          <div style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "13px", fontWeight: 500 }}>
            Khoảng thời gian: <span className="badge badge--info" style={{ textTransform: "none", fontSize: "11px" }}>{data?.range.from ?? "-"}</span> đến <span className="badge badge--info" style={{ textTransform: "none", fontSize: "11px" }}>{data?.range.to ?? "-"}</span>
          </div>
        </div>
        
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", background: "var(--card-bg)", padding: "8px 16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex-gap">
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Từ</span>
            <input 
              type="date" 
              className="input" 
              style={{ padding: "6px 12px", width: "140px", fontSize: "12px" }}
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
          </div>
          <div className="flex-gap">
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Đến</span>
            <input 
              type="date" 
              className="input" 
              style={{ padding: "6px 12px", width: "140px", fontSize: "12px" }}
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
          </div>
          <button 
            className="btn btn--primary btn--sm" 
            onClick={refresh} 
            disabled={loading}
            style={{ padding: "8px 16px" }}
          >
            {loading ? "Đang tải..." : "Lọc kết quả"}
          </button>
        </div>
      </div>

      {data ? (
        <>
          {/* KPI Dashboard Grid */}
          <div className="grid-4">
            {/* KPI Card 1: Revenue */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--primary)" }} />
              <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tổng Doanh Thu (Gross)</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)", margin: "8px 0", letterSpacing: "-0.02em" }}>
                {formatMoney(revenueTotal)}
              </div>
              <div style={{ display: "grid", gap: "4px", borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px" }}>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hội viên:</span>
                  <span style={{ fontWeight: "600" }}>{formatMoney(data.kpis.totalSubscriptionPayments)}</span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Đơn cứu hộ:</span>
                  <span style={{ fontWeight: "600" }}>{formatMoney(data.kpis.totalRescuePayments)}</span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: New Users */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "#f59e0b" }} />
              <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Người dùng mới</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)", margin: "8px 0", letterSpacing: "-0.02em" }}>
                {(data.kpis.totalNewCustomers + data.kpis.totalNewMechanics).toLocaleString()}
              </div>
              <div style={{ display: "grid", gap: "4px", borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px" }}>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Khách hàng:</span>
                  <span style={{ fontWeight: "600" }}>{data.kpis.totalNewCustomers.toLocaleString()}</span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Thợ sửa xe:</span>
                  <span style={{ fontWeight: "600" }}>{data.kpis.totalNewMechanics.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* KPI Card 3: Rescue Orders */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--success)" }} />
              <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Đơn cứu hộ</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)", margin: "8px 0", letterSpacing: "-0.02em" }}>
                {data.kpis.totalOrders.toLocaleString()}
              </div>
              <div style={{ display: "grid", gap: "4px", borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px" }}>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hoàn thành:</span>
                  <span style={{ color: "var(--success)", fontWeight: "700" }}>{data.kpis.totalOrdersCompleted.toLocaleString()}</span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hủy bỏ:</span>
                  <span style={{ color: "var(--danger)", fontWeight: "700" }}>{data.kpis.totalOrdersCancelled.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* KPI Card 4: Timing Funnel */}
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--info)" }} />
              <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Thời gian TB (Phút)</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)", margin: "8px 0", letterSpacing: "-0.02em" }}>
                {Math.round(data.kpis.avgCompleteMins)}m
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--text-light)", fontWeight: "bold" }}>
                  <span>NHẬN ĐƠN</span>
                  <span>➔</span>
                  <span>ĐẾN NƠI</span>
                  <span>➔</span>
                  <span>XONG</span>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "var(--text-main)", marginTop: "4px" }}>
                  <span>{Math.round(data.kpis.avgAcceptMins)}m</span>
                  <span style={{ color: "var(--border-color-hover)" }}>➔</span>
                  <span>{Math.round(data.kpis.avgArriveMins)}m</span>
                  <span style={{ color: "var(--border-color-hover)" }}>➔</span>
                  <span>{Math.round(data.kpis.avgCompleteMins)}m</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: "grid", gap: "16px" }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--secondary)" }}>Blog & landing content</h2>
                <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                  Quản lý bài viết hiển thị ở landing page và theo dõi trạng thái xuất bản.
                </div>
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => navigate("/blogs")}>
                Mở trang quản lý Blog
              </button>
            </div>

            <div className="grid-4">
              <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Tổng bài viết</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)" }}>{blogs.length.toLocaleString()}</div>
              </div>
              <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Đã đăng</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--success)" }}>
                  {blogs.filter((b) => b.ispublished && !b.isdeleted).length.toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Nháp</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--warning)" }}>
                  {blogs.filter((b) => !b.ispublished && !b.isdeleted).length.toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Đang tải</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--secondary)" }}>
                  {blogLoading ? "..." : "OK"}
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {blogError ? (
                <div className="badge badge--danger" style={{ marginBottom: "12px", textTransform: "none" }}>
                  {blogError}
                </div>
              ) : null}
              <table className="table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Danh mục</th>
                    <th>Trạng thái</th>
                    <th>Xuất bản</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.slice(0, 5).map((blog) => (
                    <tr key={blog.blogpostid}>
                      <td style={{ fontWeight: 700 }}>{blog.title}</td>
                      <td>{blog.category ?? "-"}</td>
                      <td>
                        <span className={`badge ${blog.isdeleted ? "badge--danger" : blog.ispublished ? "badge--success" : "badge--warning"}`}>
                          {blog.isdeleted ? "Đã xóa" : blog.ispublished ? "Đã đăng" : "Nháp"}
                        </span>
                      </td>
                      <td>{blog.publishedat ? new Date(blog.publishedat).toLocaleString("vi-VN") : "-"}</td>
                    </tr>
                  ))}
                  {blogs.length === 0 && !blogLoading ? (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                        Chưa có bài viết nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid-2" style={{ marginTop: "8px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)", marginBottom: "12px" }}>Biểu đồ Doanh thu (Gross)</h2>
              <SimpleLineChart labels={data.series.labels} values={data.series.revenue.total} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)", marginBottom: "12px" }}>Tăng trưởng Người dùng (Khách/Thợ)</h2>
              <SimpleStackedBars
                labels={data.series.labels}
                a={data.series.users.customers}
                b={data.series.users.mechanics}
                aLabel="Khách hàng"
                bLabel="Thợ cứu hộ"
              />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid-2">
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)", marginBottom: "12px" }}>Tỷ lệ Trạng thái Đơn cứu hộ</h2>
              <SimpleDonut
                values={[
                  { label: "Hoàn thành", value: data.kpis.totalOrdersCompleted, color: "var(--success)" },
                  { label: "Đã hủy", value: data.kpis.totalOrdersCancelled, color: "var(--danger)" },
                  { label: "Khác", value: Math.max(0, data.kpis.totalOrders - data.kpis.totalOrdersCompleted - data.kpis.totalOrdersCancelled), color: "var(--text-light)" }
                ]}
              />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)", marginBottom: "12px" }}>Tần suất Đơn cứu hộ theo ngày</h2>
              <SimpleLineChart labels={data.series.labels} values={data.series.orders.total} stroke="var(--secondary)" />
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>📊</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--secondary)" }}>Chưa tải được dữ liệu</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Vui lòng bấm nút Tải lại hoặc chọn bộ lọc ngày khác.</p>
          <button className="btn btn--primary btn--sm mt-12" onClick={refresh}>Tải lại dữ liệu</button>
        </div>
      )}
    </div>
  );
}
