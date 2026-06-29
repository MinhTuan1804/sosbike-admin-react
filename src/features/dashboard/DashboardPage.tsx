import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, ChevronRight } from "lucide-react";
import {
  getDashboardOverview,
  exportDashboardOverview,
  type DashboardOverviewResponse,
} from "./dashboardApi";
import { SimpleLineChart } from "../../shared/charts/SimpleLineChart";
import { SimpleStackedBars } from "../../shared/charts/SimpleStackedBars";
import { SimpleDonut } from "../../shared/charts/SimpleDonut";
import {
  exportBlogAnalytics,
  getBlogAnalytics,
  listBlogs,
  type BlogAnalyticsResponse,
  type BlogListItem,
} from "../blogs/blogsApi";
import { useNavigate } from "react-router-dom";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Math.round(v));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [blogAnalyticsLoading, setBlogAnalyticsLoading] = useState(false);
  const [blogAnalyticsError, setBlogAnalyticsError] = useState<string | null>(
    null,
  );
  const [blogAnalytics, setBlogAnalytics] =
    useState<BlogAnalyticsResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  async function refresh() {
    setLoading(true);
    try {
      const res = await getDashboardOverview({
        from: from || undefined,
        to: to || undefined,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  async function refreshBlogs() {
    setBlogLoading(true);
    setBlogError(null);
    try {
      const res = await listBlogs({
        includeDeleted: false,
        page: 1,
        pageSize: 8,
      });
      setBlogs(res.items);
    } catch (err) {
      setBlogs([]);
      setBlogError(err instanceof Error ? err.message : "Không tải được blog");
    } finally {
      setBlogLoading(false);
    }
  }

  async function refreshBlogAnalytics() {
    setBlogAnalyticsLoading(true);
    setBlogAnalyticsError(null);
    try {
      const res = await getBlogAnalytics({
        from: from || undefined,
        to: to || undefined,
        top: 10,
      });
      setBlogAnalytics(res);
    } catch (err) {
      setBlogAnalytics(null);
      setBlogAnalyticsError(
        err instanceof Error ? err.message : "Không tải được thống kê blog",
      );
    } finally {
      setBlogAnalyticsLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.allSettled([
      refresh(),
      refreshBlogs(),
      refreshBlogAnalytics(),
    ]);
  }

  async function downloadDashboardOverview() {
    setExporting(true);
    try {
      const blob = await exportDashboardOverview({
        from: from || undefined,
        to: to || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-overview-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không xuất được Excel.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadBlogAnalytics() {
    try {
      const blob = await exportBlogAnalytics({
        from: from || undefined,
        to: to || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `blog-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không xuất được Excel.");
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueTotal = useMemo(() => data?.kpis.totalPayments ?? 0, [data]);

  return (
    <div style={{ display: "grid", gap: "24px", minWidth: 0, width: "100%", overflowX: "hidden" }}>
      {/* Page Header */}
      <div className="page-header" style={{ flexWrap: "wrap" }}>
        <div className="page-header__info">
          <h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <BarChart3 size={22} style={{ color: "var(--primary)" }} />
              Dashboard
            </span>
          </h1>
          <p>
            Khoảng thời gian:
            <span
              className="badge badge--info"
              style={{
                textTransform: "none",
                fontSize: "11px",
                margin: "0 4px",
              }}
            >
              {data?.range.from ?? "—"}
            </span>
            đến
            <span
              className="badge badge--info"
              style={{
                textTransform: "none",
                fontSize: "11px",
                margin: "0 4px",
              }}
            >
              {data?.range.to ?? "—"}
            </span>
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn--primary"
            onClick={refreshAll}
            disabled={loading}
            id="dashboard-refresh-btn"
          >
            {loading ? "Đang tải..." : "Lọc kết quả"}
          </button>
          <button
            className="btn btn--success"
            onClick={downloadDashboardOverview}
            disabled={exporting}
            id="dashboard-export-btn"
          >
            <Download size={14} />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="filter-bar">
        <div
          className="form-group"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
            marginBottom: 0,
          }}
        >
          <label htmlFor="filter-from" style={{ whiteSpace: "nowrap" }}>
            Từ
          </label>
          <input
            id="filter-from"
            type="date"
            className="input"
            style={{ width: "160px" }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div
          className="form-group"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
            marginBottom: 0,
          }}
        >
          <label htmlFor="filter-to" style={{ whiteSpace: "nowrap" }}>
            Đến
          </label>
          <input
            id="filter-to"
            type="date"
            className="input"
            style={{ width: "160px" }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Menu switcher */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "8px" }}>
        <div className="tabs-list">
          <button 
            className={`tabs-trigger ${activeTab === 'overview' ? 'tabs-trigger--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </button>
          <button 
            className={`tabs-trigger ${activeTab === 'analytics' ? 'tabs-trigger--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Biểu đồ chi tiết
          </button>
          <button 
            className={`tabs-trigger ${activeTab === 'blogs' ? 'tabs-trigger--active' : ''}`}
            onClick={() => setActiveTab('blogs')}
          >
            Bài viết & Landing
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: "grid", gap: "24px" }}>
          {/* Skeleton KPI Grid */}
          <div className="grid-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  height: "148px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "4px",
                    height: "100%",
                    background: "var(--border-color)",
                  }}
                />
                <div
                  className="skeleton"
                  style={{ height: "12px", width: "120px" }}
                />
                <div
                  className="skeleton"
                  style={{ height: "28px", width: "150px", margin: "8px 0" }}
                />
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: "10px", width: "100%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "10px", width: "80%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Blog & Analytics Card */}
          <div
            className="card"
            style={{ display: "grid", gap: "16px", height: "120px" }}
          >
            <div
              className="skeleton"
              style={{ height: "20px", width: "200px" }}
            />
            <div
              className="skeleton"
              style={{ height: "12px", width: "300px" }}
            />
            <div className="grid-4" style={{ marginTop: "12px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    height: "60px",
                    boxShadow: "none",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: "10px", width: "80px" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "16px", width: "100px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : data ? (
        <>
          {activeTab === "overview" && (
            <div className="grid-4">
            {/* KPI Card 1: Revenue */}
            <div
              className="card"
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background: "var(--primary)",
                }}
              />
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Tổng Doanh Thu (Gross)
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  margin: "8px 0",
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(revenueTotal)}
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "4px",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hội viên:</span>
                  <span
                    style={{
                      fontWeight: "600",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(data.kpis.totalSubscriptionPayments)}
                  </span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Đơn cứu hộ:
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(data.kpis.totalRescuePayments)}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: New Users */}
            <div
              className="card"
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background: "#f59e0b",
                }}
              />
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Người dùng mới
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  margin: "8px 0",
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {(
                  data.kpis.totalNewCustomers + data.kpis.totalNewMechanics
                ).toLocaleString()}
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "4px",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Khách hàng:
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {data.kpis.totalNewCustomers.toLocaleString()}
                  </span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Thợ sửa xe:
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {data.kpis.totalNewMechanics.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Card 3: Rescue Orders */}
            <div
              className="card"
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background: "var(--success)",
                }}
              />
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Đơn cứu hộ
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  margin: "8px 0",
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {data.kpis.totalOrders.toLocaleString()}
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "4px",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Hoàn thành:
                  </span>
                  <span
                    style={{
                      color: "var(--success)",
                      fontWeight: "700",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {data.kpis.totalOrdersCompleted.toLocaleString()}
                  </span>
                </div>
                <div className="flex-between" style={{ fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hủy bỏ:</span>
                  <span
                    style={{
                      color: "var(--danger)",
                      fontWeight: "700",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {data.kpis.totalOrdersCancelled.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Card 4: Timing Funnel */}
            <div
              className="card"
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background: "var(--info)",
                }}
              />
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Thời gian TB (Phút)
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  margin: "8px 0",
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(data.kpis.avgCompleteMins)}m
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "var(--text-light)",
                    fontWeight: "bold",
                  }}
                >
                  <span>NHẬN ĐƠN</span>
                  <ChevronRight size={10} />
                  <span>ĐẾN NƠI</span>
                  <ChevronRight size={10} />
                  <span>XONG</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--text-main)",
                    marginTop: "4px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span>{Math.round(data.kpis.avgAcceptMins)}m</span>
                  <ChevronRight
                    size={12}
                    style={{ color: "var(--border-color-hover)" }}
                  />
                  <span>{Math.round(data.kpis.avgArriveMins)}m</span>
                  <ChevronRight
                    size={12}
                    style={{ color: "var(--border-color-hover)" }}
                  />
                  <span>{Math.round(data.kpis.avgCompleteMins)}m</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === "blogs" && (
            <div className="card" style={{ display: "grid", gap: "16px" }}>
            <div
              className="flex-between"
              style={{ flexWrap: "wrap", gap: "12px" }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                  }}
                >
                  Blog & landing content
                </h2>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  Quản lý bài viết hiển thị ở landing page và theo dõi trạng
                  thái xuất bản.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate("/blogs")}
                >
                  Mở trang quản lý Blog
                </button>
                <button
                  className="btn btn--sm"
                  onClick={downloadDashboardOverview}
                  disabled={exporting}
                >
                  {exporting ? "Đang xuất..." : "Xuất Excel"}
                </button>
              </div>
            </div>

            {blogAnalyticsError ? (
              <div
                className="badge badge--danger"
                style={{ textTransform: "none" }}
              >
                {blogAnalyticsError}
              </div>
            ) : null}

            <div className="grid-4">
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Tổng lượt xem
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogAnalytics
                    ? blogAnalytics.totalViews.toLocaleString()
                    : blogAnalyticsLoading
                      ? "..."
                      : "0"}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Unique viewers
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogAnalytics
                    ? blogAnalytics.uniqueViewers.toLocaleString()
                    : blogAnalyticsLoading
                      ? "..."
                      : "0"}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  App / Landing
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--success)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogAnalytics
                    ? `${blogAnalytics.appViews.toLocaleString()} / ${blogAnalytics.landingPageViews.toLocaleString()}`
                    : blogAnalyticsLoading
                      ? "..."
                      : "-"}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Bài nổi bật
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                    lineHeight: 1.3,
                  }}
                >
                  {blogAnalytics?.topBlog?.title ??
                    (blogAnalyticsLoading ? "Đang tải..." : "Chưa có dữ liệu")}
                </div>
              </div>
            </div>

            <div className="grid-4">
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Tổng bài viết
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogs.length.toLocaleString()}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Đã đăng
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--success)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogs
                    .filter((b) => b.ispublished && !b.isdeleted)
                    .length.toLocaleString()}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Nháp
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--warning)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {blogs
                    .filter((b) => !b.ispublished && !b.isdeleted)
                    .length.toLocaleString()}
                </div>
              </div>
              <div
                className="card"
                style={{
                  boxShadow: "none",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Đang tải
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                  }}
                >
                  {blogLoading ? "..." : "OK"}
                </div>
              </div>
            </div>

            {blogAnalytics?.items?.length ? (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Blog</th>
                      <th>View</th>
                      <th>Unique</th>
                      <th>App</th>
                      <th>Landing</th>
                      <th>Lần xem cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogAnalytics.items.slice(0, 5).map((row) => (
                      <tr key={row.blogpostid}>
                        <td style={{ maxWidth: "300px" }}>
                          <div className="truncate" style={{ fontWeight: 700 }} title={row.title}>{row.title}</div>
                          <div
                            className="truncate"
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "12px",
                            }}
                            title={row.slug}
                          >
                            {row.slug}
                          </div>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.viewCount.toLocaleString()}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.uniqueViewers.toLocaleString()}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.appViews.toLocaleString()}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.landingPageViews.toLocaleString()}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {row.lastViewedAt
                            ? new Date(row.lastViewedAt).toLocaleString("vi-VN")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div style={{ overflowX: "auto" }}>
              {blogError ? (
                <div
                  className="badge badge--danger"
                  style={{ marginBottom: "12px", textTransform: "none" }}
                >
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
                      <td className="truncate" style={{ fontWeight: 700, maxWidth: "300px" }} title={blog.title}>{blog.title}</td>
                      <td>{blog.category ?? "-"}</td>
                      <td>
                        <span
                          className={`badge ${blog.isdeleted ? "badge--danger" : blog.ispublished ? "badge--success" : "badge--warning"}`}
                        >
                          {blog.isdeleted
                            ? "Đã xóa"
                            : blog.ispublished
                              ? "Đã đăng"
                              : "Nháp"}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {blog.publishedat
                          ? new Date(blog.publishedat).toLocaleString("vi-VN")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {blogs.length === 0 && !blogLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          color: "var(--text-muted)",
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        Chưa có bài viết nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {activeTab === "overview" && (
            <div className="grid-2" style={{ marginTop: "8px" }}>
            <div className="card">
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  marginBottom: "12px",
                }}
              >
                Biểu đồ Doanh thu (Gross)
              </h2>
              <SimpleLineChart
                labels={data.series.labels}
                values={data.series.revenue.total}
              />
            </div>
            <div className="card">
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  marginBottom: "12px",
                }}
              >
                Tăng trưởng Người dùng (Khách/Thợ)
              </h2>
              <SimpleStackedBars
                labels={data.series.labels}
                a={data.series.users.customers}
                b={data.series.users.mechanics}
                aLabel="Khách hàng"
                bLabel="Thợ cứu hộ"
              />
            </div>
          </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid-2">
            <div className="card">
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  marginBottom: "12px",
                }}
              >
                Tỷ lệ Trạng thái Đơn cứu hộ
              </h2>
              <SimpleDonut
                values={[
                  {
                    label: "Hoàn thành",
                    value: data.kpis.totalOrdersCompleted,
                    color: "var(--success)",
                  },
                  {
                    label: "Đã hủy",
                    value: data.kpis.totalOrdersCancelled,
                    color: "var(--danger)",
                  },
                  {
                    label: "Khác",
                    value: Math.max(
                      0,
                      data.kpis.totalOrders -
                        data.kpis.totalOrdersCompleted -
                        data.kpis.totalOrdersCancelled,
                    ),
                    color: "var(--text-light)",
                  },
                ]}
              />
            </div>
            <div className="card">
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                  marginBottom: "12px",
                }}
              >
                Tần suất Đơn cứu hộ theo ngày
              </h2>
              <SimpleLineChart
                labels={data.series.labels}
                values={data.series.orders.total}
                stroke="var(--secondary)"
              />
            </div>
          </div>
          )}
        </>
      ) : (
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <BarChart3
            size={36}
            style={{ color: "var(--primary)", marginBottom: "16px" }}
          />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--secondary)",
            }}
          >
            Chưa tải được dữ liệu
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Vui lòng bấm nút Tải lại hoặc chọn bộ lọc ngày khác.
          </p>
          <button
            className="btn btn--primary btn--sm mt-12"
            onClick={refreshAll}
          >
            Tải lại dữ liệu
          </button>
        </div>
      )}
    </div>
  );
}
