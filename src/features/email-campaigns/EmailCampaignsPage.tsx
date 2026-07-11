import { useEffect, useState } from "react";
import { http } from "../../shared/http";
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
  FileText,
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
    
    // Phân tích danh sách người nhận
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
      // Reset form
      setCreateForm({ name: "", subject: "", bodyHtml: "", recipients: [] });
      setRecipientText("");
      // Reload lists
      setCurrentPage(1);
      loadCampaignsList();
      loadGlobalStats();
    } catch (err: any) {
      setFormError(err.response?.data || "Đã xảy ra lỗi khi tạo chiến dịch");
    } finally {
      setCreating(false);
    }
  };

  // Helper formats Date
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
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto transition-all duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
            Email Campaigns
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý chiến dịch email marketing và theo dõi hiệu suất gửi tin theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadCampaignsList();
              loadGlobalStats();
            }}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-5 w-5" />
            Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "list"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Danh sách chiến dịch
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "stats"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Thống kê tổng quan (Dashboard)
        </button>
      </div>

      {/* Tab 1: Campaigns List */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Dashboard summary quick view */}
          {dashboardStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tổng email gửi</span>
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Send className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {dashboardStats.stats.totalSent.toLocaleString("vi-VN")}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Đã giao vận thành công: {dashboardStats.stats.totalDelivered.toLocaleString("vi-VN")}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tỷ lệ Mở (Open Rate)</span>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Percent className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {dashboardStats.stats.openRate}%
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{dashboardStats.stats.totalOpened.toLocaleString("vi-VN")} lượt mở email</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tỷ lệ Click (Click Rate)</span>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {dashboardStats.stats.clickRate}%
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{dashboardStats.stats.totalClicked.toLocaleString("vi-VN")} lượt bấm link</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tỷ lệ Bị Trả (Bounce)</span>
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {dashboardStats.stats.bounceRate}%
                </h3>
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">Bị lỗi hòm thư: {dashboardStats.stats.totalBounced.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          )}

          {/* Campaigns list table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Tên chiến dịch / Tiêu đề</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Đã gửi</th>
                    <th className="py-4 px-6 text-center">Delivered</th>
                    <th className="py-4 px-6 text-center">Opened</th>
                    <th className="py-4 px-6 text-center">Clicked</th>
                    <th className="py-4 px-6 text-center">Bounced</th>
                    <th className="py-4 px-6">Ngày tạo</th>
                    <th className="py-4 px-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {loading && campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500">
                        <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                        Đang tải danh sách chiến dịch...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500">
                        Không có chiến dịch nào được tìm thấy. Nhấn nút "Tạo chiến dịch mới" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.campaignId} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer" onClick={() => setSelectedCampaignId(c.campaignId)}>
                            {c.name}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                            Subject: {c.subject}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30"
                              : c.status === "sending"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 animate-pulse"
                              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-center text-gray-900 dark:text-white">
                          {c.totalSent.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">
                          {c.totalDelivered.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                          {c.totalOpened.toLocaleString("vi-VN")}
                          <span className="text-xs font-normal text-gray-400 block">
                            ({c.totalSent > 0 ? Math.round((c.totalOpened / c.totalSent) * 100) : 0}%)
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-blue-600 dark:text-blue-400 font-semibold">
                          {c.totalClicked.toLocaleString("vi-VN")}
                          <span className="text-xs font-normal text-gray-400 block">
                            ({c.totalSent > 0 ? Math.round((c.totalClicked / c.totalSent) * 100) : 0}%)
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-rose-500 dark:text-rose-400">
                          {c.totalBounced.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDateTime(c.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCampaignId(c.campaignId)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/20 py-1.5 px-3 rounded-md transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCampaigns > pageSize && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/40">
                <span className="text-xs text-gray-400">
                  Hiển thị trang {currentPage} trên {Math.ceil(totalCampaigns / pageSize)} (Tổng cộng {totalCampaigns} chiến dịch)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentPage >= Math.ceil(totalCampaigns / pageSize) || loading}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Dashboard Analytics Details */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {statsLoading || !dashboardStats ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Đang tải báo cáo phân tích tổng thể...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat card detailed */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng email đã gửi</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                    {dashboardStats.stats.totalSent.toLocaleString("vi-VN")}
                  </h3>
                  <div className="h-1 w-full bg-indigo-100 dark:bg-indigo-950 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-400" style={{ width: "100%" }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thành công (Delivered)</p>
                  <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {dashboardStats.stats.totalDelivered.toLocaleString("vi-VN")}
                  </h3>
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${dashboardStats.stats.totalSent > 0 ? (dashboardStats.stats.totalDelivered / dashboardStats.stats.totalSent) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã mở (Open Rate)</p>
                  <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {dashboardStats.stats.openRate}%
                  </h3>
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${dashboardStats.stats.openRate}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã Click (Click Rate)</p>
                  <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {dashboardStats.stats.clickRate}%
                  </h3>
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${dashboardStats.stats.clickRate}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl shadow-sm col-span-2 lg:col-span-1">
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Bị Báo Hỏng/Spam</p>
                  <h3 className="text-3xl font-black text-rose-500 mt-1">
                    {(dashboardStats.stats.totalBounced + dashboardStats.stats.totalComplained).toLocaleString("vi-VN")}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Bounce: {dashboardStats.stats.totalBounced} | Spam: {dashboardStats.stats.totalComplained}
                  </p>
                </div>
              </div>

              {/* CSS based Chart visualization (7 days stats) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Thống kê gửi email 7 ngày gần nhất</h3>
                
                {dashboardStats.chartData.length === 0 ? (
                  <p className="text-center py-12 text-gray-400">Chưa có dữ liệu thống kê theo ngày.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      {dashboardStats.chartData.map((d) => {
                        const maxVal = Math.max(...dashboardStats.chartData.map(x => x.sent), 1);
                        const sentPct = (d.sent / maxVal) * 100;
                        const openedPct = (d.opened / maxVal) * 100;
                        const clickedPct = (d.clicked / maxVal) * 100;

                        return (
                          <div key={d.date} className="flex flex-col md:flex-row md:items-center gap-2 border-b border-gray-50 dark:border-gray-800/40 pb-3">
                            <span className="w-28 text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{d.date}</span>
                            
                            <div className="flex-1 space-y-1">
                              {/* Sent bar */}
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-12 text-right text-gray-400">Gửi: {d.sent}</div>
                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${sentPct}%` }}></div>
                                </div>
                              </div>
                              {/* Opened bar */}
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-12 text-right text-emerald-500 font-semibold">Mở: {d.opened}</div>
                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${openedPct}%` }}></div>
                                </div>
                              </div>
                              {/* Clicked bar */}
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-12 text-right text-blue-500 font-semibold">Click: {d.clicked}</div>
                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${clickedPct}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Note graph colors */}
                    <div className="flex items-center justify-end gap-6 text-xs text-gray-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-indigo-500"></span>
                        Đã gửi
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span>
                        Đã mở
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
                        Đã click
                      </div>
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
        >
          {detailLoading && !detailData ? (
            <div className="text-center py-16">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Đang tải thông tin chi tiết...
            </div>
          ) : !detailData ? (
            <p className="text-center text-gray-400 py-6">Không tìm thấy dữ liệu chiến dịch.</p>
          ) : (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
              
              {/* Campaign summary info */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{detailData.campaignInfo.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Tiêu đề:</span> {detailData.campaignInfo.subject}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    Tạo lúc: {formatDateTime(detailData.campaignInfo.createdAt)}
                  </span>
                </div>

                {/* Rates metrics campaign */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-gray-200 dark:border-gray-800 pt-5">
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Gửi thành công</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white">
                      {detailData.stats.totalDelivered}/{detailData.stats.totalSent}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-500 uppercase tracking-wider block">Tỷ lệ Mở</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{detailData.stats.openRate}%</span>
                    <span className="text-xs text-gray-400 block">({detailData.stats.totalOpened} email)</span>
                  </div>
                  <div>
                    <span className="text-xs text-blue-500 uppercase tracking-wider block">Tỷ lệ Click</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{detailData.stats.clickRate}%</span>
                    <span className="text-xs text-gray-400 block">({detailData.stats.totalClicked} click)</span>
                  </div>
                  <div>
                    <span className="text-xs text-rose-500 uppercase tracking-wider block">Tỷ lệ Bị Trả (Bounce)</span>
                    <span className="text-xl font-black text-rose-500">{detailData.stats.bounceRate}%</span>
                    <span className="text-xs text-gray-400 block">({detailData.stats.totalBounced} lỗi)</span>
                  </div>
                </div>
              </div>

              {/* HTML Content Preview Accordion */}
              <details className="group border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
                <summary className="flex justify-between items-center p-4 font-bold text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  Xem mẫu nội dung HTML đã gửi
                  <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40">
                  <div
                    className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white text-gray-800"
                    dangerouslySetInnerHTML={{ __html: detailData.campaignInfo.bodyHtml }}
                  ></div>
                </div>
              </details>

              {/* Search, Filter, and Recipients List */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="h-4.5 w-4.5 text-gray-400" />
                    Danh sách người nhận ({detailData.recipients.total})
                  </h4>
                  
                  {/* Filters bar */}
                  <form onSubmit={handleDetailSearchSubmit} className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <select
                      value={detailStatusFilter}
                      onChange={(e) => {
                        setDetailStatusFilter(e.target.value);
                        setDetailPage(1);
                      }}
                      className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

                    <div className="relative flex-1 sm:flex-initial">
                      <input
                        type="text"
                        placeholder="Tìm email..."
                        value={detailSearch}
                        onChange={(e) => setDetailSearch(e.target.value)}
                        className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 text-xs py-2 pl-8 pr-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
                      />
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <button type="submit" className="hidden"></button>
                  </form>
                </div>

                {/* Recipients Table */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Địa chỉ Email</th>
                        <th className="py-3 px-4 text-center">Trạng thái</th>
                        <th className="py-3 px-4">Resend ID</th>
                        <th className="py-3 px-4">Dòng thời gian tương tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                      {detailData.recipients.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-400 dark:text-gray-500">
                            Không tìm thấy người nhận nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        detailData.recipients.items.map((log) => (
                          <tr key={log.emailLogId} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20">
                            <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                              {log.recipientEmail}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.status === "opened" || log.status === "clicked"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                  : log.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : log.status === "bounced" || log.status === "failed" || log.status === "complained"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                  : "bg-gray-50 text-gray-600 dark:bg-gray-850 dark:text-gray-400"
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-gray-400 dark:text-gray-500">
                              {log.resendEmailId || "-"}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                              {log.sentAt && <div>📤 Gửi: {formatDateTime(log.sentAt)}</div>}
                              {log.deliveredAt && <div>📥 Nhận: {formatDateTime(log.deliveredAt)}</div>}
                              {log.openedAt && <div className="text-emerald-600 dark:text-emerald-400 font-medium">👁️ Mở: {formatDateTime(log.openedAt)}</div>}
                              {log.clickedAt && <div className="text-blue-600 dark:text-blue-400 font-medium">🖱️ Click: {formatDateTime(log.clickedAt)}</div>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Recipients Pagination */}
                  {detailData.recipients.total > detailPageSize && (
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/40 text-[11px]">
                      <span className="text-gray-400">
                        Trang {detailPage} / {Math.ceil(detailData.recipients.total / detailPageSize)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={detailPage === 1 || detailLoading}
                          onClick={() => setDetailPage(prev => prev - 1)}
                          className="py-1 px-2.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600"
                        >
                          Trước
                        </button>
                        <button
                          disabled={detailPage >= Math.ceil(detailData.recipients.total / detailPageSize) || detailLoading}
                          onClick={() => setDetailPage(prev => prev + 1)}
                          className="py-1 px-2.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5" />
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên chiến dịch</label>
              <input
                type="text"
                placeholder="Ví dụ: Chiến dịch tri ân khách hàng tháng 7"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề Email</label>
              <input
                type="text"
                placeholder="Ví dụ: Quà tặng hấp dẫn chỉ dành riêng cho bạn!"
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Danh sách Email người nhận</label>
              <textarea
                placeholder="Nhập danh sách email nhận. Phân tách bằng dấu phẩy, dấu chấm phẩy hoặc xuống dòng.&#10;Ví dụ:&#10;user1@gmail.com&#10;user2@gmail.com"
                value={recipientText}
                onChange={(e) => setRecipientText(e.target.value)}
                rows={4}
                className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={creating}
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nội dung HTML của Email</label>
              <textarea
                placeholder="<h1>Chào bạn!</h1><p>Đây là nội dung email của bạn với các thẻ HTML...</p>"
                value={createForm.bodyHtml}
                onChange={(e) => setCreateForm({ ...createForm, bodyHtml: e.target.value })}
                rows={6}
                className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={creating}
              ></textarea>
            </div>

            {createForm.bodyHtml.trim() && (
              <details className="group border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950/20 overflow-hidden">
                <summary className="p-3 font-semibold text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none hover:bg-gray-100/50">
                  Xem trước giao diện Email (Preview)
                </summary>
                <div className="p-3 border-t border-gray-150 dark:border-gray-800 bg-white">
                  <div
                    className="max-h-[200px] overflow-y-auto p-3 text-gray-800 border rounded border-gray-150"
                    dangerouslySetInnerHTML={{ __html: createForm.bodyHtml }}
                  ></div>
                </div>
              </details>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="py-2.5 px-4 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400"
                disabled={creating}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-semibold py-2.5 px-5 rounded-lg shadow-md disabled:opacity-50"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Bắt đầu gửi
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
