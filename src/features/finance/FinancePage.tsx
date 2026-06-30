import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  approveWithdraw,
  giftMechanics,
  listTransactions,
  listWallets,
  listWithdrawRequests,
  rejectWithdraw
} from "./financeApi";
import { updateWalletStatus } from "../users/usersApi";
import { Modal } from "../../shared/components/Modal";
import { Wallet, History, ArrowDownToLine, RefreshCw } from "lucide-react";

type Tab = "wallets" | "transactions" | "withdraw";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("vi-VN");
}

function getVietQRBankId(bankName: string): string {
  if (!bankName) return "";
  const normalized = bankName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");

  if (normalized.includes("vietcombank") || normalized.includes("vcb")) return "vietcombank";
  if (normalized.includes("techcombank") || normalized.includes("tcb")) return "techcombank";
  if (normalized.includes("vietinbank") || normalized.includes("ctg") || normalized.includes("vietin")) return "vietinbank";
  if (normalized.includes("bidv")) return "bidv";
  if (normalized.includes("agribank") || normalized.includes("vba")) return "agribank";
  if (normalized.includes("mbbank") || normalized === "mb" || normalized.includes("mb")) return "mb";
  if (normalized.includes("acb")) return "acb";
  if (normalized.includes("sacombank") || normalized.includes("stb")) return "sacombank";
  if (normalized.includes("tpbank") || normalized === "tpb") return "tpb";
  if (normalized.includes("vpbank") || normalized === "vpb") return "vpbank";
  if (normalized.includes("shb")) return "shb";
  if (normalized.includes("hdbank") || normalized === "hdb" || normalized.includes("hd")) return "hdbank";
  if (normalized.includes("seabank") || normalized === "seab") return "seabank";
  if (normalized.includes("vib")) return "vib";
  if (normalized.includes("ocb")) return "ocb";
  if (normalized.includes("msb")) return "msb";
  return bankName;
}

export function FinancePage() {
  const [tab, setTab] = useState<Tab>("wallets");

  // Tab 1 (Wallets) Filters
  const [q, setQ] = useState("");
  const [userType, setUserType] = useState("");
  const [walletsPage, setWalletsPage] = useState(1);

  // Tab 2 (Transactions) Filters
  const [walletId, setWalletId] = useState("");
  const [flow, setFlow] = useState("");
  const [txType, setTxType] = useState("");
  const [txPage, setTxPage] = useState(1);

  // Tab 3 (Withdrawals) Filters
  const [wrStatus, setWrStatus] = useState("PENDING");
  const [wrPage, setWrPage] = useState(1);

  // Modal Control for Approving / Rejecting
  const [currentRequest, setCurrentRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Queries
  const walletsQuery = useQuery({
    queryKey: useMemo(() => ["finance-wallets", { q, userType, walletsPage }], [q, userType, walletsPage]),
    queryFn: () => listWallets({ q: q || undefined, userType: userType || undefined, page: walletsPage, pageSize: 20 }),
    enabled: tab === "wallets"
  });

  const txQuery = useQuery({
    queryKey: useMemo(() => ["finance-tx", { walletId, flow, txType, txPage }], [walletId, flow, txType, txPage]),
    queryFn: () =>
      listTransactions({
        walletId: walletId || undefined,
        flow: flow || undefined,
        type: txType || undefined,
        page: txPage,
        pageSize: 20
      }),
    enabled: tab === "transactions"
  });

  const wrQuery = useQuery({
    queryKey: useMemo(() => ["finance-wr", { wrStatus, wrPage }], [wrStatus, wrPage]),
    queryFn: () => listWithdrawRequests({ status: wrStatus || undefined, page: wrPage, pageSize: 20 }),
    enabled: tab === "withdraw"
  });

  async function handleSettleAction() {
    if (!currentRequest || !actionType) return;
    setSubmittingAction(true);
    try {
      if (actionType === "approve") {
        await approveWithdraw(currentRequest.requestId, actionNote);
      } else {
        await rejectWithdraw(currentRequest.requestId, actionNote);
      }
      setCurrentRequest(null);
      setActionType(null);
      setActionNote("");
      await wrQuery.refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setSubmittingAction(false);
    }
  }

  const [gifting, setGifting] = useState(false);

  async function handleGift() {
    if (!window.confirm("Bạn có chắc chắn muốn TẶNG 5.000.000đ vào ví của TẤT CẢ thợ cứu hộ đang hoạt động không?")) {
      return;
    }
    setGifting(true);
    try {
      const resp = await giftMechanics(5000000);
      alert(resp.message || "Tặng tiền thành công!");
      await walletsQuery.refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setGifting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>Tài chính &amp; Ví</h1>
          <p>Quản lý số dư người dùng, xem lịch sử giao dịch và phê duyệt các yêu cầu rút tiền.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "8px" }}>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "wallets" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "wallets" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "wallets" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("wallets")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Wallet size={16} />
            <span>Tài khoản ví ({walletsQuery.data?.total ?? "-"})</span>
          </div>
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "transactions" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "transactions" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "transactions" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("transactions")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <History size={16} />
            <span>Lịch sử giao dịch ({txQuery.data?.total ?? "-"})</span>
          </div>
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "withdraw" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "withdraw" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "withdraw" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("withdraw")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowDownToLine size={16} />
            <span>Duyệt rút tiền ({wrQuery.data?.total ?? "-"})</span>
          </div>
        </button>
      </div>

      {/* Tab 1: Wallets list */}
      {tab === "wallets" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <h2>Danh sách tài khoản ví</h2>
          </div>

          <div className="filter-bar">
            <input
              className="input"
              style={{ flex: 1, minWidth: "220px" }}
              placeholder="Tìm theo tên thợ, tên khách hoặc số điện thoại..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setWalletsPage(1); }}
            />
            <select
              className="select"
              style={{ width: "200px" }}
              value={userType}
              onChange={(e) => { setUserType(e.target.value); setWalletsPage(1); }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MECHANIC">MECHANIC</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button className="btn btn--ghost" onClick={() => walletsQuery.refetch()} disabled={walletsQuery.isFetching}>
              <RefreshCw size={14} />
              {walletsQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
            <button
              className="btn btn--primary"
              style={{ backgroundColor: "#10B981", borderColor: "#10B981" }}
              onClick={handleGift}
              disabled={gifting || walletsQuery.isFetching}
            >
              {gifting ? "Đang xử lý..." : "Tặng 5Tr Cho Tất Cả Thợ"}
            </button>
          </div>

          {walletsQuery.isError ? (
            <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
              <strong>Lỗi:</strong> {String(walletsQuery.error)}
            </div>
          ) : walletsQuery.data ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Chủ tài khoản</th>
                      <th>Vai trò</th>
                      <th>Số dư ví</th>
                      <th>Trạng thái</th>
                      <th>Thông tin ngân hàng</th>
                      <th>Hạn mức rút / ngày</th>
                      <th>Nhập sai PIN</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletsQuery.data.items.map((w) => (
                      <tr key={w.walletId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{w.fullName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{w.phoneNumber}</div>
                        </td>
                        <td>
                          <span className={`badge ${w.userType === "MECHANIC" ? "badge--info" : "badge--success"}`} style={{ fontSize: "10px" }}>
                            {w.userType}
                          </span>
                        </td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--secondary)", fontSize: "15px" }}>
                            {w.balance != null ? formatMoney(w.balance) : "0 đ"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${w.status === "ACTIVE" ? "badge--success" : "badge--warning"}`}>
                            {w.status ?? "UNKNOWN"}
                          </span>
                        </td>
                        <td>
                          {w.bankName ? (
                            <div style={{ display: "grid", gap: "2px" }}>
                              <div style={{ fontWeight: "500" }}>{w.bankName}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {w.accountNumber} • <span style={{ textTransform: "uppercase" }}>{w.accountHolderName}</span>
                              </div>
                              <div style={{ marginTop: "2px" }}>
                                <span className="badge badge--success" style={{ fontSize: "9px", padding: "1px 6px" }}>Đã liên kết</span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-light)" }}>Chưa liên kết</span>
                          )}
                        </td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            {w.dailyWithdrawLimit != null ? formatMoney(w.dailyWithdrawLimit) : "-"}
                          </span>
                        </td>
                        <td>
                          {w.userType === "MECHANIC" ? (
                            <strong className="tabular-nums" style={{ color: (w.failedPinAttempts ?? 0) >= 5 ? "var(--danger)" : "inherit" }}>
                              {w.failedPinAttempts ?? 0} / 5
                            </strong>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn--sm ${w.status === "ACTIVE" ? "btn--danger" : "btn--success"}`}
                            onClick={async () => {
                              try {
                                const newStatus = w.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
                                await updateWalletStatus(w.userId, { status: newStatus });
                                await walletsQuery.refetch();
                              } catch (err: any) {
                                alert(err.message || "Không thể cập nhật trạng thái ví");
                              }
                            }}
                          >
                            {w.status === "ACTIVE" ? "Khóa ví" : "Mở khóa ví"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {walletsQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">Không có tài khoản ví nào phù hợp.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: <b className="tabular-nums">{walletsQuery.data.total}</b> tài khoản</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={walletsPage <= 1} onClick={() => setWalletsPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }} className="tabular-nums">Trang {walletsPage}</span>
                  <button className="btn btn--sm" disabled={walletsPage * 20 >= walletsQuery.data.total} onClick={() => setWalletsPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="skeleton" style={{ height: "200px" }} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transactions list */}
      {tab === "transactions" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <h2>Lịch sử giao dịch</h2>
          </div>

          <div className="filter-bar">
            <input
              className="input"
              style={{ flex: 1, minWidth: "200px" }}
              placeholder="Nhập mã ví (Wallet ID) nếu muốn lọc..."
              value={walletId}
              onChange={(e) => { setWalletId(e.target.value); setTxPage(1); }}
            />
            <select
              className="select"
              style={{ width: "160px" }}
              value={flow}
              onChange={(e) => { setFlow(e.target.value); setTxPage(1); }}
            >
              <option value="">Tất cả luồng tiền</option>
              <option value="IN">Nhận tiền (IN)</option>
              <option value="OUT">Rút tiền (OUT)</option>
            </select>
            <input
              className="input"
              style={{ width: "200px" }}
              placeholder="Loại giao dịch (vd WITHDRAWAL)"
              value={txType}
              onChange={(e) => { setTxType(e.target.value); setTxPage(1); }}
            />
            <button className="btn btn--ghost" onClick={() => txQuery.refetch()} disabled={txQuery.isFetching}>
              <RefreshCw size={14} />
              {txQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {txQuery.isError ? (
            <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
              <strong>Lỗi:</strong> {String(txQuery.error)}
            </div>
          ) : txQuery.data ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Loại giao dịch</th>
                      <th>Luồng tiền</th>
                      <th>Số tiền</th>
                      <th>Số dư Trước/Sau</th>
                      <th>Thời gian giao dịch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txQuery.data.items.map((t) => (
                      <tr key={t.transactionId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.phoneNumber}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: "700", fontSize: "12px", color: "var(--secondary)" }}>
                            {t.transactionType}
                          </span>
                          {t.description && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {t.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${t.flowType === "IN" ? "badge--success" : "badge--danger"}`}>
                            {t.flowType === "IN" ? "Nạp / Thu" : "Rút / Chi"}
                          </span>
                        </td>
                        <td>
                          <span className="tabular-nums" style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: t.flowType === "IN" ? "var(--success)" : "var(--danger)"
                          }}>
                            {t.flowType === "IN" ? "+" : "-"} {formatMoney(t.amount)}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <div className="tabular-nums">Trước: {formatMoney(t.balanceBefore)}</div>
                          <div className="tabular-nums">Sau: {formatMoney(t.balanceAfter)}</div>
                        </td>
                        <td>{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                    {txQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">Không có giao dịch nào khớp với bộ lọc.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: <b className="tabular-nums">{txQuery.data.total}</b> giao dịch</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }} className="tabular-nums">Trang {txPage}</span>
                  <button className="btn btn--sm" disabled={txPage * 20 >= txQuery.data.total} onClick={() => setTxPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="skeleton" style={{ height: "200px" }} />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Withdraw approvals */}
      {tab === "withdraw" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <h2>Yêu cầu rút tiền</h2>
          </div>

          <div className="filter-bar">
            <select
              className="select"
              style={{ width: "220px" }}
              value={wrStatus}
              onChange={(e) => { setWrStatus(e.target.value); setWrPage(1); }}
            >
              <option value="PENDING">PENDING (Chờ duyệt)</option>
              <option value="APPROVED">APPROVED (Đã duyệt)</option>
              <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
              <option value="REJECTED">REJECTED (Từ chối)</option>
              <option value="">Tất cả yêu cầu</option>
            </select>
            <button className="btn btn--ghost" onClick={() => wrQuery.refetch()} disabled={wrQuery.isFetching}>
              <RefreshCw size={14} />
              {wrQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {wrQuery.isError ? (
            <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
              <strong>Lỗi:</strong> {String(wrQuery.error)}
            </div>
          ) : wrQuery.data ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Người rút tiền</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Tài khoản thụ hưởng</th>
                      <th>Ngày gửi</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wrQuery.data.items.map((r) => (
                      <tr key={r.requestId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.phoneNumber}</div>
                        </td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 800, fontSize: "15px", color: "var(--secondary)" }}>
                            {formatMoney(r.amount)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            r.status === "PENDING" ? "badge--warning" :
                            r.status === "REJECTED" ? "badge--danger" : "badge--success"
                          }`}>
                            {r.status === "PENDING"
                              ? "Chờ duyệt"
                              : r.status === "APPROVED"
                                ? "Đã duyệt"
                                : r.status === "COMPLETED"
                                  ? "Hoàn tất"
                                  : "Từ chối"}
                          </span>
                          {r.note && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "200px" }}>
                              Ghi chú: {r.note}
                            </div>
                          )}
                        </td>
                        <td>
                          {r.bankName ? (
                            <div style={{ display: "grid", gap: "2px" }}>
                              <div style={{ fontWeight: "600" }}>{r.bankName}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                STK: {r.accountNumber} • <span style={{ textTransform: "uppercase" }}>{r.accountHolderName}</span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-light)" }}>N/A</span>
                          )}
                        </td>
                        <td>{formatDate(r.requestedAt)}</td>
                        <td>
                          {r.status === "PENDING" ? (
                            <div className="flex-gap gap-8">
                              <button
                                className="btn btn--primary btn--sm"
                                onClick={() => {
                                  setCurrentRequest(r);
                                  setActionType("approve");
                                  setActionNote("");
                                }}
                              >
                                Duyệt chi
                              </button>
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => {
                                  setCurrentRequest(r);
                                  setActionType("reject");
                                  setActionNote("");
                                }}
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-light)", fontSize: "12px" }}>Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {wrQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">Không có yêu cầu rút tiền nào.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: <b className="tabular-nums">{wrQuery.data.total}</b> yêu cầu</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={wrPage <= 1} onClick={() => setWrPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }} className="tabular-nums">Trang {wrPage}</span>
                  <button className="btn btn--sm" disabled={wrPage * 20 >= wrQuery.data.total} onClick={() => setWrPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="skeleton" style={{ height: "200px" }} />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!currentRequest}
        onClose={() => setCurrentRequest(null)}
        title={actionType === "approve" ? "Xác nhận duyệt chi tiền" : "Từ chối yêu cầu rút tiền"}
        footer={
          <div className="flex-gap">
            <button className="btn" onClick={() => setCurrentRequest(null)} disabled={submittingAction}>Hủy</button>
            <button
              className={`btn ${actionType === "approve" ? "btn--primary" : "btn--danger"}`}
              onClick={handleSettleAction}
              disabled={submittingAction}
            >
              {submittingAction ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận hoàn tất" : "Xác nhận Từ chối"}
            </button>
          </div>
        }
      >
        {currentRequest && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div className="card" style={{ background: "var(--neutral-bg)", padding: "12px" }}>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-item__label">Người nhận thụ hưởng</span>
                  <span className="detail-item__value">{currentRequest.fullName} ({currentRequest.phoneNumber})</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Ngân hàng</span>
                  <span className="detail-item__value">{currentRequest.bankName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Số tài khoản</span>
                  <span className="detail-item__value tabular-nums">{currentRequest.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex-between" style={{ padding: "0 4px" }}>
              <span style={{ fontWeight: "600" }}>Số tiền giao dịch:</span>
              <span className="tabular-nums" style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>{formatMoney(currentRequest.amount)}</span>
            </div>

            {actionType === "approve" && (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                padding: "16px", 
                background: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid var(--border-color)", 
                borderRadius: "12px", 
                margin: "4px 0" 
              }}>
                <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "12px" }}>QUÉT MÃ VIETQR ĐỂ CHUYỂN KHOẢN TAY</span>
                <div style={{ 
                  padding: "12px", 
                  background: "#ffffff", 
                  borderRadius: "16px", 
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  display: "inline-block"
                }}>
                  <img 
                    src={`https://img.vietqr.io/image/${getVietQRBankId(currentRequest.bankName ?? "")}-${currentRequest.accountNumber}-compact.png?amount=${currentRequest.amount}&addInfo=${encodeURIComponent("SOSBIKE RUT " + currentRequest.phoneNumber)}&accountName=${encodeURIComponent(currentRequest.accountHolderName ?? "")}`} 
                    alt="VietQR code" 
                    style={{ width: "180px", height: "180px", display: "block", borderRadius: "8px" }} 
                  />
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: "var(--text-muted)", 
                  textAlign: "center", 
                  marginTop: "12px", 
                  marginBottom: 0,
                  maxWidth: "280px", 
                  lineHeight: "1.5" 
                }}>
                  Vui lòng dùng ứng dụng Ngân hàng để quét mã QR và thực hiện chuyển tiền thủ công trước khi nhấn <strong>Xác nhận hoàn tất</strong>.
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Ghi chú của Admin (nếu có)</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder={actionType === "approve" ? "Nhập mã giao dịch đối chiếu hoặc ghi chú chuyển tiền..." : "Nhập lý do từ chối cụ thể để gửi cho người dùng..."}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
