import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Download, History, RefreshCw, Wallet } from "lucide-react";
import {
  approveWithdraw,
  exportTransactions,
  giftMechanics,
  listTransactions,
  listWallets,
  listWithdrawRequests,
  rejectWithdraw
} from "./financeApi";
import { updateWalletStatus } from "../users/usersApi";
import { Modal } from "../../shared/components/Modal";

type Tab = "wallets" | "transactions" | "withdraw";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  let str = dateStr.trim();
  if (!str.endsWith("Z") && !str.includes("+") && str.includes("T")) {
    str += "Z";
  }
  return new Date(str).toLocaleString("vi-VN");
}

function getFlowLabel(flowType?: string | null) {
  switch ((flowType ?? "").toUpperCase()) {
    case "IN":
      return "Tiền vào";
    case "OUT":
      return "Tiền ra";
    default:
      return flowType || "-";
  }
}

function getTransactionTypeLabel(transactionType?: string | null) {
  switch ((transactionType ?? "").toUpperCase()) {
    case "TOP_UP":
    case "TOPUP":
    case "TOP_UP_WALLET":
      return "Nạp ví";
    case "WITHDRAW":
    case "WITHDRAWAL":
      return "Rút tiền";
    case "ORDER_PAYMENT":
      return "Thanh toán đơn cứu hộ";
    case "COMMISSION_DEDUCTION":
      return "Trừ phí sàn";
    case "SUBSCRIPTION":
      return "Thanh toán gói thành viên";
    case "RESCUE_INCOME":
      return "Thu nhập cứu hộ";
    case "ORDER_INCOME":
      return "Thu nhập đơn hàng";
    case "REPAIR_INCOME":
      return "Thu nhập sửa chữa";
    default:
      return transactionType || "-";
  }
}

function getTransactionStatusLabel(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "SUCCESS":
    case "PAID":
    case "COMPLETED":
      return "Thành công";
    case "PENDING":
      return "Đang xử lý";
    case "FAILED":
      return "Thất bại";
    case "CANCELLED":
    case "CANCELED":
      return "Đã hủy";
    default:
      return status || "-";
  }
}

function getVietQRBankId(bankName: string) {
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

function tabButtonStyle(active: boolean) {
  return {
    background: "transparent",
    border: "none",
    borderBottom: active ? "2px solid var(--secondary)" : "2px solid transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    padding: "0 0 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600
  } as const;
}

function ErrorCard({ error }: { error: unknown }) {
  return (
    <div className="card" style={{ color: "var(--danger)" }}>
      {error instanceof Error ? error.message : "Không tải được dữ liệu."}
    </div>
  );
}

function SkeletonCard() {
  return <div className="card">Đang tải dữ liệu...</div>;
}

function Pagination({
  page,
  pageSize,
  total,
  label,
  onPrev,
  onNext
}: {
  page: number;
  pageSize: number;
  total: number;
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap"
      }}
    >
      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
        Tổng cộng: <strong>{total}</strong> {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button className="btn btn--ghost btn--sm" onClick={onPrev} disabled={page <= 1}>
          Trước
        </button>
        <span style={{ minWidth: "84px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
          Trang {page} / {totalPages}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onNext} disabled={page >= totalPages}>
          Sau
        </button>
      </div>
    </div>
  );
}

export function FinancePage() {
  const [tab, setTab] = useState<Tab>("wallets");

  const [q, setQ] = useState("");
  const [userType, setUserType] = useState("");
  const [walletsPage, setWalletsPage] = useState(1);

  const [transactionQuery, setTransactionQuery] = useState("");
  const [walletId, setWalletId] = useState("");
  const [transactionUserType, setTransactionUserType] = useState("");
  const [flow, setFlow] = useState("");
  const [txType, setTxType] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [exportingTransactions, setExportingTransactions] = useState(false);

  const [wrStatus, setWrStatus] = useState("PENDING");
  const [wrPage, setWrPage] = useState(1);

  const [currentRequest, setCurrentRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [gifting, setGifting] = useState(false);

  const modalQrUrl = useMemo(() => {
    if (!currentRequest || actionType !== "approve") return null;
    const bankCode = getVietQRBankId(currentRequest.bankName ?? "");
    return bankCode && currentRequest.accountNumber
      ? `https://img.vietqr.io/image/${bankCode}-${currentRequest.accountNumber}-compact2.png?amount=${Math.round(
          currentRequest.amount
        )}&addInfo=RUT%20TIEN%20SOSBIKE`
      : null;
  }, [currentRequest, actionType]);

  const walletsQuery = useQuery({
    queryKey: useMemo(() => ["finance-wallets", { q, userType, walletsPage }], [q, userType, walletsPage]),
    queryFn: () =>
      listWallets({
        q: q || undefined,
        userType: userType || undefined,
        page: walletsPage,
        pageSize: 20
      }),
    enabled: tab === "wallets"
  });

  const txQuery = useQuery({
    queryKey: useMemo(
      () => ["finance-transactions", { transactionQuery, walletId, transactionUserType, flow, txType, txPage }],
      [transactionQuery, walletId, transactionUserType, flow, txType, txPage]
    ),
    queryFn: () =>
      listTransactions({
        q: transactionQuery || undefined,
        walletId: walletId || undefined,
        userType: transactionUserType || undefined,
        flow: flow || undefined,
        type: txType || undefined,
        page: txPage,
        pageSize: 20
      }),
    enabled: tab === "transactions"
  });

  const wrQuery = useQuery({
    queryKey: useMemo(() => ["finance-withdraw", { wrStatus, wrPage }], [wrStatus, wrPage]),
    queryFn: () =>
      listWithdrawRequests({
        status: wrStatus || undefined,
        page: wrPage,
        pageSize: 20
      }),
    enabled: tab === "withdraw"
  });


  async function handleExportTransactions() {
    setExportingTransactions(true);
    try {
      const blob = await exportTransactions({
        q: transactionQuery || undefined,
        walletId: walletId || undefined,
        userType: transactionUserType || undefined,
        flow: flow || undefined,
        type: txType || undefined
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lich-su-giao-dich-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không xuất được Excel.");
    } finally {
      setExportingTransactions(false);
    }
  }

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
    } catch (error) {
      alert(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleGift() {
    if (!window.confirm("Bạn có chắc chắn muốn tặng 5.000.000đ vào ví của tất cả thợ đang hoạt động không?")) {
      return;
    }

    setGifting(true);
    try {
      const response = await giftMechanics(5000000);
      alert(response.message || "Tặng tiền thành công.");
      await walletsQuery.refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setGifting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="page-header">
        <div className="page-header__info">
          <h1>Tài chính & Ví</h1>
          <p>Quản lý số dư ví người dùng, xem lịch sử giao dịch, người mua gói và phê duyệt các yêu cầu rút tiền.</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          gap: "24px",
          marginBottom: "8px",
          flexWrap: "wrap"
        }}
      >
        <button style={tabButtonStyle(tab === "wallets")} onClick={() => setTab("wallets")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Wallet size={16} />
            <span>Tài khoản ví ({walletsQuery.data?.total ?? "-"})</span>
          </div>
        </button>

        <button style={tabButtonStyle(tab === "transactions")} onClick={() => setTab("transactions")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <History size={16} />
            <span>Lịch sử giao dịch ({txQuery.data?.total ?? "-"})</span>
          </div>
        </button>

        <button style={tabButtonStyle(tab === "withdraw")} onClick={() => setTab("withdraw")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowDownToLine size={16} />
            <span>Duyệt rút tiền ({wrQuery.data?.total ?? "-"})</span>
          </div>
        </button>
      </div>

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
              onChange={(e) => {
                setQ(e.target.value);
                setWalletsPage(1);
              }}
            />
            <select
              className="select"
              style={{ width: "200px" }}
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setWalletsPage(1);
              }}
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
              {gifting ? "Đang xử lý..." : "Tặng 5Tr cho tất cả thợ"}
            </button>
          </div>

          {walletsQuery.isError ? (
            <ErrorCard error={walletsQuery.error} />
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
                    {walletsQuery.data.items.map((wallet) => (
                      <tr key={wallet.walletId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{wallet.fullName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{wallet.phoneNumber}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${wallet.userType === "MECHANIC" ? "badge--info" : "badge--success"}`}
                            style={{ fontSize: "10px" }}
                          >
                            {wallet.userType}
                          </span>
                        </td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--secondary)", fontSize: "15px" }}>
                            {wallet.balance != null ? formatMoney(wallet.balance) : "0 đ"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${wallet.status === "ACTIVE" ? "badge--success" : "badge--warning"}`}>
                            {wallet.status === "ACTIVE" ? "Hoạt động" : wallet.status === "LOCKED" ? "Đã khóa" : (wallet.status ?? "Không xác định")}
                          </span>
                        </td>
                        <td>
                          {wallet.bankName ? (
                            <div style={{ display: "grid", gap: "2px" }}>
                              <div style={{ fontWeight: 500 }}>{wallet.bankName}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {wallet.accountNumber} • <span style={{ textTransform: "uppercase" }}>{wallet.accountHolderName}</span>
                              </div>
                              <div style={{ marginTop: "2px" }}>
                                <span className="badge badge--success" style={{ fontSize: "9px", padding: "1px 6px" }}>
                                  Đã liên kết
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-light)" }}>Chưa liên kết</span>
                          )}
                        </td>
                        <td>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            {wallet.dailyWithdrawLimit != null ? formatMoney(wallet.dailyWithdrawLimit) : "-"}
                          </span>
                        </td>
                        <td>
                          {wallet.userType === "MECHANIC" ? (
                            <strong
                              className="tabular-nums"
                              style={{ color: (wallet.failedPinAttempts ?? 0) >= 5 ? "var(--danger)" : "inherit" }}
                            >
                              {wallet.failedPinAttempts ?? 0} / 5
                            </strong>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn--sm ${wallet.status === "ACTIVE" ? "btn--danger" : "btn--success"}`}
                            onClick={async () => {
                              try {
                                const newStatus = wallet.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
                                await updateWalletStatus(wallet.userId, { status: newStatus });
                                await walletsQuery.refetch();
                              } catch (error: any) {
                                alert(error.message || "Không thể cập nhật trạng thái ví.");
                              }
                            }}
                          >
                            {wallet.status === "ACTIVE" ? "Khóa ví" : "Mở khóa ví"}
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

              <Pagination
                page={walletsPage}
                pageSize={20}
                total={walletsQuery.data.total}
                label="tài khoản"
                onPrev={() => setWalletsPage((prev) => prev - 1)}
                onNext={() => setWalletsPage((prev) => prev + 1)}
              />
            </>
          ) : (
            <SkeletonCard />
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2>Lịch sử giao dịch</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                Hiển thị mã giao dịch, ví, người dùng, loại giao dịch, tham chiếu đơn hàng/thanh toán, trạng thái và ghi chú.
              </p>
            </div>
            <button className="btn btn--success" onClick={handleExportTransactions} disabled={exportingTransactions}>
              <Download size={14} />
              {exportingTransactions ? "Đang xuất..." : "Xuất Excel"}
            </button>
          </div>

          <div className="filter-bar">
            <input
              className="input"
              style={{ flex: 1, minWidth: "220px" }}
              placeholder="Tìm theo tên, số điện thoại hoặc ghi chú..."
              value={transactionQuery}
              onChange={(e) => {
                setTransactionQuery(e.target.value);
                setTxPage(1);
              }}
            />
            <input
              className="input"
              style={{ width: "240px" }}
              placeholder="Lọc theo mã ví (Wallet ID) nếu cần..."
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                setTxPage(1);
              }}
            />
            <select
              className="select"
              style={{ width: "160px" }}
              value={transactionUserType}
              onChange={(e) => {
                setTransactionUserType(e.target.value);
                setTxPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MECHANIC">MECHANIC</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              className="select"
              style={{ width: "160px" }}
              value={flow}
              onChange={(e) => {
                setFlow(e.target.value);
                setTxPage(1);
              }}
            >
              <option value="">Tất cả luồng tiền</option>
              <option value="IN">Tiền vào</option>
              <option value="OUT">Tiền ra</option>
            </select>
            <input
              className="input"
              style={{ width: "220px" }}
              placeholder="Loại giao dịch, ví dụ: ORDER_PAYMENT"
              value={txType}
              onChange={(e) => {
                setTxType(e.target.value);
                setTxPage(1);
              }}
            />
            <button className="btn btn--ghost" onClick={() => txQuery.refetch()} disabled={txQuery.isFetching}>
              <RefreshCw size={14} />
              {txQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {txQuery.isError ? (
            <ErrorCard error={txQuery.error} />
          ) : txQuery.data ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã giao dịch</th>
                      <th>Chủ ví</th>
                      <th>Loại giao dịch</th>
                      <th>Luồng tiền</th>
                      <th>Số tiền</th>
                      <th>Số dư trước / sau</th>
                      <th>Tham chiếu</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txQuery.data.items.map((tx) => (
                      <tr key={tx.transactionId}>
                        <td>
                          <div className="tabular-nums" style={{ fontWeight: 700 }}>
                            {tx.transactionId.slice(0, 8).toUpperCase()}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.walletId.slice(0, 8)}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.fullName}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.phoneNumber}</div>
                          <div style={{ marginTop: "4px" }}>
                            <span className={`badge ${tx.userType === "MECHANIC" ? "badge--info" : "badge--success"}`} style={{ fontSize: "10px" }}>
                              {tx.userType}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{getTransactionTypeLabel(tx.transactionType)}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.transactionType}</div>
                        </td>
                        <td>
                          <span className={`badge ${tx.flowType === "IN" ? "badge--success" : "badge--warning"}`}>{getFlowLabel(tx.flowType)}</span>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 700 }}>
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="tabular-nums">
                          <div>{formatMoney(tx.balanceBefore)}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>→ {formatMoney(tx.balanceAfter)}</div>
                        </td>
                        <td>
                          <div>Đơn: {tx.referenceOrderId ?? "-"}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Thanh toán: {tx.paymentId ?? "-"}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              ["SUCCESS", "PAID", "COMPLETED"].includes((tx.status ?? "").toUpperCase())
                                ? "badge--success"
                                : (tx.status ?? "").toUpperCase() === "PENDING"
                                  ? "badge--warning"
                                  : "badge--danger"
                            }`}
                          >
                            {getTransactionStatusLabel(tx.status)}
                          </span>
                        </td>
                        <td style={{ maxWidth: "240px" }}>{tx.description || "-"}</td>
                        <td>{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                    {txQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={10}>
                          <div className="empty-state">Chưa có giao dịch nào phù hợp bộ lọc.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={txPage}
                pageSize={20}
                total={txQuery.data.total}
                label="giao dịch"
                onPrev={() => setTxPage((prev) => prev - 1)}
                onNext={() => setTxPage((prev) => prev + 1)}
              />
            </>
          ) : (
            <SkeletonCard />
          )}
        </div>
      )}

      {tab === "withdraw" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <h2>Duyệt rút tiền</h2>
          </div>

          <div className="filter-bar">
            <select
              className="select"
              style={{ width: "220px" }}
              value={wrStatus}
              onChange={(e) => {
                setWrStatus(e.target.value);
                setWrPage(1);
              }}
            >
              <option value="PENDING">Đang chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
            <button className="btn btn--ghost" onClick={() => wrQuery.refetch()} disabled={wrQuery.isFetching}>
              <RefreshCw size={14} />
              {wrQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {wrQuery.isError ? (
            <ErrorCard error={wrQuery.error} />
          ) : wrQuery.data ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Người rút</th>
                      <th>Số tiền</th>
                      <th>Ngân hàng</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                      <th>Thời gian yêu cầu</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wrQuery.data.items.map((request) => {
                      const bankCode = getVietQRBankId(request.bankName ?? "");
                      const qrUrl =
                        bankCode && request.accountNumber
                          ? `https://img.vietqr.io/image/${bankCode}-${request.accountNumber}-compact2.png?amount=${Math.round(
                              request.amount
                            )}&addInfo=RUT%20TIEN%20SOSBIKE`
                          : null;

                      return (
                        <tr key={request.requestId}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{request.fullName}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{request.phoneNumber}</div>
                          </td>
                          <td className="tabular-nums" style={{ fontWeight: 700 }}>
                            {formatMoney(request.amount)}
                          </td>
                          <td>
                            {request.bankName ? (
                              <div style={{ display: "grid", gap: "2px" }}>
                                <div style={{ fontWeight: 500 }}>{request.bankName}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  {request.accountNumber} • {request.accountHolderName}
                                </div>
                                {qrUrl && (
                                  <div style={{ marginTop: "4px" }}>
                                    <a
                                      className="btn btn--sm btn--ghost"
                                      href={qrUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        height: "auto",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      Xem mã QR
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                request.status === "APPROVED"
                                  ? "badge--success"
                                  : request.status === "REJECTED"
                                    ? "badge--danger"
                                    : "badge--warning"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td>{request.note || "-"}</td>
                          <td>
                            <div>{formatDate(request.requestedAt)}</div>
                            {request.reviewedAt && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Xử lý: {formatDate(request.reviewedAt)}
                              </div>
                            )}
                          </td>
                          <td>
                            {request.status === "PENDING" ? (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  className="btn btn--sm btn--success"
                                  onClick={() => {
                                    setCurrentRequest(request);
                                    setActionType("approve");
                                    setActionNote("");
                                  }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  className="btn btn--sm btn--danger"
                                  onClick={() => {
                                    setCurrentRequest(request);
                                    setActionType("reject");
                                    setActionNote("");
                                  }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : qrUrl ? (
                              <a className="btn btn--sm btn--ghost" href={qrUrl} target="_blank" rel="noreferrer">
                                Mở mã QR
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {wrQuery.data.items.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">Không có yêu cầu rút tiền nào.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={wrPage}
                pageSize={20}
                total={wrQuery.data.total}
                label="yêu cầu"
                onPrev={() => setWrPage((prev) => prev - 1)}
                onNext={() => setWrPage((prev) => prev + 1)}
              />
            </>
          ) : (
            <SkeletonCard />
          )}
        </div>
      )}

      <Modal
        isOpen={!!currentRequest && !!actionType}
        onClose={() => {
          if (submittingAction) return;
          setCurrentRequest(null);
          setActionType(null);
          setActionNote("");
        }}
        title={actionType === "approve" ? "Duyệt yêu cầu rút tiền" : "Từ chối yêu cầu rút tiền"}
        footer={
          <>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setCurrentRequest(null);
                setActionType(null);
                setActionNote("");
              }}
              disabled={submittingAction}
            >
              Hủy
            </button>
            <button
              className={`btn ${actionType === "approve" ? "btn--success" : "btn--danger"}`}
              onClick={handleSettleAction}
              disabled={submittingAction}
            >
              {submittingAction ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          {currentRequest && (
            <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {actionType === "approve" ? (
                <>
                  <p style={{ marginBottom: "8px" }}>
                    Xác nhận xử lý và duyệt yêu cầu rút tiền của <strong>{currentRequest.fullName}</strong>.
                  </p>
                  <div 
                    style={{ 
                      background: "var(--background-secondary, #f8f9fa)", 
                      padding: "12px", 
                      borderRadius: "6px", 
                      border: "1px solid var(--border-color, #dee2e6)",
                      marginBottom: "12px",
                      color: "var(--text-primary)"
                    }}
                  >
                    <div style={{ marginBottom: "6px" }}>
                      Số tiền rút: <strong style={{ color: "var(--secondary, #28a745)", fontSize: "16px" }}>{formatMoney(currentRequest.amount)}</strong>
                    </div>
                    <div>
                      Ngân hàng: <strong>{currentRequest.bankName}</strong>
                    </div>
                    <div>
                      Số tài khoản: <strong>{currentRequest.accountNumber}</strong>
                    </div>
                    <div>
                      Tên chủ tài khoản: <strong style={{ textTransform: "uppercase" }}>{currentRequest.accountHolderName}</strong>
                    </div>
                  </div>

                  {modalQrUrl ? (
                    <div style={{ textAlign: "center", margin: "16px 0", display: "grid", gap: "8px", justifyContent: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        Quét mã QR dưới đây để thực hiện chuyển tiền:
                      </span>
                      <img 
                        src={modalQrUrl} 
                        alt="Mã QR Chuyển Khoản" 
                        style={{ 
                          width: "220px", 
                          height: "220px", 
                          objectFit: "contain",
                          border: "1px solid var(--border-color, #dee2e6)",
                          borderRadius: "8px",
                          padding: "8px",
                          background: "#fff",
                          margin: "0 auto"
                        }} 
                      />
                      <span style={{ fontSize: "11px", color: "var(--danger, #dc3545)", fontWeight: "600" }}>
                        * Vui lòng chuyển khoản thành công trước khi nhấn nút "Xác nhận duyệt".
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "var(--danger)", fontSize: "12px", padding: "8px 0" }}>
                      Không thể tạo mã QR (thiếu thông tin ngân hàng hợp lệ).
                    </div>
                  )}
                </>
              ) : (
                <>
                  Xác nhận xử lý yêu cầu rút {formatMoney(currentRequest.amount)} của {currentRequest.fullName}.
                </>
              )}
            </div>
          )}
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Ghi chú</span>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Nhập ghi chú nội bộ hoặc nội dung phản hồi..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
