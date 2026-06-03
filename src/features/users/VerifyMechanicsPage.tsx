import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listUsers, getUser, verifyMechanic } from "./usersApi";
import { Modal } from "../../shared/components/Modal";

export function VerifyMechanicsPage() {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("pending");

  // Mechanic Detail state
  const [selectedMechanic, setSelectedMechanic] = useState<any | null>(null);

  // Fetch all mechanics
  const queryKey = useMemo(() => ["admin-mechanics", { q }], [q]);
  const mechanicsQuery = useQuery({
    queryKey,
    queryFn: () => listUsers({ q: q || undefined, userType: "MECHANIC", page: 1, pageSize: 100 })
  });

  // Detailed Mechanic data from GET
  const { data: mechanicDetail, isFetching: loadingDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["admin-mechanic-detail", selectedMechanic?.userId],
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
      await mechanicsQuery.refetch();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Cập nhật trạng thái duyệt thất bại");
    } finally {
      setVerifying(false);
    }
  }

  // Client-side filtering
  const filteredMechanics = useMemo(() => {
    if (!mechanicsQuery.data) return [];
    return mechanicsQuery.data.items.filter((m) => {
      if (filterStatus === "pending") {
        return m.isVerified !== true;
      }
      if (filterStatus === "approved") {
        return m.isVerified === true;
      }
      return true;
    });
  }, [mechanicsQuery.data, filterStatus]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>
          Duyệt hồ sơ thợ cứu hộ
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
          Xem xét tài liệu xác thực (CCCD, GPLX, Cà vẹt xe, bảo hiểm) và phê duyệt quyền hoạt động của thợ.
        </p>
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

      {/* Filter and search bar */}
      <div style={{ display: "flex", gap: "12px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Tìm thợ theo tên, số điện thoại..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        
        <div style={{ display: "flex", background: "var(--neutral-bg)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <button 
            className={`btn btn--sm ${filterStatus === "pending" ? "btn--primary" : ""}`}
            style={{ background: filterStatus === "pending" ? "" : "transparent", border: "none", color: filterStatus === "pending" ? "" : "var(--secondary)", minWidth: "100px" }}
            onClick={() => setFilterStatus("pending")}
          >
            Chờ duyệt ({mechanicsQuery.data?.items.filter(m => m.isVerified !== true).length ?? 0})
          </button>
          <button 
            className={`btn btn--sm ${filterStatus === "approved" ? "btn--primary" : ""}`}
            style={{ background: filterStatus === "approved" ? "" : "transparent", border: "none", color: filterStatus === "approved" ? "" : "var(--secondary)", minWidth: "100px" }}
            onClick={() => setFilterStatus("approved")}
          >
            Đã duyệt ({mechanicsQuery.data?.items.filter(m => m.isVerified === true).length ?? 0})
          </button>
          <button 
            className={`btn btn--sm ${filterStatus === "all" ? "btn--primary" : ""}`}
            style={{ background: filterStatus === "all" ? "" : "transparent", border: "none", color: filterStatus === "all" ? "" : "var(--secondary)", minWidth: "80px" }}
            onClick={() => setFilterStatus("all")}
          >
            Tất cả thợ
          </button>
        </div>

        <button className="btn" onClick={() => mechanicsQuery.refetch()} disabled={mechanicsQuery.isFetching}>
          {mechanicsQuery.isFetching ? "..." : "Tải lại"}
        </button>
      </div>

      {/* Main Table */}
      {mechanicsQuery.isError ? (
        <div className="card" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "var(--danger-bg)" }}>
          <strong>Lỗi:</strong> {String(mechanicsQuery.error)}
        </div>
      ) : mechanicsQuery.data ? (
        <div className="table-container" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên & Số điện thoại</th>
                <th>Tài khoản</th>
                <th>Trạng thái hồ sơ</th>
                <th>Ngày tạo tài khoản</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredMechanics.map((m) => (
                <tr
                  key={m.userId}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedMechanic(m)}
                  title="Bấm vào để xem và duyệt tài liệu thợ"
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.fullName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{m.phoneNumber}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className={`badge ${m.isActive ? "badge--success" : "badge--danger"}`} style={{ fontSize: "9px" }}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={`badge ${m.isLocked ? "badge--danger" : "badge--success"}`} style={{ fontSize: "9px" }}>
                        {m.isLocked ? "Locked" : "Unlocked"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${m.isVerified ? "badge--success" : "badge--warning"}`}>
                      {m.isVerified ? "Đã xác minh" : "Chờ duyệt hồ sơ"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString("vi-VN", { dateStyle: "medium" }) : "---"}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn--sm btn--primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMechanic(m);
                      }}
                    >
                      Duyệt hồ sơ
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMechanics.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Không có thợ sửa xe nào trong bộ lọc này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Đang tải danh sách thợ cứu hộ...
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
                      <span className={`badge ${mechanicDetail.mechanic?.isVerified ? "badge--success" : "badge--warning"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                        {mechanicDetail.mechanic?.isVerified ? "✓ ĐÃ XÁC MINH" : "⚠ CHỜ XÁC MINH"}
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
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
                              🔍 Click để phóng to
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
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
                              🔍 Click để phóng to
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
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              🔍 Xem
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
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              🔍 Xem
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
                            <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                              🔍 Xem
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
                          Trạng thái: <span className={`badge ${mechanicDetail.wallet.isBankVerified ? "badge--success" : "badge--danger"}`} style={{ fontSize: "9px" }}>
                            {mechanicDetail.wallet.isBankVerified ? "Đã liên kết" : "Chưa liên kết"}
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
                        <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "11px" }}>
                          🔍 Xem chứng chỉ
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
