import { useEffect, useState } from "react";
import { Modal } from "../../shared/components/Modal";
import {
  CampaignListItem,
  EmailLogItem,
  CampaignDetailResponse,
  CreateCampaignPayload,
  DashboardStatsResponse,
  listCampaigns,
  getCampaignDetail,
  createCampaign,
  getDashboardStats
} from "./emailCampaignsApi";
import {
  Mail,
  Plus,
  Search,
  Send,
  CheckCircle,
  AlertTriangle,
  Percent,
  Eye,
  MousePointerClick,
  Activity,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw
} from "lucide-react";

export function EmailCampaignsPage() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");
  
  // Data list states
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // Global Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Detail view states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<CampaignDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailStatusFilter, setDetailStatusFilter] = useState("");
  const [detailSearch, setDetailSearch] = useState("");
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 10;

  // Create Campaign Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCampaignPayload>({
    name: "",
    subject: "",
    bodyHtml: "",
    recipients: []
  });
  const [recipientText, setRecipientText] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Load Campaigns list
  async function loadCampaignsList() {
    setLoading(true);
    try {
      const data = await listCampaigns(currentPage, pageSize);
      setCampaigns(data.items);
      setTotalCampaigns(data.total);
    } catch (err) {
      console.error("Lỗi khi tải danh sách chiến dịch:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load Global Stats
  async function loadGlobalStats() {
    setStatsLoading(true);
    try {
      const data = await getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error("Lỗi khi tải thống kê email:", err);
    } finally {
      setStatsLoading(false);
    }
  }

  // Load Campaign Detail
  async function loadCampaignDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await getCampaignDetail(id, {
        status: detailStatusFilter || undefined,
        q: detailSearch || undefined,
        page: detailPage,
        pageSize: detailPageSize
      });
      setDetailData(data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết chiến dịch:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  // Hook reload lists
  useEffect(() => {
    loadCampaignsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    loadGlobalStats();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadCampaignDetail(selectedCampaignId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, detailPage, detailStatusFilter]);

  // Handle Detail Search click
  const handleDetailSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailPage(1);
    if (selectedCampaignId) {
      loadCampaignDetail(selectedCampaignId);
    }
  };

  // Submit Create Campaign Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!createForm.name.trim()) return setFormError("Vui lòng nhập tên chiến dịch");
    if (!createForm.subject.trim()) return setFormError("Vui lòng nhập tiêu đề email");
    if (!createForm.bodyHtml.trim()) return setFormError("Vui lòng nhập nội dung HTML");
    
    const emails = recipientText
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      return setFormError("Vui lòng nhập ít nhất một địa chỉ email hợp lệ");
    }

    setCreating(true);
    try {
      await createCampaign({
        ...createForm,
        recipients: emails
      });
      setCreateModalOpen(false);
      setCreateForm({ name: "", subject: "", bodyHtml: "", recipients: [] });
      setRecipientText("");
      setCurrentPage(1);
      loadCampaignsList();
      loadGlobalStats();
    } catch (err: any) {
      setFormError(err.response?.data || "Đã xảy ra lỗi khi tạo chiến dịch");
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mail size={28} style={{ color: "var(--info)" }} />
            Email Campaigns
          </h1>
          <p>Quản lý chiến dịch email marketing và theo dõi hiệu suất gửi tin theo thời gian thực.</p>
        </div>
        <div className="page-header__actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => {
              loadCampaignsList();
              loadGlobalStats();
            }}
            className="btn btn--ghost"
            style={{ padding: "8px 12px" }}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn--primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <button
          onClick={() => setActiveTab("list")}
          className={`btn ${activeTab === "list" ? "btn--primary" : "btn--ghost"}`}
          style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: "600" }}
        >
          Danh sách chiến dịch
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`btn ${activeTab === "stats" ? "btn--primary" : "btn--ghost"}`}
          style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: "600" }}
        >
          Thống kê tổng quan (Dashboard)
        </button>
      </div>

      {/* Tab 1: Campaigns List */}
      {activeTab === "list" && (
        <div style={{ display: "grid", gap: "20px" }}>
          
          {/* Quick Metrics (stat-grid) */}
          {dashboardStats && (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card__accent" style={{ backgroundColor: "var(--info)" }} />
                <span className="stat-card__label">TỔNG EMAIL GỬI</span>
                <h3 className="stat-card__value">{dashboardStats.stats.totalSent.toLocaleString("vi-VN")}</h3>
                <div className="stat-card__footer">
                  Đã giao thành công: {dashboardStats.stats.totalDelivered.toLocaleString("vi-VN")}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__accent" style={{ backgroundColor: "var(--success)" }} />
                <span className="stat-card__label">TỶ LỆ MỞ (OPEN RATE)</span>
                <h3 className="stat-card__value" style={{ color: "var(--success)" }}>{dashboardStats.stats.openRate}%</h3>
                <div className="stat-card__footer">
                  {dashboardStats.stats.totalOpened.toLocaleString("vi-VN")} lượt mở email
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__accent" style={{ backgroundColor: "var(--indigo-500)" }} />
                <span className="stat-card__label">TỶ LỆ CLICK (CLICK RATE)</span>
                <h3 className="stat-card__value" style={{ color: "var(--indigo-500)" }}>{dashboardStats.stats.clickRate}%</h3>
                <div className="stat-card__footer">
                  {dashboardStats.stats.totalClicked.toLocaleString("vi-VN")} lượt bấm link
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__accent" style={{ backgroundColor: "var(--danger)" }} />
                <span className="stat-card__label">TỶ LỆ LỖI (BOUNCE RATE)</span>
                <h3 className="stat-card__value" style={{ color: "var(--danger)" }}>{dashboardStats.stats.bounceRate}%</h3>
                <div className="stat-card__footer">
                  Bị trả về: {dashboardStats.stats.totalBounced.toLocaleString("vi-VN")}
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="card" style={{ padding: "0px", overflow: "hidden" }}>
            <div className="table-container">
              <table className="table table--striped">
                <thead>
                  <tr>
                    <th>Tên chiến dịch / Tiêu đề</th>
                    <th style={{ textAlign: "center" }}>Trạng thái</th>
                    <th style={{ textAlign: "center" }}>Đã gửi</th>
                    <th style={{ textAlign: "center" }}>Thành công</th>
                    <th style={{ textAlign: "center" }}>Đã mở</th>
                    <th style={{ textAlign: "center" }}>Đã click</th>
                    <th style={{ textAlign: "center" }}>Lỗi (Bounce)</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <Activity className="animate-spin" style={{ margin: "0 auto 10px", color: "var(--info)" }} />
                        Đang tải danh sách chiến dịch...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        Không có chiến dịch nào được tìm thấy. Nhấn nút "Tạo chiến dịch mới" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.campaignId}>
                        <td style={{ verticalAlign: "middle" }}>
                          <div
                            style={{ fontWeight: "700", color: "var(--text-main)", cursor: "pointer" }}
                            onClick={() => setSelectedCampaignId(c.campaignId)}
                            className="hover-underline"
                          >
                            {c.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Subject: {c.subject}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                          <span className={`badge ${
                            c.status === "completed"
                              ? "badge--success"
                              : c.status === "sending"
                              ? "badge--warning"
                              : "badge--info"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "700", verticalAlign: "middle" }}>
                          {c.totalSent.toLocaleString("vi-VN")}
                        </td>
                        <td style={{ textAlign: "center", color: "var(--text-main)", verticalAlign: "middle" }}>
                          {c.totalDelivered.toLocaleString("vi-VN")}
                        </td>
                        <td style={{ textAlign: "center", color: "var(--success)", fontWeight: "600", verticalAlign: "middle" }}>
                          {c.totalOpened.toLocaleString("vi-VN")}
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", fontWeight: "normal" }}>
                            ({c.totalSent > 0 ? Math.round((c.totalOpened / c.totalSent) * 100) : 0}%)
                          </span>
                        </td>
                        <td style={{ textAlign: "center", color: "var(--info)", fontWeight: "600", verticalAlign: "middle" }}>
                          {c.totalClicked.toLocaleString("vi-VN")}
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", fontWeight: "normal" }}>
                            ({c.totalSent > 0 ? Math.round((c.totalClicked / c.totalSent) * 100) : 0}%)
                          </span>
                        </td>
                        <td style={{ textAlign: "center", color: "var(--danger)", verticalAlign: "middle" }}>
                          {c.totalBounced.toLocaleString("vi-VN")}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)", verticalAlign: "middle" }}>
                          {formatDateTime(c.createdAt)}
                        </td>
                        <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                          <button
                            onClick={() => setSelectedCampaignId(c.campaignId)}
                            className="btn btn--ghost btn--sm"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={14} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCampaigns > pageSize && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--primary-light)" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Trang {currentPage} / {Math.ceil(totalCampaigns / pageSize)} (Tổng cộng {totalCampaigns} chiến dịch)
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="btn btn--ghost btn--sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage >= Math.ceil(totalCampaigns / pageSize) || loading}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="btn btn--ghost btn--sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Dashboard Stats Details */}
      {activeTab === "stats" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {statsLoading || !dashboardStats ? (
            <div className="card" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <Activity className="animate-spin" style={{ margin: "0 auto 10px", color: "var(--info)" }} />
              Đang tải báo cáo thống kê...
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="stat-card">
                  <div className="stat-card__accent" style={{ backgroundColor: "var(--primary)" }} />
                  <span className="stat-card__label">TỔNG EMAIL GỬI</span>
                  <h3 className="stat-card__value">{dashboardStats.stats.totalSent.toLocaleString("vi-VN")}</h3>
                </div>

                <div className="stat-card">
                  <div className="stat-card__accent" style={{ backgroundColor: "var(--success)" }} />
                  <span className="stat-card__label">ĐÃ NHẬN (DELIVERED)</span>
                  <h3 className="stat-card__value" style={{ color: "var(--success)" }}>
                    {dashboardStats.stats.totalDelivered.toLocaleString("vi-VN")}
                  </h3>
                  <div className="stat-card__footer">
                    Tỷ lệ: {dashboardStats.stats.totalSent > 0 ? Math.round((dashboardStats.stats.totalDelivered / dashboardStats.stats.totalSent) * 100) : 0}%
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card__accent" style={{ backgroundColor: "var(--info)" }} />
                  <span className="stat-card__label">TỶ LỆ MỞ (OPEN RATE)</span>
                  <h3 className="stat-card__value" style={{ color: "var(--info)" }}>{dashboardStats.stats.openRate}%</h3>
                  <div className="stat-card__footer">
                    {dashboardStats.stats.totalOpened.toLocaleString("vi-VN")} email đã mở
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card__accent" style={{ backgroundColor: "var(--indigo-500)" }} />
                  <span className="stat-card__label">TỶ LỆ CLICK (CLICK RATE)</span>
                  <h3 className="stat-card__value" style={{ color: "var(--indigo-500)" }}>{dashboardStats.stats.clickRate}%</h3>
                  <div className="stat-card__footer">
                    {dashboardStats.stats.totalClicked.toLocaleString("vi-VN")} click link
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card__accent" style={{ backgroundColor: "var(--danger)" }} />
                  <span className="stat-card__label">BOUNCE & COMPLAINT</span>
                  <h3 className="stat-card__value" style={{ color: "var(--danger)" }}>
                    {(dashboardStats.stats.totalBounced + dashboardStats.stats.totalComplained).toLocaleString("vi-VN")}
                  </h3>
                  <div className="stat-card__footer">
                    Bounce: {dashboardStats.stats.totalBounced} | Spam: {dashboardStats.stats.totalComplained}
                  </div>
                </div>
              </div>

              {/* Chart visualization */}
              <div className="card" style={{ padding: "24px" }}>
                <h3 className="card__title" style={{ marginBottom: "20px" }}>Hiệu suất gửi email 7 ngày gần nhất</h3>
                
                {dashboardStats.chartData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Chưa có dữ liệu thống kê theo ngày.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div style={{ display: "grid", gap: "16px" }}>
                      {dashboardStats.chartData.map((d) => {
                        const maxVal = Math.max(...dashboardStats.chartData.map(x => x.sent), 1);
                        const sentPct = (d.sent / maxVal) * 100;
                        const openedPct = (d.opened / maxVal) * 100;
                        const clickedPct = (d.clicked / maxVal) * 100;

                        return (
                          <div key={d.date} style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-main)" }}>{d.date}</div>
                            
                            <div style={{ display: "grid", gap: "6px" }}>
                              {/* Sent bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "80px", fontSize: "11px", color: "var(--text-muted)" }}>Gửi: {d.sent}</div>
                                <div style={{ flex: 1, height: "8px", backgroundColor: "var(--primary-light)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", backgroundColor: "var(--text-muted)", width: `${sentPct}%`, borderRadius: "4px" }} />
                                </div>
                              </div>
                              {/* Opened bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "80px", fontSize: "11px", color: "var(--success)", fontWeight: "600" }}>Mở: {d.opened}</div>
                                <div style={{ flex: 1, height: "8px", backgroundColor: "var(--primary-light)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", backgroundColor: "var(--success)", width: `${openedPct}%`, borderRadius: "4px" }} />
                                </div>
                              </div>
                              {/* Clicked bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "80px", fontSize: "11px", color: "var(--info)", fontWeight: "600" }}>Click: {d.clicked}</div>
                                <div style={{ flex: 1, height: "8px", backgroundColor: "var(--primary-light)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", backgroundColor: "var(--info)", width: `${clickedPct}%`, borderRadius: "4px" }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal View */}
      {selectedCampaignId && (
        <Modal
          isOpen={!!selectedCampaignId}
          onClose={() => {
            setSelectedCampaignId(null);
            setDetailData(null);
            setDetailStatusFilter("");
            setDetailSearch("");
            setDetailPage(1);
          }}
          title="Chi tiết chiến dịch email"
          size="lg"
        >
          {detailLoading && !detailData ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Activity className="animate-spin" style={{ margin: "0 auto 10px", color: "var(--info)" }} />
              Đang tải thông tin chi tiết...
            </div>
          ) : !detailData ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
              Không tìm thấy dữ liệu chiến dịch.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px", maxHeight: "80vh", overflowY: "auto", paddingRight: "4px" }}>
              
              {/* Campaign summary card */}
              <div className="card" style={{ padding: "20px", backgroundColor: "var(--primary-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)" }}>{detailData.campaignInfo.name}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                      <strong>Tiêu đề:</strong> {detailData.campaignInfo.subject}
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                    {formatDateTime(detailData.campaignInfo.createdAt)}
                  </span>
                </div>

                {/* Campaign Rates Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Gửi thành công</span>
                    <strong style={{ fontSize: "16px", color: "var(--text-main)" }}>
                      {detailData.stats.totalDelivered}/{detailData.stats.totalSent}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--success)", display: "block", fontWeight: "600" }}>Tỷ lệ Mở</span>
                    <strong style={{ fontSize: "16px", color: "var(--success)" }}>{detailData.stats.openRate}%</strong>
                    <span style={{ fontSize: "10px", color: "var(--text-light)", display: "block" }}>({detailData.stats.totalOpened} email)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--info)", display: "block", fontWeight: "600" }}>Tỷ lệ Click</span>
                    <strong style={{ fontSize: "16px", color: "var(--info)" }}>{detailData.stats.clickRate}%</strong>
                    <span style={{ fontSize: "10px", color: "var(--text-light)", display: "block" }}>({detailData.stats.totalClicked} click)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--danger)", display: "block" }}>Lỗi (Bounce)</span>
                    <strong style={{ fontSize: "16px", color: "var(--danger)" }}>{detailData.stats.bounceRate}%</strong>
                    <span style={{ fontSize: "10px", color: "var(--text-light)", display: "block" }}>({detailData.stats.totalBounced} lỗi)</span>
                  </div>
                </div>
              </div>

              {/* Accordion HTML body preview */}
              <details style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--card-bg)" }}>
                <summary style={{ padding: "12px 16px", fontWeight: "700", fontSize: "13px", color: "var(--text-main)", cursor: "pointer", userSelect: "none" }}>
                  Xem mẫu nội dung HTML đã gửi
                </summary>
                <div style={{ padding: "16px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--primary-light)" }}>
                  <div
                    style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", backgroundColor: "#fff", color: "#333" }}
                    dangerouslySetInnerHTML={{ __html: detailData.campaignInfo.bodyHtml }}
                  />
                </div>
              </details>

              {/* Recipients list Section */}
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <h4 style={{ fontWeight: "700", color: "var(--text-main)", margin: "0" }}>
                    Danh sách người nhận ({detailData.recipients.total})
                  </h4>
                  
                  {/* Filters form */}
                  <form onSubmit={handleDetailSearchSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <select
                      value={detailStatusFilter}
                      onChange={(e) => {
                        setDetailStatusFilter(e.target.value);
                        setDetailPage(1);
                      }}
                      className="input"
                      style={{ padding: "4px 8px", fontSize: "12px", width: "150px", height: "auto" }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="sending">Đang gửi (sending)</option>
                      <option value="sent">Đã gửi (sent)</option>
                      <option value="delivered">Đã nhận (delivered)</option>
                      <option value="opened">Đã mở (opened)</option>
                      <option value="clicked">Đã click (clicked)</option>
                      <option value="bounced">Bị trả về (bounced)</option>
                      <option value="complained">Báo cáo spam (complained)</option>
                      <option value="failed">Gửi thất bại (failed)</option>
                    </select>

                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Tìm email..."
                        value={detailSearch}
                        onChange={(e) => setDetailSearch(e.target.value)}
                        className="input"
                        style={{ padding: "4px 8px 4px 26px", fontSize: "12px", width: "160px", height: "auto" }}
                      />
                      <Search size={12} style={{ position: "absolute", left: "8px", top: "8px", color: "var(--text-light)" }} />
                    </div>
                  </form>
                </div>

                {/* Recipients Table */}
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="table table--striped" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Địa chỉ Email</th>
                        <th style={{ textAlign: "center" }}>Trạng thái</th>
                        <th>Resend ID</th>
                        <th>Thời gian tương tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.recipients.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                            Không tìm thấy người nhận nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        detailData.recipients.items.map((log) => (
                          <tr key={log.emailLogId}>
                            <td style={{ fontWeight: "600", color: "var(--text-main)" }}>
                              {log.recipientEmail}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`badge ${
                                log.status === "opened" || log.status === "clicked"
                                  ? "badge--info"
                                  : log.status === "delivered"
                                  ? "badge--success"
                                  : log.status === "bounced" || log.status === "failed" || log.status === "complained"
                                  ? "badge--danger"
                                  : "badge--primary"
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                              {log.resendEmailId || "-"}
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                              {log.sentAt && <div>📤 Gửi: {formatDateTime(log.sentAt)}</div>}
                              {log.deliveredAt && <div>📥 Nhận: {formatDateTime(log.deliveredAt)}</div>}
                              {log.openedAt && <div style={{ color: "var(--success)", fontWeight: "600" }}>👁️ Mở: {formatDateTime(log.openedAt)}</div>}
                              {log.clickedAt && <div style={{ color: "var(--info)", fontWeight: "600" }}>🖱️ Click: {formatDateTime(log.clickedAt)}</div>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Recipients pagination controls */}
                {detailData.recipients.total > detailPageSize && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                      Trang {detailPage} / {Math.ceil(detailData.recipients.total / detailPageSize)}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        disabled={detailPage === 1 || detailLoading}
                        onClick={() => setDetailPage(prev => prev - 1)}
                        className="btn btn--ghost btn--sm"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                      >
                        Trước
                      </button>
                      <button
                        disabled={detailPage >= Math.ceil(detailData.recipients.total / detailPageSize) || detailLoading}
                        onClick={() => setDetailPage(prev => prev + 1)}
                        className="btn btn--ghost btn--sm"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => {
            if (!creating) {
              setCreateModalOpen(false);
              setFormError("");
            }
          }}
          title="Tạo chiến dịch gửi email mới"
          size="lg"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "grid", gap: "16px", maxHeight: "80vh", overflowY: "auto", paddingRight: "4px" }}>
            {formError && (
              <div className="badge badge--danger" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", width: "100%", borderRadius: "var(--radius-md)", fontSize: "12px" }}>
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <div className="form-group">
              <label>Tên chiến dịch</label>
              <input
                type="text"
                placeholder="Ví dụ: Chiến dịch tri ân khách hàng tháng 7"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="input"
                disabled={creating}
              />
            </div>

            <div className="form-group">
              <label>Tiêu đề Email</label>
              <input
                type="text"
                placeholder="Ví dụ: Quà tặng hấp dẫn chỉ dành riêng cho bạn!"
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                className="input"
                disabled={creating}
              />
            </div>

            <div className="form-group">
              <label>Danh sách Email người nhận</label>
              <textarea
                placeholder="Nhập danh sách email nhận. Phân tách bằng dấu phẩy, dấu chấm phẩy hoặc xuống dòng.&#10;Ví dụ:&#10;user1@gmail.com&#10;user2@gmail.com"
                value={recipientText}
                onChange={(e) => setRecipientText(e.target.value)}
                rows={4}
                className="input"
                style={{ fontFamily: "monospace", height: "auto" }}
                disabled={creating}
              />
            </div>

            <div className="form-group">
              <label>Nội dung HTML của Email</label>
              <textarea
                placeholder="<h1>Chào bạn!</h1><p>Đây là nội dung email của bạn với các thẻ HTML...</p>"
                value={createForm.bodyHtml}
                onChange={(e) => setCreateForm({ ...createForm, bodyHtml: e.target.value })}
                rows={6}
                className="input"
                style={{ fontFamily: "monospace", height: "auto" }}
                disabled={creating}
              />
            </div>

            {createForm.bodyHtml.trim() && (
              <details style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--card-bg)" }}>
                <summary style={{ padding: "8px 12px", fontWeight: "600", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
                  Xem trước giao diện Email (Preview)
                </summary>
                <div style={{ padding: "12px", borderTop: "1px solid var(--border-color)", backgroundColor: "#fff" }}>
                  <div
                    style={{ maxHeight: "200px", overflowY: "auto", padding: "12px", textAlign: "left", color: "#333", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)" }}
                    dangerouslySetInnerHTML={{ __html: createForm.bodyHtml }}
                  />
                </div>
              </details>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="btn btn--ghost"
                disabled={creating}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Activity className="animate-spin" size={14} /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Bắt đầu gửi
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
