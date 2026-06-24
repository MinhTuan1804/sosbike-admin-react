import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createUser, listUsers, updateUserFlags, getUser, verifyMechanic } from "./usersApi";
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

  // Detailed Mechanic data from GET
  const { data: mechanicDetail, isFetching: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["admin-user-detail", selectedMechanic?.userId],
    queryFn: () => selectedMechanic ? getUser(selectedMechanic.userId) : Promise.reject("No selected mechanic"),
    enabled: !!selectedMechanic?.userId
  });

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  async function handleVerify(isVerified: boolean) {
    if (!selectedMechanic) return;
    setVerifyError(null);
    setVerifying(true);
    try {
      await verifyMechanic(selectedMechanic.userId, isVerified);
      await refetchDetail();
      await usersQuery.refetch();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Cập nhật trạng thái duyệt thất bại");
    } finally {
      setVerifying(false);
    }
  }

  const [page, setPage] = useState(1);

  const queryKey = useMemo(() => ["admin-users", { q, userType, page }], [q, userType, page]);
  const usersQuery = useQuery({
    queryKey,
    queryFn: () => listUsers({ q: q || undefined, userType: userType || undefined, page, pageSize: 20 })
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
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
            <select
              className="select"
              style={{ width: "160px" }}
              value={userType}
              onChange={(e) => { setUserType(e.target.value); setPage(1); }}
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
            <>
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

            {/* Pagination */}
            <div className="flex-between" style={{ marginTop: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Tổng cộng: {usersQuery.data.total} người dùng
              </span>
              <div className="flex-gap">
                <button
                  className="btn btn--sm"
                  disabled={page <= 1 || usersQuery.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </button>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Trang {page}</span>
                <button
                  className="btn btn--sm"
                  disabled={page * 20 >= usersQuery.data.total || usersQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Đang tải người dùng...</div>
          )}
        </div>
      </div>

      {/* CSS injection for doc thumbnails and lightbox */}
      <style>{`
        .doc-thumbnail:hover .doc-thumbnail-overlay {
          opacity: 1 !important;
        }
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          cursor: zoom-out;
          animation: fadeIn 0.2s ease-out;
        }
        .lightbox-content {
          max-width: 90%;
          max-height: 90%;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          cursor: default;
          animation: zoomIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
      `}</style>

      {/* Lightbox Image Preview */}
      {previewImage && (
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <button 
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "36px", cursor: "pointer" }}
            onClick={() => setPreviewImage(null)}
          >
            &times;
          </button>
          <img 
            className="lightbox-content" 
            src={previewImage} 
            alt="Preview" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Mechanic Detailed Document Viewer Modal */}
      <Modal
        isOpen={!!selectedMechanic}
        onClose={() => setSelectedMechanic(null)}
        title="Hồ sơ & Tài liệu của Thợ cứu hộ"
        size="lg"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => setSelectedMechanic(null)}>Đóng</button>
            {mechanicDetail && mechanicDetail.mechanic && (
              <>
                {mechanicDetail.mechanic.isVerified ? (
                  <button 
                    className="btn btn--danger" 
                    onClick={() => handleVerify(false)} 
                    disabled={verifying}
                  >
                    {verifying ? "Đang xử lý..." : "Hủy duyệt hồ sơ"}
                  </button>
                ) : (
                  <button 
                    className="btn btn--primary" 
                    onClick={() => handleVerify(true)} 
                    disabled={verifying}
                  >
                    {verifying ? "Đang xử lý..." : "Duyệt hồ sơ thợ"}
                  </button>
                )}
              </>
            )}
          </div>
        }
      >
        {selectedMechanic && (
          <>
            {loadingDetail ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                Đang tải tài liệu chi tiết của thợ...
              </div>
            ) : mechanicDetail ? (
              <div style={{ display: "grid", gap: "20px", maxHeight: "70vh", overflowY: "auto", paddingRight: "4px" }}>
                
                {/* 1. General Info & Avatar Card */}
                <div style={{ display: "flex", gap: "16px", background: "var(--neutral-bg)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--primary)", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {mechanicDetail.avatarUrl ? (
                      <img src={mechanicDetail.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "#888" }}>
                        {mechanicDetail.fullName ? mechanicDetail.fullName.charAt(0).toUpperCase() : "M"}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--secondary)" }}>{mechanicDetail.fullName}</span>
                      <span className={`badge ${mechanicDetail.mechanic?.isVerified ? "badge--success" : "badge--warning"}`} style={{ fontSize: "10px", padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {mechanicDetail.mechanic?.isVerified ? (
                          <>
                            <CheckCircle2 size={10} />
                            <span>ĐÃ XÁC MINH</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            <span>CHỜ XÁC MINH</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                      <div>Số điện thoại: <strong>{mechanicDetail.phoneNumber}</strong></div>
                      <div>Email: <strong>{mechanicDetail.email || "(Không có)"}</strong></div>
                      <div>Ngày sinh: <strong>{mechanicDetail.dateOfBirth || "(Chưa nhập)"}</strong></div>
                      <div>Giới tính: <strong>{mechanicDetail.gender || "(Chưa nhập)"}</strong></div>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Địa chỉ hiện tại: <strong>{mechanicDetail.currentAddress || "(Chưa nhập)"}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Identity Verification (CCCD/CMND) */}
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "12px", background: "var(--primary)", borderRadius: "2px" }}></span>
                    Chứng minh thư / Căn cước công dân (CCCD)
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div style={{ fontSize: "13px", background: "var(--card-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      Số CCCD: <strong style={{ fontSize: "14px" }}>{mechanicDetail.mechanic?.identityCard || "(Chưa cập nhật)"}</strong>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Ảnh mặt trước:</div>
                        {mechanicDetail.mechanic?.cccdFrontUrl ? (
                          <div 
                            onClick={() => setPreviewImage(mechanicDetail.mechanic.cccdFrontUrl)}
                            style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "160px", background: "#f5f5f5", position: "relative" }}
                            className="doc-thumbnail"
                          >
                            <img src={mechanicDetail.mechanic.cccdFrontUrl} alt="CCCD Mặt trước" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
                              <Eye size={14} /> Click để phóng to
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "12px" }}>
                            Chưa tải ảnh mặt trước
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Ảnh mặt sau:</div>
                        {mechanicDetail.mechanic?.cccdBackUrl ? (
                          <div 
                            onClick={() => setPreviewImage(mechanicDetail.mechanic.cccdBackUrl)}
                            style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "160px", background: "#f5f5f5", position: "relative" }}
                            className="doc-thumbnail"
                          >
                            <img src={mechanicDetail.mechanic.cccdBackUrl} alt="CCCD Mặt sau" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
                              <Eye size={14} /> Click để phóng to
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "12px" }}>
                            Chưa tải ảnh mặt sau
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Vehicle Information & Verification */}
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "12px", background: "var(--primary)", borderRadius: "2px" }}></span>
                    Thông tin phương tiện & Giấy tờ lái xe
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--card-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Phương tiện:</div>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>
                          {mechanicDetail.mechanic?.vehicleModel ? `${mechanicDetail.mechanic.vehicleModel} ${mechanicDetail.mechanic.vehicleGeneration ? `(${mechanicDetail.mechanic.vehicleGeneration})` : ""}` : "(Chưa cập nhật)"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Biển số xe:</div>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>{mechanicDetail.mechanic?.licensePlate || "(Chưa cập nhật)"}</div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Số giấy phép lái xe (GPLX):</div>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>{mechanicDetail.mechanic?.driverLicenseNumber || "(Chưa cập nhật)"}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Đăng ký xe (Cà vẹt):</div>
                        {mechanicDetail.mechanic?.vehicleRegistrationUrl ? (
                          <div 
                            onClick={() => setPreviewImage(mechanicDetail.mechanic.vehicleRegistrationUrl)}
                            style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "110px", background: "#f5f5f5", position: "relative" }}
                            className="doc-thumbnail"
                          >
                            <img src={mechanicDetail.mechanic.vehicleRegistrationUrl} alt="Cà vẹt xe" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              <Eye size={12} /> Xem
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "110px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "8px" }}>
                            Chưa tải
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Bằng lái xe (GPLX):</div>
                        {mechanicDetail.mechanic?.driverLicenseUrl ? (
                          <div 
                            onClick={() => setPreviewImage(mechanicDetail.mechanic.driverLicenseUrl)}
                            style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "110px", background: "#f5f5f5", position: "relative" }}
                            className="doc-thumbnail"
                          >
                            <img src={mechanicDetail.mechanic.driverLicenseUrl} alt="Bằng lái xe" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              <Eye size={12} /> Xem
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "110px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "8px" }}>
                            Chưa tải
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Bảo hiểm xe:</div>
                        {mechanicDetail.mechanic?.vehicleInsuranceUrl ? (
                          <div 
                            onClick={() => setPreviewImage(mechanicDetail.mechanic.vehicleInsuranceUrl)}
                            style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "110px", background: "#f5f5f5", position: "relative" }}
                            className="doc-thumbnail"
                          >
                            <img src={mechanicDetail.mechanic.vehicleInsuranceUrl} alt="Bảo hiểm xe" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              <Eye size={12} /> Xem
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "110px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "8px" }}>
                            Chưa tải
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Bank Account & Certificates */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "12px", background: "var(--primary)", borderRadius: "2px" }}></span>
                      Tài khoản ngân hàng
                    </h3>
                    {mechanicDetail.wallet ? (
                      <div style={{ display: "grid", gap: "6px", background: "var(--card-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "13px" }}>
                        <div>Ngân hàng: <strong>{mechanicDetail.wallet.bankName || "(Chưa nhập)"}</strong></div>
                        <div>Số tài khoản: <strong>{mechanicDetail.wallet.accountNumber || "(Chưa nhập)"}</strong></div>
                        <div>Chủ tài khoản: <strong>{mechanicDetail.wallet.accountHolderName || "(Chưa nhập)"}</strong></div>
                        <div style={{ marginTop: "4px" }}>
                          Trạng thái: <span className={`badge ${mechanicDetail.wallet.bankName ? "badge--success" : "badge--danger"}`} style={{ fontSize: "9px" }}>
                            {mechanicDetail.wallet.bankName ? "Đã liên kết" : "Chưa liên kết"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "16px", textAlign: "center", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "12px" }}>
                        Chưa tạo ví thanh toán
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", color: "var(--secondary)" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "12px", background: "var(--primary)", borderRadius: "2px" }}></span>
                      Chứng chỉ hành nghề
                    </h3>
                    {mechanicDetail.mechanic?.certificateUrl ? (
                      <div 
                        onClick={() => setPreviewImage(mechanicDetail.mechanic.certificateUrl)}
                        style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "92px", background: "#f5f5f5", position: "relative" }}
                        className="doc-thumbnail"
                      >
                        <img src={mechanicDetail.mechanic.certificateUrl} alt="Chứng chỉ" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                          <Eye size={12} /> Xem chứng chỉ
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "92px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "12px" }}>
                        Không có chứng chỉ nghề được gửi kèm
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action panel error */}
                {verifyError && (
                  <div style={{ color: "var(--danger)", background: "var(--danger-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "12px", border: "1px solid var(--danger)", marginTop: "8px" }}>
                    <strong>Lỗi cập nhật:</strong> {verifyError}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--danger)" }}>
                Không thể tải hồ sơ chi tiết của thợ.
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
