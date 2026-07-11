import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Eye, Users, UserPlus, Search, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createUser, listUsers, updateUserFlags, getUser, verifyMechanic, hardDeleteUser, updateWalletStatus } from "./usersApi";
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mechanic Detail state
  const [selectedMechanic, setSelectedMechanic] = useState<any | null>(null);

  const { data: mechanicDetail, isFetching: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["admin-user-detail", selectedMechanic?.userId],
    queryFn: () => selectedMechanic ? getUser(selectedMechanic.userId) : Promise.reject("No selected mechanic"),
    enabled: !!selectedMechanic?.userId
  });

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const queryKey = useMemo(() => ["admin-users", { q, userType, page }], [q, userType, page]);
  const usersQuery = useQuery({
    queryKey,
    queryFn: () => listUsers({ q: q || undefined, userType: userType || undefined, page, pageSize: 20 })
  });

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
      setShowCreateForm(false);
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

  const total = usersQuery.data?.total ?? 0;
  const from  = Math.min((page - 1) * 20 + 1, total);
  const to    = Math.min(page * 20, total);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* CSS for doc-thumbnail overlay */}
      <style>{`
        .doc-thumbnail:hover .doc-thumbnail-overlay { opacity: 1 !important; }
        .lightbox-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; cursor: zoom-out;
          animation: fadeIn 0.2s ease-out;
        }
        .lightbox-content {
          max-width: 90%; max-height: 90%;
          border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          cursor: default; animation: zoomIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); } to { transform: scale(1); } }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <Users size={22} style={{ color: "var(--primary)" }} />
              Quản lý tài khoản
            </span>
          </h1>
          <p>Tạo mới, phân quyền và quản lý trạng thái người dùng trên hệ thống</p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateForm(true)}
            id="open-create-user-btn"
          >
            <UserPlus size={14} />
            Tạo tài khoản mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <span className="input-icon-wrap__icon"><Search size={14} /></span>
          <input
            className="input"
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            id="users-search"
            aria-label="Tìm kiếm người dùng"
          />
        </div>
        <select
          className="select"
          style={{ width: "160px" }}
          value={userType}
          onChange={(e) => { setUserType(e.target.value); setPage(1); }}
          id="users-role-filter"
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="MECHANIC">Thợ sửa xe</option>
        </select>
        <button className="btn" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching} aria-label="Tải lại danh sách">
          <RefreshCw size={14} />
          {usersQuery.isFetching ? "..." : "Tải lại"}
        </button>
      </div>

      {/* Error State */}
      {usersQuery.isError && (
        <div className="card mb-16" style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "var(--danger-bg)" }}>
          <strong>Lỗi:</strong> {String(usersQuery.error)}
        </div>
      )}

      {/* Users Table */}
      {usersQuery.isLoading ? (
        <div className="table-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "16px", alignItems: "center" }}>
              <span className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
              <span className="skeleton" style={{ width: "160px", height: "20px" }} />
              <span className="skeleton" style={{ width: "80px", height: "20px" }} />
              <span className="skeleton" style={{ width: "60px", height: "20px" }} />
              <span className="skeleton" style={{ width: "60px", height: "20px" }} />
              <span className="skeleton" style={{ width: "140px", height: "32px", marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      ) : usersQuery.data ? (
        <div className="table-container">
          <table className="table" role="grid" aria-label="Danh sách người dùng">
            <thead>
              <tr>
                <th>Họ tên & Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Khóa tài khoản</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.items.map((u) => (
                <tr
                  key={u.userId}
                  style={{ cursor: u.userType === "MECHANIC" ? "pointer" : "default" }}
                  onClick={() => handleRowClick(u)}
                  title={u.userType === "MECHANIC" ? "Bấm để xem hồ sơ thợ" : undefined}
                  tabIndex={u.userType === "MECHANIC" ? 0 : undefined}
                  onKeyDown={(e) => e.key === "Enter" && handleRowClick(u)}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                        background: u.userType === "ADMIN" ? "var(--danger-bg)" : u.userType === "MECHANIC" ? "var(--info-bg)" : "var(--primary-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 700,
                        color: u.userType === "ADMIN" ? "var(--danger)" : u.userType === "MECHANIC" ? "var(--info)" : "var(--primary)"
                      }}>
                        {(u.fullName ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                        <div className="text-muted text-xs">{u.phoneNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      u.userType === "ADMIN"    ? "badge--danger"  :
                      u.userType === "MECHANIC" ? "badge--info"    : "badge--success"
                    }`}>
                      {u.userType === "ADMIN" ? "Quản trị viên" : u.userType === "MECHANIC" ? "Thợ sửa xe" : "Khách hàng"}
                    </span>
                    {u.userType === "MECHANIC" && (
                      <Eye size={12} style={{ marginLeft: "6px", color: "var(--text-light)", verticalAlign: "middle" }} aria-hidden="true" />
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge--success" : "badge--danger"}`}>
                      {u.isActive ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isLocked ? "badge--danger" : "badge--success"}`}>
                      {u.isLocked ? "Đã khóa" : "Hoạt động"}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`btn btn--sm ${u.isLocked ? "btn--success" : "btn--danger"}`}
                        onClick={async () => {
                          await updateUserFlags(u.userId, { isLocked: !u.isLocked });
                          await usersQuery.refetch();
                        }}
                        aria-label={u.isLocked ? `Mở khóa tài khoản ${u.fullName}` : `Khóa tài khoản ${u.fullName}`}
                      >
                        {u.isLocked ? "Mở khóa" : "Khóa"}
                      </button>
                      <button
                        className="btn btn--sm"
                        onClick={async () => {
                          await updateUserFlags(u.userId, { isActive: !u.isActive });
                          await usersQuery.refetch();
                        }}
                        aria-label={u.isActive ? `Tạm ngưng ${u.fullName}` : `Kích hoạt ${u.fullName}`}
                      >
                        {u.isActive ? "Tạm ngưng" : "Kích hoạt"}
                      </button>
                      <button
                        className="btn btn--sm btn--danger"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={async () => {
                          const isConfirmed = window.confirm(
                            `CẢNH BÁO NGUY HIỂM:\nBạn đang thực hiện xóa vĩnh viễn (xóa cứng) tài khoản "${u.fullName}" (${u.phoneNumber}).\n\nHành động này sẽ xóa hoàn toàn tài khoản này cùng toàn bộ các dữ liệu liên quan (ví tiền, xe cộ, đơn cứu hộ, lịch sử giao dịch...) ra khỏi cơ sở dữ liệu và KHÔNG THỂ HOÀN TÁC.\n\nBạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không?`
                          );
                          if (isConfirmed) {
                            try {
                              await hardDeleteUser(u.userId);
                              await usersQuery.refetch();
                            } catch (err: any) {
                              const serverError = err?.response?.data?.error || err?.message || "Xóa vĩnh viễn tài khoản thất bại.";
                              alert(serverError);
                            }
                          }
                        }}
                        aria-label={`Xóa vĩnh viễn tài khoản ${u.fullName}`}
                      >
                        <Trash2 size={12} />
                        Xóa cứng
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersQuery.data.items.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state__icon"><Users size={32} /></div>
                      <h3>Không có người dùng nào</h3>
                      <p>Thử thay đổi bộ lọc hoặc tạo tài khoản mới.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span>Tổng cộng <strong className="tabular-nums">{total}</strong> người dùng · Đang xem <strong>{from}–{to}</strong></span>
            <div className="pagination__controls">
              <button className="btn btn--sm" disabled={page <= 1 || usersQuery.isFetching} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước">
                <ChevronLeft size={14} /> Trước
              </button>
              <span style={{ padding: "0 10px", fontWeight: 600, fontSize: "13px" }}>Trang {page}</span>
              <button className="btn btn--sm" disabled={page * 20 >= total || usersQuery.isFetching} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox Image Preview */}
      {previewImage && (
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <button
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "36px", cursor: "pointer" }}
            onClick={() => setPreviewImage(null)}
            aria-label="Đóng ảnh phóng to"
          >
            &times;
          </button>
          <img className="lightbox-content" src={previewImage} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Tạo tài khoản mới"
        size="sm"
        footer={
          <div className="flex-gap">
            <button className="btn" onClick={() => setShowCreateForm(false)}>Hủy</button>
            <button className="btn btn--primary" form="create-user-form" type="submit" disabled={creating}>
              {creating ? "Đang xử lý..." : "Xác nhận tạo"}
            </button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={onCreate} style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label htmlFor="cu-phone">Số điện thoại</label>
            <input id="cu-phone" className="input" placeholder="098xxxxxxx" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cu-name">Họ và tên</label>
            <input id="cu-name" className="input" placeholder="Nguyễn Văn A" value={createName} onChange={(e) => setCreateName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cu-password">Mật khẩu đăng nhập</label>
            <input id="cu-password" className="input" type="password" placeholder="Nhập mật khẩu" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cu-type">Vai trò hệ thống</label>
            <select id="cu-type" className="select" value={createType} onChange={(e) => setCreateType(e.target.value as any)}>
              <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
              <option value="MECHANIC">Thợ sửa xe (MECHANIC)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
          {createType === "MECHANIC" && (
            <div style={{ display: "grid", gap: "12px", background: "var(--neutral-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div className="text-xs text-muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>Thông tin thợ cứu hộ</div>
              <div className="form-group">
                <label htmlFor="cu-cccd">Số CCCD</label>
                <input id="cu-cccd" className="input" placeholder="Nhập số căn cước" value={createIdentityCard} onChange={(e) => setCreateIdentityCard(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="cu-plate">Biển số xe</label>
                <input id="cu-plate" className="input" placeholder="Ví dụ: 29A-12345" value={createLicensePlate} onChange={(e) => setCreateLicensePlate(e.target.value)} />
              </div>
            </div>
          )}
          {createError && (
            <div style={{ color: "var(--danger)", background: "var(--danger-bg)", padding: "10px 12px", borderRadius: "var(--radius-md)", fontSize: "12px", border: "1px solid var(--danger)" }}>
              <strong>Lỗi:</strong> {createError}
            </div>
          )}
        </form>
      </Modal>

      {/* Mechanic Detail Modal */}
      <Modal
        isOpen={!!selectedMechanic}
        onClose={() => setSelectedMechanic(null)}
        title="Hồ sơ & Tài liệu của Thợ cứu hộ"
        size="lg"
        footer={
          <div className="flex-gap">
            <button className="btn" onClick={() => setSelectedMechanic(null)}>Đóng</button>
            {mechanicDetail && mechanicDetail.mechanic && (
              mechanicDetail.mechanic.isVerified ? (
                <button className="btn btn--danger" onClick={() => handleVerify(false)} disabled={verifying}>
                  {verifying ? "Đang xử lý..." : "Hủy duyệt hồ sơ"}
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => handleVerify(true)} disabled={verifying}>
                  {verifying ? "Đang xử lý..." : "Duyệt hồ sơ thợ"}
                </button>
              )
            )}
          </div>
        }
      >
        {selectedMechanic && (
          <>
            {loadingDetail ? (
              <div style={{ display: "grid", gap: "12px" }}>
                <span className="skeleton" style={{ height: "80px", borderRadius: "var(--radius-md)" }} />
                <div className="grid-2">
                  <span className="skeleton" style={{ height: "160px" }} />
                  <span className="skeleton" style={{ height: "160px" }} />
                </div>
              </div>
            ) : mechanicDetail ? (
              <div style={{ display: "grid", gap: "20px" }}>
                {/* General Info */}
                <div style={{ display: "flex", gap: "16px", background: "var(--neutral-bg)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", alignItems: "center" }}>
                  <div style={{ width: "68px", height: "68px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--primary)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {mechanicDetail.avatarUrl ? (
                      <img src={mechanicDetail.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "22px", fontWeight: "bold", color: "var(--primary)" }}>
                        {mechanicDetail.fullName ? mechanicDetail.fullName.charAt(0).toUpperCase() : "M"}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex-gap" style={{ flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--secondary)" }}>{mechanicDetail.fullName}</span>
                      <span className={`badge ${mechanicDetail.mechanic?.isVerified ? "badge--success" : "badge--warning"}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {mechanicDetail.mechanic?.isVerified ? <><CheckCircle2 size={10} /> ĐÃ XÁC MINH</> : <><AlertCircle size={10} /> CHỜ XÁC MINH</>}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px", fontSize: "13px", color: "var(--text-muted)" }}>
                      <div>SĐT: <strong>{mechanicDetail.phoneNumber}</strong></div>
                      <div>Email: <strong>{mechanicDetail.email || "(Không có)"}</strong></div>
                      <div>Ngày sinh: <strong>{mechanicDetail.dateOfBirth || "(Chưa nhập)"}</strong></div>
                      <div>Giới tính: <strong>{mechanicDetail.gender || "(Chưa nhập)"}</strong></div>
                    </div>
                    <div className="text-sm text-muted mt-4">Địa chỉ: <strong>{mechanicDetail.currentAddress || "(Chưa nhập)"}</strong></div>
                  </div>
                </div>

                {/* CCCD Section */}
                <div>
                  <div className="section-header">
                    <div>
                      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "3px", height: "14px", background: "var(--primary)", borderRadius: "2px" }} />
                        Căn cước công dân (CCCD)
                      </h2>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ fontSize: "13px", background: "var(--card-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      Số CCCD: <strong style={{ fontSize: "14px" }}>{mechanicDetail.mechanic?.identityCard || "(Chưa cập nhật)"}</strong>
                    </div>
                    <div className="grid-2">
                      {[
                        { label: "Ảnh mặt trước", url: mechanicDetail.mechanic?.cccdFrontUrl },
                        { label: "Ảnh mặt sau",   url: mechanicDetail.mechanic?.cccdBackUrl }
                      ].map(({ label, url }) => (
                        <div key={label}>
                          <div className="text-xs text-muted mb-4">{label}:</div>
                          {url ? (
                            <div onClick={() => setPreviewImage(url)} style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "150px", background: "#f5f5f5", position: "relative" }} className="doc-thumbnail">
                              <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
                                <Eye size={14} /> Click để phóng to
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "12px" }}>
                              Chưa tải ảnh
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vehicle Section */}
                <div>
                  <div className="section-header">
                    <div>
                      <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "3px", height: "14px", background: "var(--primary)", borderRadius: "2px" }} />
                        Phương tiện & Giấy tờ lái xe
                      </h2>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--card-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div>
                        <div className="text-xs text-muted">Phương tiện:</div>
                        <div className="font-semi">{mechanicDetail.mechanic?.vehicleModel ? `${mechanicDetail.mechanic.vehicleModel} ${mechanicDetail.mechanic.vehicleGeneration ? `(${mechanicDetail.mechanic.vehicleGeneration})` : ""}` : "(Chưa cập nhật)"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Biển số xe:</div>
                        <div className="font-semi">{mechanicDetail.mechanic?.licensePlate || "(Chưa cập nhật)"}</div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div className="text-xs text-muted">Số GPLX:</div>
                        <div className="font-semi">{mechanicDetail.mechanic?.driverLicenseNumber || "(Chưa cập nhật)"}</div>
                      </div>
                    </div>
                    <div className="grid-3">
                      {[
                        { label: "Đăng ký xe (Cà vẹt)", url: mechanicDetail.mechanic?.vehicleRegistrationUrl, alt: "Cà vẹt xe" },
                        { label: "Bằng lái xe (GPLX)",  url: mechanicDetail.mechanic?.driverLicenseUrl,        alt: "Bằng lái xe" },
                        { label: "Bảo hiểm xe",          url: mechanicDetail.mechanic?.vehicleInsuranceUrl,     alt: "Bảo hiểm xe" }
                      ].map(({ label, url, alt }) => (
                        <div key={label}>
                          <div className="text-xs text-muted mb-4">{label}:</div>
                          {url ? (
                            <div onClick={() => setPreviewImage(url)} style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "100px", background: "#f5f5f5", position: "relative" }} className="doc-thumbnail">
                              <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                                <Eye size={12} /> Xem
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center" }}>
                              Chưa tải
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bank & Certificate */}
                <div className="grid-2">
                  <div>
                    <div className="section-header">
                      <div>
                        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ display: "inline-block", width: "3px", height: "14px", background: "var(--primary)", borderRadius: "2px" }} />
                          Tài khoản ngân hàng
                        </h2>
                      </div>
                    </div>
                    {mechanicDetail.wallet ? (
                      <div className="card" style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
                        <div>Số dư ví: <strong>{mechanicDetail.wallet.balance?.toLocaleString("vi-VN") ?? 0} đ</strong></div>
                        <div>Nhập sai mã PIN: <strong>{mechanicDetail.wallet.failedPinAttempts ?? 0} / 5</strong></div>
                        <div>Ngân hàng: <strong>{mechanicDetail.wallet.bankName || "(Chưa nhập)"}</strong></div>
                        <div>Số TK: <strong className="tabular-nums">{mechanicDetail.wallet.accountNumber || "(Chưa nhập)"}</strong></div>
                        <div>Chủ TK: <strong>{mechanicDetail.wallet.accountHolderName || "(Chưa nhập)"}</strong></div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                          <div>
                            Ví: <span className={`badge ${mechanicDetail.wallet.status === "ACTIVE" ? "badge--success" : "badge--danger"}`}>
                              {mechanicDetail.wallet.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </div>
                          <button
                            className={`btn btn--sm ${mechanicDetail.wallet.status === "ACTIVE" ? "btn--danger" : "btn--success"}`}
                            onClick={async () => {
                              try {
                                const newStatus = mechanicDetail.wallet.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
                                await updateWalletStatus(mechanicDetail.userId, { status: newStatus });
                                await refetchDetail();
                              } catch (err: any) {
                                alert(err.message || "Không thể cập nhật trạng thái ví");
                              }
                            }}
                          >
                            {mechanicDetail.wallet.status === "ACTIVE" ? "Khóa ví" : "Mở khóa ví"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        Chưa tạo ví thanh toán
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="section-header">
                      <div>
                        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ display: "inline-block", width: "3px", height: "14px", background: "var(--primary)", borderRadius: "2px" }} />
                          Chứng chỉ hành nghề
                        </h2>
                      </div>
                    </div>
                    {mechanicDetail.mechanic?.certificateUrl ? (
                      <div onClick={() => setPreviewImage(mechanicDetail.mechanic.certificateUrl)} style={{ cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "100px", background: "#f5f5f5", position: "relative" }} className="doc-thumbnail">
                        <img src={mechanicDetail.mechanic.certificateUrl} alt="Chứng chỉ" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                          <Eye size={12} /> Xem chứng chỉ
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        Không có chứng chỉ nghề
                      </div>
                    )}
                  </div>
                </div>

                {verifyError && (
                  <div style={{ color: "var(--danger)", background: "var(--danger-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "12px", border: "1px solid var(--danger)" }}>
                    <strong>Lỗi cập nhật:</strong> {verifyError}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: "var(--danger)", textAlign: "center", padding: "32px" }}>
                Không thể tải hồ sơ chi tiết của thợ.
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
