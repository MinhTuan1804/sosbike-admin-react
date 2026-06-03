import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  approveWithdraw,
  listTransactions,
  listWallets,
  listWithdrawRequests,
  rejectWithdraw
} from "./financeApi";
import { Modal } from "../../shared/components/Modal";

type Tab = "wallets" | "transactions" | "withdraw";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("vi-VN");
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

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Tài chính & Ví</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Quản lý số dư người dùng, xem lịch sử giao dịch và phê duyệt các yêu cầu rút tiền.
          </p>
        </div>
      </div>

      {/* Modern Tabs Design */}
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
          💳 Tài khoản ví ({walletsQuery.data?.total ?? "-"})
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
          🔄 Lịch sử giao dịch ({txQuery.data?.total ?? "-"})
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
          📥 Duyệt rút tiền ({wrQuery.data?.total ?? "-"})
        </button>
      </div>

      {/* Tab 1: Wallets list */}
      {tab === "wallets" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
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
            <button className="btn" onClick={() => walletsQuery.refetch()} disabled={walletsQuery.isFetching}>
              {walletsQuery.isFetching ? "Đang tải..." : "Tải lại"}
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
                        <td style={{ fontWeight: 700, color: "var(--secondary)", fontSize: "15px" }}>
                          {w.balance != null ? formatMoney(w.balance) : "0 đ"}
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
                                {w.isBankVerified ? (
                                  <span className="badge badge--success" style={{ fontSize: "9px", padding: "1px 6px" }}>Đã xác thực</span>
                                ) : (
                                  <span className="badge badge--warning" style={{ fontSize: "9px", padding: "1px 6px" }}>Chờ xác thực</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-light)" }}>Chưa liên kết</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {w.dailyWithdrawLimit != null ? formatMoney(w.dailyWithdrawLimit) : "-"}
                        </td>
                      </tr>
                    ))}
                    {walletsQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-light)" }}>
                          Không có tài khoản ví nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex-between" style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: {walletsQuery.data.total} tài khoản</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={walletsPage <= 1} onClick={() => setWalletsPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>Trang {walletsPage}</span>
                  <button className="btn btn--sm" disabled={walletsPage * 20 >= walletsQuery.data.total} onClick={() => setWalletsPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách ví...</div>
          )}
        </div>
      )}

      {/* Tab 2: Transactions list */}
      {tab === "transactions" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
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
            <button className="btn" onClick={() => txQuery.refetch()} disabled={txQuery.isFetching}>
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
                        <td style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: t.flowType === "IN" ? "var(--success)" : "var(--danger)"
                        }}>
                          {t.flowType === "IN" ? "+" : "-"} {formatMoney(t.amount)}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <div>Trước: {formatMoney(t.balanceBefore)}</div>
                          <div>Sau: {formatMoney(t.balanceAfter)}</div>
                        </td>
                        <td>{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                    {txQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-light)" }}>
                          Không có giao dịch nào khớp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex-between" style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: {txQuery.data.total} giao dịch</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>Trang {txPage}</span>
                  <button className="btn btn--sm" disabled={txPage * 20 >= txQuery.data.total} onClick={() => setTxPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải lịch sử giao dịch...</div>
          )}
        </div>
      )}

      {/* Tab 3: Withdraw approvals */}
      {tab === "withdraw" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <select
              className="select"
              style={{ width: "200px" }}
              value={wrStatus}
              onChange={(e) => { setWrStatus(e.target.value); setWrPage(1); }}
            >
              <option value="PENDING">PENDING (Chờ duyệt)</option>
              <option value="APPROVED">APPROVED (Đã duyệt)</option>
              <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
              <option value="REJECTED">REJECTED (Từ chối)</option>
              <option value="">Tất cả yêu cầu</option>
            </select>
            <button className="btn" onClick={() => wrQuery.refetch()} disabled={wrQuery.isFetching}>
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
                        <td style={{ fontWeight: 800, fontSize: "15px", color: "var(--secondary)" }}>
                          {formatMoney(r.amount)}
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
                            <div style={{ display: "flex", gap: "8px" }}>
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
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-light)" }}>
                          Không có yêu cầu rút tiền nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex-between" style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng cộng: {wrQuery.data.total} yêu cầu</span>
                <div className="flex-gap">
                  <button className="btn btn--sm" disabled={wrPage <= 1} onClick={() => setWrPage(p => p - 1)}>Trước</button>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>Trang {wrPage}</span>
                  <button className="btn btn--sm" disabled={wrPage * 20 >= wrQuery.data.total} onClick={() => setWrPage(p => p + 1)}>Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách rút tiền...</div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!currentRequest}
        onClose={() => setCurrentRequest(null)}
        title={actionType === "approve" ? "Xác nhận duyệt chi tiền" : "Từ chối yêu cầu rút tiền"}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setCurrentRequest(null)} disabled={submittingAction}>Hủy</button>
            <button
              className={`btn ${actionType === "approve" ? "btn--primary" : "btn--danger"}`}
              onClick={handleSettleAction}
              disabled={submittingAction}
            >
              {submittingAction ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận & Chi tiền" : "Xác nhận Từ chối"}
            </button>
          </div>
        }
      >
        {currentRequest && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "var(--neutral-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Người nhận thụ hưởng:</div>
              <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px" }}>{currentRequest.fullName} ({currentRequest.phoneNumber})</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ngân hàng</span>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>{currentRequest.bankName}</div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Số tài khoản</span>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>{currentRequest.accountNumber}</div>
                </div>
              </div>
            </div>

            <div className="flex-between" style={{ padding: "0 4px" }}>
              <span style={{ fontWeight: "600" }}>Số tiền giao dịch:</span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>{formatMoney(currentRequest.amount)}</span>
            </div>

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
