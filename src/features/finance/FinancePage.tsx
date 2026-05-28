import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  approveWithdraw,
  listTransactions,
  listWallets,
  listWithdrawRequests,
  rejectWithdraw
} from "./financeApi";

type Tab = "wallets" | "transactions" | "withdraw";

export function FinancePage() {
  const [tab, setTab] = useState<Tab>("wallets");

  const [q, setQ] = useState("");
  const [userType, setUserType] = useState("");

  const [walletId, setWalletId] = useState("");
  const [flow, setFlow] = useState("");
  const [type, setType] = useState("");

  const [wrStatus, setWrStatus] = useState("PENDING");

  const walletsQuery = useQuery({
    queryKey: useMemo(() => ["finance-wallets", { q, userType }], [q, userType]),
    queryFn: () => listWallets({ q: q || undefined, userType: userType || undefined, page: 1, pageSize: 50 }),
    enabled: tab === "wallets"
  });

  const txQuery = useQuery({
    queryKey: useMemo(() => ["finance-tx", { walletId, flow, type }], [walletId, flow, type]),
    queryFn: () =>
      listTransactions({
        walletId: walletId || undefined,
        flow: flow || undefined,
        type: type || undefined,
        page: 1,
        pageSize: 100
      }),
    enabled: tab === "transactions"
  });

  const wrQuery = useQuery({
    queryKey: useMemo(() => ["finance-wr", { wrStatus }], [wrStatus]),
    queryFn: () => listWithdrawRequests({ status: wrStatus || undefined, page: 1, pageSize: 100 }),
    enabled: tab === "withdraw"
  });

  return (
    <div>
      <h1>Tài chính & Ví</h1>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setTab("wallets")} disabled={tab === "wallets"}>
          Wallets
        </button>
        <button onClick={() => setTab("transactions")} disabled={tab === "transactions"}>
          Transactions
        </button>
        <button onClick={() => setTab("withdraw")} disabled={tab === "withdraw"}>
          Withdraw approvals
        </button>
      </div>

      {tab === "wallets" ? (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input placeholder="Tìm tên/sđt" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MECHANIC">MECHANIC</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button onClick={() => walletsQuery.refetch()} disabled={walletsQuery.isFetching}>
              {walletsQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {walletsQuery.data ? (
            <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th>User</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Bank</th>
                  <th>Daily limit</th>
                </tr>
              </thead>
              <tbody>
                {walletsQuery.data.items.map((w) => (
                  <tr key={w.walletId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td>
                      {w.fullName} ({w.phoneNumber})
                    </td>
                    <td>{w.userType}</td>
                    <td>{w.balance ?? 0}</td>
                    <td>{w.status ?? "-"}</td>
                    <td>
                      {w.bankName ? `${w.bankName} - ${w.accountNumber} - ${w.accountHolderName}` : "-"}
                    </td>
                    <td>{w.dailyWithdrawLimit ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : walletsQuery.isError ? (
            <div style={{ color: "crimson" }}>{String(walletsQuery.error)}</div>
          ) : (
            <div>Đang tải...</div>
          )}
        </div>
      ) : null}

      {tab === "transactions" ? (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input placeholder="walletId (optional)" value={walletId} onChange={(e) => setWalletId(e.target.value)} />
            <input placeholder="flow (IN/OUT)" value={flow} onChange={(e) => setFlow(e.target.value)} />
            <input placeholder="type (WITHDRAWAL/...)" value={type} onChange={(e) => setType(e.target.value)} />
            <button onClick={() => txQuery.refetch()} disabled={txQuery.isFetching}>
              {txQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {txQuery.data ? (
            <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th>User</th>
                  <th>Type</th>
                  <th>Flow</th>
                  <th>Amount</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {txQuery.data.items.map((t) => (
                  <tr key={t.transactionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td>
                      {t.fullName} ({t.phoneNumber})
                    </td>
                    <td>{t.transactionType}</td>
                    <td>{t.flowType}</td>
                    <td>{t.amount}</td>
                    <td>{t.balanceBefore}</td>
                    <td>{t.balanceAfter}</td>
                    <td>{t.createdAt ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : txQuery.isError ? (
            <div style={{ color: "crimson" }}>{String(txQuery.error)}</div>
          ) : (
            <div>Đang tải...</div>
          )}
        </div>
      ) : null}

      {tab === "withdraw" ? (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <select value={wrStatus} onChange={(e) => setWrStatus(e.target.value)}>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="">ALL</option>
            </select>
            <button onClick={() => wrQuery.refetch()} disabled={wrQuery.isFetching}>
              {wrQuery.isFetching ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {wrQuery.data ? (
            <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Bank</th>
                  <th>Requested</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {wrQuery.data.items.map((r) => (
                  <tr key={r.requestId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td>
                      {r.fullName} ({r.phoneNumber})
                    </td>
                    <td>{r.amount}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.bankName ? `${r.bankName} - ${r.accountNumber} - ${r.accountHolderName}` : "-"}
                    </td>
                    <td>{r.requestedAt ?? "-"}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      {r.status === "PENDING" ? (
                        <>
                          <button
                            onClick={async () => {
                              await approveWithdraw(r.requestId);
                              await wrQuery.refetch();
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              await rejectWithdraw(r.requestId);
                              await wrQuery.refetch();
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : wrQuery.isError ? (
            <div style={{ color: "crimson" }}>{String(wrQuery.error)}</div>
          ) : (
            <div>Đang tải...</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

