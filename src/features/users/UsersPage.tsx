import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createUser, listUsers, updateUserFlags } from "./usersApi";

export function UsersPage() {
  const [q, setQ] = useState("");
  const [userType, setUserType] = useState<string>("");

  const [createPhone, setCreatePhone] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("123456");
  const [createType, setCreateType] = useState<"CUSTOMER" | "MECHANIC" | "ADMIN">("CUSTOMER");
  const [createIdentityCard, setCreateIdentityCard] = useState("");
  const [createLicensePlate, setCreateLicensePlate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const queryKey = useMemo(() => ["admin-users", { q, userType }], [q, userType]);
  const usersQuery = useQuery({
    queryKey,
    queryFn: () => listUsers({ q: q || undefined, userType: userType || undefined, page: 1, pageSize: 50 })
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await createUser({
        phoneNumber: createPhone.trim(),
        password: createPassword,
        fullName: createName.trim(),
        userType: createType,
        identityCard: createType === "MECHANIC" ? createIdentityCard.trim() : undefined,
        licensePlate: createType === "MECHANIC" ? createLicensePlate.trim() : undefined
      });
      setCreatePhone("");
      setCreateName("");
      setCreateIdentityCard("");
      setCreateLicensePlate("");
      await usersQuery.refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <h1>Tài khoản</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        <input placeholder="Tìm theo tên/sđt" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="ADMIN">ADMIN</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="MECHANIC">MECHANIC</option>
        </select>
        <button onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
          {usersQuery.isFetching ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <h2>Tạo tài khoản</h2>
      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Số điện thoại" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
          <input placeholder="Họ tên" value={createName} onChange={(e) => setCreateName(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Mật khẩu"
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
          />
          <select value={createType} onChange={(e) => setCreateType(e.target.value as any)}>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="MECHANIC">MECHANIC</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        {createType === "MECHANIC" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="IdentityCard"
              value={createIdentityCard}
              onChange={(e) => setCreateIdentityCard(e.target.value)}
            />
            <input
              placeholder="LicensePlate"
              value={createLicensePlate}
              onChange={(e) => setCreateLicensePlate(e.target.value)}
            />
          </div>
        ) : null}

        <button type="submit">Tạo</button>
        {createError ? (
          <div style={{ color: "crimson" }}>
            <strong>Lỗi:</strong> {createError}
          </div>
        ) : null}
      </form>

      <h2 style={{ marginTop: 20 }}>Danh sách</h2>
      {usersQuery.isError ? (
        <div style={{ color: "crimson" }}>{String(usersQuery.error)}</div>
      ) : usersQuery.data ? (
        <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th>SĐT</th>
              <th>Họ tên</th>
              <th>Loại</th>
              <th>Active</th>
              <th>Locked</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usersQuery.data.items.map((u) => (
              <tr key={u.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td>{u.phoneNumber}</td>
                <td>{u.fullName}</td>
                <td>{u.userType}</td>
                <td>{u.isActive ? "Yes" : "No"}</td>
                <td>{u.isLocked ? "Yes" : "No"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={async () => {
                      await updateUserFlags(u.userId, { isLocked: !u.isLocked });
                      await usersQuery.refetch();
                    }}
                  >
                    {u.isLocked ? "Unlock" : "Lock"}
                  </button>
                  <button
                    onClick={async () => {
                      await updateUserFlags(u.userId, { isActive: !u.isActive });
                      await usersQuery.refetch();
                    }}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
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

