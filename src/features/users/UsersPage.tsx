import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createUser, listUsers, updateUserFlags } from "./usersApi";
import { Modal } from "../../shared/components/Modal";

export function UsersPage() {
  const [q, setQ] = useState("");
  const [userType, setUserType] = useState<string>("");

  // Create User state
  const [createPhone, setCreatePhone] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("123456");
  const [createType, setCreateType] = useState<"CUSTOMER" | "MECHANIC" | "ADMIN">("CUSTOMER");
  const [createIdentityCard, setCreateIdentityCard] = useState("");
  const [createLicensePlate, setCreateLicensePlate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Mechanic Detail state
  const [selectedMechanic, setSelectedMechanic] = useState<any | null>(null);

  const queryKey = useMemo(() => ["admin-users", { q, userType }], [q, userType]);
  const usersQuery = useQuery({
    queryKey,
    queryFn: () => listUsers({ q: q || undefined, userType: userType || undefined, page: 1, pageSize: 50 })
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
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
      setCreatePassword("123456");
      await usersQuery.refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Tạo tài khoản thất bại");
    } finally {
      setCreating(false);
    }
  }

  function handleRowClick(user: any) {
    if (user.userType === "MECHANIC") {
      setSelectedMechanic(user);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Quản lý tài khoản</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Tạo mới tài khoản quản trị/thợ/khách hàng, và quản lý các trạng thái hoạt động/khóa của họ.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Side: Create User Form Card */}
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--secondary)" }}>Tạo tài khoản mới</h2>
          <form onSubmit={onCreate} style={{ display: "grid", gap: "12px" }}>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                className="input"
                placeholder="Ví dụ: 098xxxxxxx"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                className="input"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu đăng nhập</label>
              <input
                className="input"
                placeholder="Nhập mật khẩu"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Vai trò hệ thống</label>
              <select
                className="select"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as any)}
              >
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                <option value="MECHANIC">Thợ sửa xe (MECHANIC)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>

            {createType === "MECHANIC" && (
              <div style={{ display: "grid", gap: "12px", background: "var(--neutral-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Thông tin thợ cứu hộ</div>
                
                <div className="form-group">
                  <label>Số CCCD / IdentityCard</label>
                  <input
                    className="input"
                    placeholder="Nhập số căn cước"
                    value={createIdentityCard}
                    onChange={(e) => setCreateIdentityCard(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Biển số xe / LicensePlate</label>
                  <input
                    className="input"
                    placeholder="Ví dụ: 29A-12345"
                    value={createLicensePlate}
                    onChange={(e) => setCreateLicensePlate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn--primary" style={{ marginTop: "8px" }} disabled={creating}>
              {creating ? "Đang xử lý..." : "Xác nhận tạo"}
            </button>

            {createError && (
              <div style={{ color: "var(--danger)", background: "var(--danger-bg)", padding: "10px", borderRadius: "var(--radius-md)", fontSize: "12px", border: "1px solid var(--danger)", marginTop: "8px" }}>
                <strong>Lỗi:</strong> {createError}
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Users List Card */}
        <div style={{ display: "grid", gap: "16px" }}>
          
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Tìm kiếm theo tên, số điện thoại..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="select"
              style={{ width: "160px" }}
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MECHANIC">MECHANIC</option>
            </select>
            <button className="btn" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
              {usersQuery.isFetching ? "..." : "Tải lại"}
            </button>
          </div>

          {/* Table Container */}
          {usersQuery.isError ? (
            <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
              <strong>Lỗi:</strong> {String(usersQuery.error)}
            </div>
          ) : usersQuery.data ? (
            <div className="table-container" style={{ marginTop: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Họ tên & Số điện thoại</th>
                    <th>Vai trò</th>
                    <th>Hoạt động (Active)</th>
                    <th>Trạng thái Khóa</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.items.map((u) => (
                    <tr
                      key={u.userId}
                      style={{ cursor: u.userType === "MECHANIC" ? "pointer" : "default" }}
                      onClick={() => handleRowClick(u)}
                      title={u.userType === "MECHANIC" ? "Bấm vào để xem tài liệu thợ" : undefined}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.phoneNumber}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          u.userType === "ADMIN" ? "badge--danger" :
                          u.userType === "MECHANIC" ? "badge--info" : "badge--success"
                        }`} style={{ fontSize: "10px" }}>
                          {u.userType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? "badge--success" : "badge--danger"}`} style={{ fontSize: "9px", padding: "1px 6px" }}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isLocked ? "badge--danger" : "badge--success"}`} style={{ fontSize: "9px", padding: "1px 6px" }}>
                          {u.isLocked ? "Locked" : "Unlocked"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`btn btn--sm ${u.isLocked ? "btn--primary" : "btn--danger"}`}
                            style={{ minWidth: "70px" }}
                            onClick={async () => {
                              await updateUserFlags(u.userId, { isLocked: !u.isLocked });
                              await usersQuery.refetch();
                            }}
                          >
                            {u.isLocked ? "Mở khóa" : "Khóa"}
                          </button>
                          <button
                            className="btn btn--sm"
                            style={{ minWidth: "90px" }}
                            onClick={async () => {
                              await updateUserFlags(u.userId, { isActive: !u.isActive });
                              await usersQuery.refetch();
                            }}
                          >
                            {u.isActive ? "Tạm ngưng" : "Kích hoạt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersQuery.data.items.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Không có người dùng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải người dùng...</div>
          )}
        </div>
      </div>

      {/* Mechanic Detailed Document Viewer Modal */}
      <Modal
        isOpen={!!selectedMechanic}
        onClose={() => setSelectedMechanic(null)}
        title="Hồ sơ & Tài liệu của Thợ cứu hộ"
        size="md"
        footer={<button className="btn" onClick={() => setSelectedMechanic(null)}>Đóng</button>}
      >
        {selectedMechanic && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "var(--neutral-bg)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Thông tin thợ:</div>
              <div style={{ fontSize: "16px", fontWeight: "700", marginTop: "2px" }}>{selectedMechanic.fullName}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>Số điện thoại: <b>{selectedMechanic.phoneNumber}</b></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="card" style={{ padding: "12px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Số CCCD / ID Card:</div>
                <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "4px" }}>
                  {selectedMechanic.identityCard || "(Chưa cập nhật)"}
                </div>
              </div>
              <div className="card" style={{ padding: "12px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Biển số xe / License Plate:</div>
                <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "4px" }}>
                  {selectedMechanic.licensePlate || "(Chưa cập nhật)"}
                </div>
              </div>
            </div>

            {/* Quick action flag status */}
            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginTop: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Trạng thái tài khoản:</div>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <span className={`badge ${selectedMechanic.isActive ? "badge--success" : "badge--danger"}`}>
                    {selectedMechanic.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                  </span>
                  <span className={`badge ${selectedMechanic.isLocked ? "badge--danger" : "badge--success"}`}>
                    {selectedMechanic.isLocked ? "Đã khóa" : "Mở khóa"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={async () => {
                    await updateUserFlags(selectedMechanic.userId, { isLocked: !selectedMechanic.isLocked });
                    setSelectedMechanic(null);
                    await usersQuery.refetch();
                  }}
                >
                  {selectedMechanic.isLocked ? "Mở khóa ngay" : "Khóa tài khoản"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
