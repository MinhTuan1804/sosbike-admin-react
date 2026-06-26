import { useEffect, useState } from "react";
import { Wrench, Store, CheckSquare, AlertTriangle } from "lucide-react";
import {
  createGarage,
  createService,
  deleteGarage,
  deleteService,
  listGarages,
  listServices,
  updateGarage,
  updateService
} from "./servicesGaragesApi";
import {
  approveMechanicService,
  listMechanicServices,
  rejectMechanicService,
  type MechanicServiceListItem
} from "./mechanicServicesApi";
import { listUsers } from "../users/usersApi";
import { Modal } from "../../shared/components/Modal";

type TabKey = "services" | "garages" | "mechanic-services";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

export function ServicesGaragesPage() {
  const [tab, setTab] = useState<TabKey>("services");

  // Services state
  const [serviceQuery, setServiceQuery] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Garages state
  const [garageQuery, setGarageQuery] = useState("");
  const [garages, setGarages] = useState<any[]>([]);
  const [garagesLoading, setGaragesLoading] = useState(false);
  const [mechanics, setMechanics] = useState<any[]>([]);

  const [mechanicServiceQuery, setMechanicServiceQuery] = useState("");
  const [mechanicServiceStatus, setMechanicServiceStatus] = useState("PENDING");
  const [mechanicServices, setMechanicServices] = useState<MechanicServiceListItem[]>([]);
  const [mechanicServicesLoading, setMechanicServicesLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<MechanicServiceListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modal control states
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    suggestedLaborFee: 0,
    description: "",
    isDeleted: false
  });

  const [garageModalOpen, setGarageModalOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<any | null>(null);
  const [garageForm, setGarageForm] = useState({
    mechanicId: "",
    garageName: "",
    address: "",
    isDeleted: false
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  async function refreshServices() {
    setServicesLoading(true);
    try {
      const data = await listServices({ q: serviceQuery || undefined, includeDeleted: true, page: 1, pageSize: 200 });
      setServices(data.items);
    } finally {
      setServicesLoading(false);
    }
  }

  async function refreshGarages() {
    setGaragesLoading(true);
    try {
      const data = await listGarages({ q: garageQuery || undefined, includeDeleted: true, page: 1, pageSize: 200 });
      setGarages(data.items);
    } finally {
      setGaragesLoading(false);
    }
  }

  async function refreshMechanicServices() {
    setMechanicServicesLoading(true);
    try {
      const data = await listMechanicServices({
        status: mechanicServiceStatus || undefined,
        q: mechanicServiceQuery || undefined,
        page: 1,
        pageSize: 200
      });
      setMechanicServices(data.items);
    } finally {
      setMechanicServicesLoading(false);
    }
  }

  async function refreshMechanics() {
    try {
      const data = await listUsers({ userType: "MECHANIC", page: 1, pageSize: 250 });
      setMechanics(data.items);
    } catch (err) {
      console.error("Failed to load mechanics list", err);
    }
  }

  useEffect(() => {
    refreshServices();
    refreshGarages();
    refreshMechanics();
    refreshMechanicServices();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "mechanic-services") setTab("mechanic-services");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "mechanic-services") refreshMechanicServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mechanicServiceStatus]);

  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmModalOpen(true);
  }

  // Service form actions
  function openCreateServiceModal() {
    setEditingService(null);
    setServiceForm({ serviceName: "", suggestedLaborFee: 0, description: "", isDeleted: false });
    setServiceModalOpen(true);
  }

  function openEditServiceModal(s: any) {
    setEditingService(s);
    setServiceForm({
      serviceName: s.serviceName,
      suggestedLaborFee: s.suggestedLaborFee,
      description: s.description ?? "",
      isDeleted: s.isDeleted
    });
    setServiceModalOpen(true);
  }

  async function saveServiceSubmit() {
    if (!serviceForm.serviceName.trim()) {
      alert("Tên dịch vụ không được trống");
      return;
    }
    try {
      if (editingService) {
        await updateService(editingService.serviceId, {
          serviceName: serviceForm.serviceName,
          suggestedLaborFee: Number(serviceForm.suggestedLaborFee),
          description: serviceForm.description,
          isDeleted: serviceForm.isDeleted
        });
      } else {
        await createService({
          serviceName: serviceForm.serviceName,
          suggestedLaborFee: Number(serviceForm.suggestedLaborFee),
          description: serviceForm.description
        });
      }
      setServiceModalOpen(false);
      await refreshServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác lỗi.");
    }
  }

  async function onDeleteService(serviceId: number) {
    triggerConfirm("Bạn có thực sự muốn xóa mềm dịch vụ này không?", async () => {
      await deleteService(serviceId);
      await refreshServices();
    });
  }

  // Garage form actions
  function openCreateGarageModal() {
    setEditingGarage(null);
    setGarageForm({
      mechanicId: mechanics[0]?.userId ?? "",
      garageName: "",
      address: "",
      isDeleted: false
    });
    setGarageModalOpen(true);
  }

  function openEditGarageModal(g: any) {
    setEditingGarage(g);
    setGarageForm({
      mechanicId: g.mechanicId ?? "",
      garageName: g.garageName,
      address: g.address,
      isDeleted: g.isDeleted
    });
    setGarageModalOpen(true);
  }

  async function saveGarageSubmit() {
    if (!garageForm.garageName.trim() || !garageForm.address.trim()) {
      alert("Vui lòng nhập tên và địa chỉ của garage.");
      return;
    }
    if (!garageForm.mechanicId) {
      alert("Vui lòng chọn thợ quản lý garage.");
      return;
    }

    try {
      if (editingGarage) {
        await updateGarage(editingGarage.garageId, {
          garageName: garageForm.garageName,
          address: garageForm.address,
          isDeleted: garageForm.isDeleted
        });
      } else {
        await createGarage({
          mechanicId: garageForm.mechanicId,
          garageName: garageForm.garageName,
          address: garageForm.address
        });
      }
      setGarageModalOpen(false);
      await refreshGarages();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác lỗi.");
    }
  }

  async function onDeleteGarage(garageId: number) {
    triggerConfirm("Bạn có thực sự muốn xóa mềm garage này không?", async () => {
      await deleteGarage(garageId);
      await refreshGarages();
    });
  }

  async function onApproveMechanicService(item: MechanicServiceListItem) {
    try {
      await approveMechanicService(item.mechanicServiceId);
      await refreshMechanicServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Duyệt thất bại.");
    }
  }

  function openRejectMechanicService(item: MechanicServiceListItem) {
    setRejectTarget(item);
    setRejectReason("");
    setRejectModalOpen(true);
  }

  async function submitRejectMechanicService() {
    if (!rejectTarget) return;
    try {
      await rejectMechanicService(rejectTarget.mechanicServiceId, rejectReason || undefined);
      setRejectModalOpen(false);
      setRejectTarget(null);
      await refreshMechanicServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Từ chối thất bại.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>Dịch vụ &amp; Garage</h1>
          <p>Quản lý danh mục dịch vụ cứu hộ, garage đối tác và duyệt dịch vụ do thợ đăng ký.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "8px" }}>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "services" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "services" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "services" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
          onClick={() => setTab("services")}
        >
          <Wrench size={16} /> Quản lý dịch vụ cứu hộ
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "garages" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "garages" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "garages" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
          onClick={() => setTab("garages")}
        >
          <Store size={16} /> Danh sách Garage đối tác
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "mechanic-services" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "mechanic-services" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "mechanic-services" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
          onClick={() => setTab("mechanic-services")}
        >
          <CheckSquare size={16} /> Duyệt dịch vụ thợ
        </button>
      </div>

      {/* Services Tab */}
      {tab === "services" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <div className="flex-between">
              <h2>Danh mục dịch vụ cứu hộ</h2>
              <button className="btn btn--primary btn--sm" onClick={openCreateServiceModal}>+ Thêm dịch vụ</button>
            </div>
          </div>

          <div className="filter-bar">
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Tìm theo tên dịch vụ..."
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshServices} disabled={servicesLoading}>
              {servicesLoading ? "..." : "Tải lại"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã ID</th>
                  <th>Tên dịch vụ</th>
                  <th>Tiền công đề xuất</th>
                  <th>Mô tả chi tiết</th>
                  <th>Trạng thái hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.serviceId}>
                    <td><code>{s.serviceId}</code></td>
                    <td style={{ fontWeight: 600 }}>{s.serviceName}</td>
                    <td style={{ fontWeight: 700, color: "var(--secondary)" }}>{formatMoney(s.suggestedLaborFee)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{s.description ?? "-"}</td>
                    <td>
                      <span className={`badge ${s.isDeleted ? "badge--danger" : "badge--success"}`}>
                        {s.isDeleted ? "Tạm ngưng" : "Đang hoạt động"}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap gap-8">
                        <button className="btn btn--sm" onClick={() => openEditServiceModal(s)}>Sửa</button>
                        <button className="btn btn--sm btn--danger" onClick={() => onDeleteService(s.serviceId)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && !servicesLoading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">Chưa có dịch vụ nào.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Garages Tab */}
      {tab === "garages" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <div className="flex-between">
              <h2>Thông tin các Garage thành viên</h2>
              <button className="btn btn--primary btn--sm" onClick={openCreateGarageModal}>+ Đăng ký Garage</button>
            </div>
          </div>

          <div className="filter-bar">
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Tìm theo tên garage, địa chỉ hoặc thợ đại diện..."
              value={garageQuery}
              onChange={(e) => setGarageQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshGarages} disabled={garagesLoading}>
              {garagesLoading ? "..." : "Tải lại"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã ID</th>
                  <th>Tên Garage</th>
                  <th>Địa chỉ liên hệ</th>
                  <th>Thợ đại diện (Số điện thoại)</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {garages.map((g) => (
                  <tr key={g.garageId}>
                    <td><code>{g.garageId}</code></td>
                    <td style={{ fontWeight: 600 }}>{g.garageName}</td>
                    <td>{g.address}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.mechanicFullName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{g.mechanicPhoneNumber}</div>
                    </td>
                    <td>
                      <span className={`badge ${g.isDeleted ? "badge--danger" : "badge--success"}`}>
                        {g.isDeleted ? "Tạm ngưng" : "Đang mở cửa"}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap gap-8">
                        <button className="btn btn--sm" onClick={() => openEditGarageModal(g)}>Sửa</button>
                        <button className="btn btn--sm btn--danger" onClick={() => onDeleteGarage(g.garageId)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {garages.length === 0 && !garagesLoading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">Chưa có garage nào.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mechanic Services Tab */}
      {tab === "mechanic-services" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="section-header">
            <h2>Duyệt dịch vụ thợ đăng ký</h2>
          </div>

          <div className="filter-bar">
            <select
              className="select"
              style={{ minWidth: "160px" }}
              value={mechanicServiceStatus}
              onChange={(e) => setMechanicServiceStatus(e.target.value)}
            >
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="">Tất cả</option>
            </select>
            <input
              className="input"
              style={{ flex: 1, minWidth: "200px" }}
              placeholder="Tìm theo tên dịch vụ, thợ, SĐT..."
              value={mechanicServiceQuery}
              onChange={(e) => setMechanicServiceQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshMechanicServices} disabled={mechanicServicesLoading}>
              {mechanicServicesLoading ? "..." : "Tải lại"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thợ</th>
                  <th>Tên dịch vụ</th>
                  <th>Phí công</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th>Gửi lúc</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {mechanicServices.map((s) => (
                  <tr key={s.mechanicServiceId}>
                    <td><code>{s.mechanicServiceId}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.mechanicName || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.mechanicPhone}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.serviceName}</td>
                    <td style={{ fontWeight: 700, color: "var(--secondary)" }}>{formatMoney(s.laborFee)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "220px" }}>{s.description ?? "-"}</td>
                    <td>
                      <span className={`badge ${
                        s.status === "APPROVED" ? "badge--success" : s.status === "REJECTED" ? "badge--danger" : "badge--warning"
                      }`}>
                        {s.status === "PENDING" ? "Chờ duyệt" : s.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                      </span>
                      {s.rejectionReason && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{s.rejectionReason}</div>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {s.requestedAt ? new Date(s.requestedAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td>
                      {s.status === "PENDING" ? (
                        <div className="flex-gap gap-8" style={{ flexWrap: "wrap" }}>
                          <button className="btn btn--sm btn--primary" onClick={() => onApproveMechanicService(s)}>Duyệt</button>
                          <button className="btn btn--sm btn--danger" onClick={() => openRejectMechanicService(s)}>Từ chối</button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {mechanicServices.length === 0 && !mechanicServicesLoading && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">Không có dịch vụ nào.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reusable Modals */}

      {/* 1. Service Modal Form */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={editingService ? "Cập nhật dịch vụ cứu hộ" : "Tạo dịch vụ cứu hộ mới"}
        footer={
          <div className="flex-gap gap-8">
            <button className="btn" onClick={() => setServiceModalOpen(false)}>Hủy</button>
            <button className="btn btn--primary" onClick={saveServiceSubmit}>Lưu thông tin</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>Tên gọi dịch vụ cứu hộ</label>
            <input
              className="input"
              value={serviceForm.serviceName}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
              placeholder="Ví dụ: Cứu hộ xăm lốp, Vá săm xe số, Sửa phanh đĩa..."
            />
          </div>

          <div className="form-group">
            <label>Tiền công đề xuất (Suggested Labor Fee - VND)</label>
            <input
              className="input"
              type="number"
              value={serviceForm.suggestedLaborFee}
              onChange={(e) => setServiceForm({ ...serviceForm, suggestedLaborFee: Number(e.target.value) })}
              placeholder="Ví dụ: 80000"
            />
          </div>

          <div className="form-group">
            <label>Mô tả dịch vụ</label>
            <textarea
              className="textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Mô tả kỹ thuật hoặc quy chuẩn thực hiện..."
            />
          </div>

          {editingService && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={serviceForm.isDeleted}
                onChange={(e) => setServiceForm({ ...serviceForm, isDeleted: e.target.checked })}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--danger)" }}>Ngừng cung cấp dịch vụ này</span>
            </label>
          )}
        </div>
      </Modal>

      {/* 2. Garage Modal Form */}
      <Modal
        isOpen={garageModalOpen}
        onClose={() => setGarageModalOpen(false)}
        title={editingGarage ? "Cập nhật thông tin Garage" : "Đăng ký thành lập Garage mới"}
        footer={
          <div className="flex-gap gap-8">
            <button className="btn" onClick={() => setGarageModalOpen(false)}>Hủy</button>
            <button className="btn btn--primary" onClick={saveGarageSubmit}>Lưu thông tin</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>Tên gọi Garage</label>
            <input
              className="input"
              value={garageForm.garageName}
              onChange={(e) => setGarageForm({ ...garageForm, garageName: e.target.value })}
              placeholder="Ví dụ: Sửa Xe Máy Thành Công, Garage SOS Hà Nội..."
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ hoạt động</label>
            <input
              className="input"
              value={garageForm.address}
              onChange={(e) => setGarageForm({ ...garageForm, address: e.target.value })}
              placeholder="Ví dụ: Số 230 Cầu Giấy, Quận Cầu Giấy, Hà Nội"
            />
          </div>

          {!editingGarage ? (
            <div className="form-group">
              <label>Thợ chịu trách nhiệm quản lý (Đại diện)</label>
              <select
                className="select"
                value={garageForm.mechanicId}
                onChange={(e) => setGarageForm({ ...garageForm, mechanicId: e.target.value })}
              >
                {mechanics.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.phoneNumber})
                  </option>
                ))}
                {mechanics.length === 0 && (
                  <option value="">Không có thợ nào sẵn sàng (Vui lòng bấm Tải thợ)</option>
                )}
              </select>
            </div>
          ) : (
            <div style={{ background: "var(--neutral-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Thợ đại diện cố định (Không thể đổi online):</div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                {editingGarage.mechanicFullName} ({editingGarage.mechanicPhoneNumber})
              </div>
            </div>
          )}

          {editingGarage && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={garageForm.isDeleted}
                onChange={(e) => setGarageForm({ ...garageForm, isDeleted: e.target.checked })}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--danger)" }}>Tạm ngưng hoạt động cửa hàng</span>
            </label>
          )}
        </div>
      </Modal>

      {/* 3. Global Confirmation Dialog */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận thao tác"
        footer={
          <div className="flex-gap gap-8">
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>Hủy</button>
            <button
              className="btn btn--danger"
              onClick={() => {
                if (confirmAction) confirmAction.onConfirm();
                setConfirmModalOpen(false);
              }}
            >
              Đồng ý xóa
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <AlertTriangle size={28} style={{ color: "var(--warning)" }} />
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
            {confirmAction?.message}
          </div>
        </div>
      </Modal>

      {/* 4. Reject Mechanic Service Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Từ chối dịch vụ thợ"
        footer={
          <div className="flex-gap gap-8">
            <button className="btn" onClick={() => setRejectModalOpen(false)}>Hủy</button>
            <button className="btn btn--danger" onClick={submitRejectMechanicService}>Xác nhận từ chối</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Từ chối dịch vụ <strong>{rejectTarget?.serviceName}</strong> của thợ {rejectTarget?.mechanicName}?
          </p>
          <div className="form-group">
            <label>Lý do (tùy chọn)</label>
            <textarea
              className="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Trùng dịch vụ hệ thống, mô tả không rõ..."
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
