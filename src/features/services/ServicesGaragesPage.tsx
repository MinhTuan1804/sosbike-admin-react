import { useEffect, useState } from "react";
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
      alert("T├¬n dß╗ïch vß╗Ñ kh├┤ng ─æ╞░ß╗úc trß╗æng");
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
      alert(err instanceof Error ? err.message : "Thao t├íc lß╗ùi.");
    }
  }

  async function onDeleteService(serviceId: number) {
    triggerConfirm("Bß║ín c├│ thß╗▒c sß╗▒ muß╗æn x├│a mß╗üm dß╗ïch vß╗Ñ n├áy kh├┤ng?", async () => {
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
      alert("Vui l├▓ng nhß║¡p t├¬n v├á ─æß╗ïa chß╗ë cß╗ºa garage.");
      return;
    }
    if (!garageForm.mechanicId) {
      alert("Vui l├▓ng chß╗ìn thß╗ú quß║ún l├╜ garage.");
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
      alert(err instanceof Error ? err.message : "Thao t├íc lß╗ùi.");
    }
  }

  async function onDeleteGarage(garageId: number) {
    triggerConfirm("Bß║ín c├│ thß╗▒c sß╗▒ muß╗æn x├│a mß╗üm garage n├áy kh├┤ng?", async () => {
      await deleteGarage(garageId);
      await refreshGarages();
    });
  }

  async function onApproveMechanicService(item: MechanicServiceListItem) {
    try {
      await approveMechanicService(item.mechanicServiceId);
      await refreshMechanicServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Duyß╗çt thß║Ñt bß║íi.");
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
      alert(err instanceof Error ? err.message : "Tß╗½ chß╗æi thß║Ñt bß║íi.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Modern Tabs switch */}
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
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("services")}
        >
          ≡ƒöº Quß║ún l├╜ dß╗ïch vß╗Ñ cß╗⌐u hß╗Ö
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
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("garages")}
        >
          ≡ƒÅ¬ Danh s├ích Garage ─æß╗æi t├íc
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
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("mechanic-services")}
        >
          Γ£à Duyß╗çt dß╗ïch vß╗Ñ thß╗ú
        </button>
      </div>

      {/* Services Tab Workspace */}
      {tab === "services" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="flex-between">
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Danh mß╗Ñc dß╗ïch vß╗Ñ cß╗⌐u hß╗Ö</h2>
            <button className="btn btn--primary btn--sm" onClick={openCreateServiceModal}>+ Th├¬m dß╗ïch vß╗Ñ</button>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="T├¼m theo t├¬n dß╗ïch vß╗Ñ..."
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshServices} disabled={servicesLoading}>
              {servicesLoading ? "..." : "Tß║úi lß║íi"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>M├ú ID</th>
                  <th>T├¬n dß╗ïch vß╗Ñ</th>
                  <th>Tiß╗ün c├┤ng ─æß╗ü xuß║Ñt</th>
                  <th>M├┤ tß║ú chi tiß║┐t</th>
                  <th>Trß║íng th├íi hoß║ít ─æß╗Öng</th>
                  <th>Thao t├íc</th>
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
                        {s.isDeleted ? "Tß║ím ng╞░ng" : "─Éang hoß║ít ─æß╗Öng"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn--sm" onClick={() => openEditServiceModal(s)}>Sß╗¡a</button>
                        <button className="btn btn--sm btn--danger" onClick={() => onDeleteService(s.serviceId)}>X├│a</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Garages Tab Workspace */}
      {tab === "garages" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="flex-between">
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Th├┤ng tin c├íc Garage th├ánh vi├¬n</h2>
            <button className="btn btn--primary btn--sm" onClick={openCreateGarageModal}>+ ─É─âng k├╜ Garage</button>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="T├¼m theo t├¬n garage, ─æß╗ïa chß╗ë hoß║╖c thß╗ú ─æß║íi diß╗çn..."
              value={garageQuery}
              onChange={(e) => setGarageQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshGarages} disabled={garagesLoading}>
              {garagesLoading ? "..." : "Tß║úi lß║íi"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>M├ú ID</th>
                  <th>T├¬n Garage</th>
                  <th>─Éß╗ïa chß╗ë li├¬n hß╗ç</th>
                  <th>Thß╗ú ─æß║íi diß╗çn (Sß╗æ ─æiß╗çn thoß║íi)</th>
                  <th>Trß║íng th├íi</th>
                  <th>Thao t├íc</th>
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
                        {g.isDeleted ? "Tß║ím ng╞░ng" : "─Éang mß╗ƒ cß╗¡a"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn--sm" onClick={() => openEditGarageModal(g)}>Sß╗¡a</button>
                        <button className="btn btn--sm btn--danger" onClick={() => onDeleteGarage(g.garageId)}>X├│a</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "mechanic-services" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="flex-between">
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Duyß╗çt dß╗ïch vß╗Ñ thß╗ú ─æ─âng k├╜</h2>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <select
              className="input"
              style={{ minWidth: "160px" }}
              value={mechanicServiceStatus}
              onChange={(e) => setMechanicServiceStatus(e.target.value)}
            >
              <option value="PENDING">Chß╗¥ duyß╗çt</option>
              <option value="APPROVED">─É├ú duyß╗çt</option>
              <option value="REJECTED">Tß╗½ chß╗æi</option>
              <option value="">Tß║Ñt cß║ú</option>
            </select>
            <input
              className="input"
              style={{ flex: 1, minWidth: "200px" }}
              placeholder="T├¼m theo t├¬n dß╗ïch vß╗Ñ, thß╗ú, S─ÉT..."
              value={mechanicServiceQuery}
              onChange={(e) => setMechanicServiceQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshMechanicServices} disabled={mechanicServicesLoading}>
              {mechanicServicesLoading ? "..." : "Tß║úi lß║íi"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thß╗ú</th>
                  <th>T├¬n dß╗ïch vß╗Ñ</th>
                  <th>Ph├¡ c├┤ng</th>
                  <th>M├┤ tß║ú</th>
                  <th>Trß║íng th├íi</th>
                  <th>Gß╗¡i l├║c</th>
                  <th>Thao t├íc</th>
                </tr>
              </thead>
              <tbody>
                {mechanicServices.map((s) => (
                  <tr key={s.mechanicServiceId}>
                    <td><code>{s.mechanicServiceId}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.mechanicName || "ΓÇö"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.mechanicPhone}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.serviceName}</td>
                    <td style={{ fontWeight: 700, color: "var(--secondary)" }}>{formatMoney(s.laborFee)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "220px" }}>{s.description ?? "-"}</td>
                    <td>
                      <span className={`badge ${
                        s.status === "APPROVED" ? "badge--success" : s.status === "REJECTED" ? "badge--danger" : "badge--warning"
                      }`}>
                        {s.status === "PENDING" ? "Chß╗¥ duyß╗çt" : s.status === "APPROVED" ? "─É├ú duyß╗çt" : "Tß╗½ chß╗æi"}
                      </span>
                      {s.rejectionReason && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{s.rejectionReason}</div>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {s.requestedAt ? new Date(s.requestedAt).toLocaleString("vi-VN") : "ΓÇö"}
                    </td>
                    <td>
                      {s.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button className="btn btn--sm btn--primary" onClick={() => onApproveMechanicService(s)}>Duyß╗çt</button>
                          <button className="btn btn--sm btn--danger" onClick={() => openRejectMechanicService(s)}>Tß╗½ chß╗æi</button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>ΓÇö</span>
                      )}
                    </td>
                  </tr>
                ))}
                {mechanicServices.length === 0 && !mechanicServicesLoading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      Kh├┤ng c├│ dß╗ïch vß╗Ñ n├áo.
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
        title={editingService ? "Cß║¡p nhß║¡t dß╗ïch vß╗Ñ cß╗⌐u hß╗Ö" : "Tß║ío dß╗ïch vß╗Ñ cß╗⌐u hß╗Ö mß╗¢i"}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setServiceModalOpen(false)}>Hß╗ºy</button>
            <button className="btn btn--primary" onClick={saveServiceSubmit}>L╞░u th├┤ng tin</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>T├¬n gß╗ìi dß╗ïch vß╗Ñ cß╗⌐u hß╗Ö</label>
            <input
              className="input"
              value={serviceForm.serviceName}
              onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
              placeholder="V├¡ dß╗Ñ: Cß╗⌐u hß╗Ö x─âm lß╗æp, V├í s─âm xe sß╗æ, Sß╗¡a phanh ─æ─⌐a..."
            />
          </div>

          <div className="form-group">
            <label>Tiß╗ün c├┤ng ─æß╗ü xuß║Ñt (Suggested Labor Fee - VND)</label>
            <input
              className="input"
              type="number"
              value={serviceForm.suggestedLaborFee}
              onChange={(e) => setServiceForm({ ...serviceForm, suggestedLaborFee: Number(e.target.value) })}
              placeholder="V├¡ dß╗Ñ: 80000"
            />
          </div>

          <div className="form-group">
            <label>M├┤ tß║ú dß╗ïch vß╗Ñ</label>
            <textarea
              className="textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="M├┤ tß║ú kß╗╣ thuß║¡t hoß║╖c quy chuß║⌐n thß╗▒c hiß╗çn..."
            />
          </div>

          {editingService && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={serviceForm.isDeleted}
                onChange={(e) => setServiceForm({ ...serviceForm, isDeleted: e.target.checked })}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--danger)" }}>Ngß╗½ng cung cß║Ñp dß╗ïch vß╗Ñ n├áy</span>
            </label>
          )}
        </div>
      </Modal>

      {/* 2. Garage Modal Form */}
      <Modal
        isOpen={garageModalOpen}
        onClose={() => setGarageModalOpen(false)}
        title={editingGarage ? "Cß║¡p nhß║¡t th├┤ng tin Garage" : "─É─âng k├╜ th├ánh lß║¡p Garage mß╗¢i"}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setGarageModalOpen(false)}>Hß╗ºy</button>
            <button className="btn btn--primary" onClick={saveGarageSubmit}>L╞░u th├┤ng tin</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          
          <div className="form-group">
            <label>T├¬n gß╗ìi Garage</label>
            <input
              className="input"
              value={garageForm.garageName}
              onChange={(e) => setGarageForm({ ...garageForm, garageName: e.target.value })}
              placeholder="V├¡ dß╗Ñ: Sß╗¡a Xe M├íy Th├ánh C├┤ng, Garage SOS H├á Nß╗Öi..."
            />
          </div>

          <div className="form-group">
            <label>─Éß╗ïa chß╗ë hoß║ít ─æß╗Öng</label>
            <input
              className="input"
              value={garageForm.address}
              onChange={(e) => setGarageForm({ ...garageForm, address: e.target.value })}
              placeholder="V├¡ dß╗Ñ: Sß╗æ 230 Cß║ºu Giß║Ñy, Quß║¡n Cß║ºu Giß║Ñy, H├á Nß╗Öi"
            />
          </div>

          {!editingGarage ? (
            <div className="form-group">
              <label>Thß╗ú chß╗ïu tr├ích nhiß╗çm quß║ún l├╜ (─Éß║íi diß╗çn)</label>
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
                  <option value="">Kh├┤ng c├│ thß╗ú n├áo sß║╡n s├áng (Vui l├▓ng bß║Ñm Tß║úi thß╗ú)</option>
                )}
              </select>
            </div>
          ) : (
            <div style={{ background: "var(--neutral-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Thß╗ú ─æß║íi diß╗çn cß╗æ ─æß╗ïnh (Kh├┤ng thß╗â ─æß╗òi online):</div>
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
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--danger)" }}>Tß║ím ng╞░ng hoß║ít ─æß╗Öng cß╗¡a h├áng</span>
            </label>
          )}
        </div>
      </Modal>

      {/* 3. Global Confirmation Dialog */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="X├íc nhß║¡n thao t├íc"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>Hß╗ºy</button>
            <button
              className="btn btn--danger"
              onClick={() => {
                if (confirmAction) confirmAction.onConfirm();
                setConfirmModalOpen(false);
              }}
            >
              ─Éß╗ông ├╜ x├│a
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "28px" }}>ΓÜá∩╕Å</span>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
            {confirmAction?.message}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tß╗½ chß╗æi dß╗ïch vß╗Ñ thß╗ú"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setRejectModalOpen(false)}>Hß╗ºy</button>
            <button className="btn btn--danger" onClick={submitRejectMechanicService}>X├íc nhß║¡n tß╗½ chß╗æi</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Tß╗½ chß╗æi dß╗ïch vß╗Ñ <strong>{rejectTarget?.serviceName}</strong> cß╗ºa thß╗ú {rejectTarget?.mechanicName}?
          </p>
          <div className="form-group">
            <label>L├╜ do (t├╣y chß╗ìn)</label>
            <textarea
              className="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="V├¡ dß╗Ñ: Tr├╣ng dß╗ïch vß╗Ñ hß╗ç thß╗æng, m├┤ tß║ú kh├┤ng r├╡..."
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
