import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, AlertCircle, Eye, ClipboardCheck, Search, RefreshCw, Lock, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listUsers, getUser, verifyMechanic, maskIdentityCard, maskBankAccountNumber } from "./usersApi";
import { Modal } from "../../shared/components/Modal";
import { http } from "../../shared/http";

// Component nạp ảnh bảo mật qua Token JWT của Admin
function SecureDocImage({ 
  mechanicId, 
  docType, 
  fallbackUrl, 
  alt, 
  onPreview 
}: { 
  mechanicId: string; 
  docType: string; 
  fallbackUrl?: string; 
  alt: string; 
  onPreview?: (src: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;
    setLoading(true);

    const docEndpoint = `/documents/mechanic/${mechanicId}/${docType}`;
    http.get(docEndpoint, { responseType: "blob" })
      .then((res) => {
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(res.data);
        setImgSrc(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        if (fallbackUrl) {
          setImgSrc(fallbackUrl);
        } else {
          setError(true);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mechanicId, docType, fallbackUrl]);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "11px" }}>Đang tải bảo mật...</div>;
  }
  if (error || !imgSrc) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--danger)", fontSize: "11px" }}>Không thể tải ảnh</div>;
  }

  return (
    <div 
      onClick={() => onPreview?.(imgSrc)}
      style={{ cursor: "pointer", width: "100%", height: "100%", position: "relative" }}
      className="doc-thumbnail"
    >
      <img src={imgSrc} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <div className="doc-thumbnail-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontSize: "12px" }}>
        <Eye size={14} /> Phóng to
      </div>
    </div>
  );
}

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
      const isApproved = m.isVerified === true || Boolean(m.verifiedAt);
      if (filterStatus === "pending") {
        return !isApproved;
      }
      if (filterStatus === "approved") {
        return isApproved;
      }
      return true;
    });
  }, [mechanicsQuery.data, filterStatus]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <ClipboardCheck size={22} style={{ color: "var(--primary)" }} />
              Duyệt hồ sơ thợ cứu hộ
            </span>
          </h1>
          <p>Xem xét tài liệu xác thực (CCCD, GPLX, cà vẹt xe, bảo hiểm) và phê duyệt quyền hoạt động của thợ.</p>
        </div>
      </div>

      {/* CSS injection for doc thumbnails and lightbox */}
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

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: "260px" }}>
          <span className="input-icon-wrap__icon"><Search size={14} /></span>
          <input
            className="input"
            placeholder="Tìm thợ theo tên, số điện thoại..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            id="mechanics-search"
            aria-label="Tìm kiếm thợ cứu hộ"
          />
        </div>
        
        <div style={{ display: "flex", gap: "4px", background: "var(--neutral-bg)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          {(["pending", "approved", "all"] as const).map((status) => (
            <button
              key={status}
              className={`btn btn--sm ${filterStatus === status ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setFilterStatus(status)}
              aria-pressed={filterStatus === status}
            >
              {status === "pending"  && `Chờ duyệt (${mechanicsQuery.data?.items.filter(m => !(m.isVerified === true || Boolean(m.verifiedAt))).length ?? 0})`}
              {status === "approved" && `Đã duyệt (${mechanicsQuery.data?.items.filter(m => m.isVerified === true || Boolean(m.verifiedAt)).length ?? 0})`}
              {status === "all"      && `Tất cả thợ`}
            </button>
          ))}
        </div>

        <button className="btn" onClick={() => mechanicsQuery.refetch()} disabled={mechanicsQuery.isFetching} aria-label="Tải lại danh sách">
          <RefreshCw size={14} />
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
                    <span className={`badge ${(m.isVerified === true || Boolean(m.verifiedAt)) ? "badge--success" : "badge--warning"}`}>
                      {(m.isVerified === true || Boolean(m.verifiedAt)) ? "Đã xác minh" : "Chờ duyệt hồ sơ"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {m.createdAt ? (() => {
                        let str = m.createdAt.trim();
                        if (!str.endsWith("Z") && !str.includes("+") && str.includes("T")) {
                          str += "Z";
                        }
                        return new Date(str).toLocaleDateString("vi-VN", { dateStyle: "medium" });
                      })() : "---"}
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
                  <div style={{ flex: "1 1 360px", minWidth: "260px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--secondary)" }}>{mechanicDetail.fullName}</span>
                      <span className={`badge ${mechanicDetail.mechanic?.isVerified ? "badge--success" : "badge--warning"}`} style={{ fontSize: "10px", padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {mechanicDetail.mechanic?.isVerified ? (
                          <>
                            <CheckCircle2 size={10} />
                            <span>Đã xác minh</span>
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
                      Số CCCD: <strong style={{ fontSize: "14px" }}>{maskIdentityCard(mechanicDetail.mechanic?.identityCard)}</strong>
                    </div>
                    {(() => {
                      const isVerified = mechanicDetail.mechanic?.isVerified === true || Boolean(mechanicDetail.verifiedAt);
                      if (isVerified) {
                        return (
                          <div style={{ padding: "16px", background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--secondary)", fontWeight: "600", fontSize: "13px" }}>
                              <Lock size={15} style={{ color: "var(--primary)" }} />
                              <span>Thông tin cá nhân nhạy cảm đã được bảo mật (Nghị định 13/2023/NĐ-CP)</span>
                            </div>
                            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                              Hồ sơ thợ đã xác minh thành công. Ảnh CCCD và giấy tờ cá nhân được khóa bảo vệ quyền riêng tư.
                            </p>
                          </div>
                        );
                      }

                      const cccdDocs = [
                        { label: "Ảnh mặt trước", docType: "cccd-front", url: mechanicDetail.mechanic?.cccdFrontUrl },
                        { label: "Ảnh mặt sau",   docType: "cccd-back",  url: mechanicDetail.mechanic?.cccdBackUrl }
                      ].filter(item => Boolean(item.url));

                      if (cccdDocs.length === 0) {
                        return (
                          <div style={{ padding: "10px 14px", background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                            Chưa cập nhật ảnh CCCD (Mặt trước & Mặt sau)
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cccdDocs.length}, 1fr)`, gap: "16px" }}>
                          {cccdDocs.map(({ label, docType, url }) => (
                            <div key={label}>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}:</div>
                              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "160px", background: "#f5f5f5" }}>
                                <SecureDocImage
                                  mechanicId={mechanicDetail.userId}
                                  docType={docType}
                                  fallbackUrl={url!}
                                  alt={label}
                                  onPreview={(src) => setPreviewImage(src)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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

                    {(() => {
                      const isVerified = mechanicDetail.mechanic?.isVerified === true || Boolean(mechanicDetail.verifiedAt);
                      if (isVerified) {
                        return (
                          <div style={{ padding: "14px", background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--secondary)", fontWeight: "600", fontSize: "12px" }}>
                              <ShieldCheck size={15} style={{ color: "#16a34a" }} />
                              <span>Giấy tờ xe & GPLX đã được xác minh thành công</span>
                            </div>
                          </div>
                        );
                      }
                      const vehicleDocs = [
                        { label: "Đăng ký xe (Cà vẹt)", docType: "vehicle-registration", url: mechanicDetail.mechanic?.vehicleRegistrationUrl, alt: "Cà vẹt xe" },
                        { label: "Bằng lái xe (GPLX)",  docType: "driver-license",       url: mechanicDetail.mechanic?.driverLicenseUrl,        alt: "Bằng lái xe" },
                        { label: "Bảo hiểm xe",          docType: "vehicle-insurance",    url: mechanicDetail.mechanic?.vehicleInsuranceUrl,     alt: "Bảo hiểm xe" }
                      ].filter(item => Boolean(item.url));

                      if (vehicleDocs.length === 0) {
                        return (
                          <div style={{ padding: "10px 14px", background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                            Chưa cập nhật ảnh giấy tờ xe (Cà vẹt, GPLX, Bảo hiểm)
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${vehicleDocs.length}, 1fr)`, gap: "12px" }}>
                          {vehicleDocs.map(({ label, docType, url, alt }) => (
                            <div key={label}>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}:</div>
                              <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "110px", background: "#f5f5f5" }}>
                                <SecureDocImage
                                  mechanicId={mechanicDetail.userId}
                                  docType={docType}
                                  fallbackUrl={url!}
                                  alt={alt}
                                  onPreview={(src) => setPreviewImage(src)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
                        <div>Số tài khoản: <strong>{maskBankAccountNumber(mechanicDetail.wallet.accountNumber)}</strong></div>
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
                      <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "92px", background: "#f5f5f5" }}>
                        <SecureDocImage
                          mechanicId={mechanicDetail.userId}
                          docType="certificate"
                          fallbackUrl={mechanicDetail.mechanic.certificateUrl}
                          alt="Chứng chỉ"
                          onPreview={(src) => setPreviewImage(src)}
                        />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "42px", background: "var(--neutral-bg)", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", fontStyle: "italic" }}>
                        (Chưa bổ sung chứng chỉ nghề)
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
