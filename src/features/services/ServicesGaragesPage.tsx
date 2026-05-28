import { useEffect, useState } from "react";
import { createGarage, createService, deleteGarage, deleteService, listGarages, listServices, updateGarage, updateService } from "./servicesGaragesApi";
import { listUsers } from "../users/usersApi";

type TabKey = "services" | "garages";

export function ServicesGaragesPage() {
  const [tab, setTab] = useState<TabKey>("services");

  // Services
  const [serviceQuery, setServiceQuery] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Garages
  const [garageQuery, setGarageQuery] = useState("");
  const [garages, setGarages] = useState<any[]>([]);
  const [garagesLoading, setGaragesLoading] = useState(false);
  const [mechanics, setMechanics] = useState<any[]>([]);

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

  async function refreshMechanics() {
    // Reuse existing admin users endpoint (userType=MECHANIC).
    const data = await listUsers({ userType: "MECHANIC", page: 1, pageSize: 200 });
    setMechanics(data.items);
  }

  useEffect(() => {
    refreshServices();
    refreshGarages();
    refreshMechanics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateService() {
    const serviceName = window.prompt("Tên dịch vụ (ServiceName)?");
    if (!serviceName) return;
    const fee = Number(window.prompt("SuggestedLaborFee?", "0") || "0");
    const description = window.prompt("Description (tuỳ chọn)", "") ?? "";
    await createService({ serviceName, suggestedLaborFee: fee, description });
    await refreshServices();
  }

  async function onEditService(s: any) {
    const serviceName = window.prompt("ServiceName mới (bỏ trống để giữ)", s.serviceName);
    if (serviceName === null) return;
    const feeStr = window.prompt("SuggestedLaborFee (bỏ trống để giữ)", String(s.suggestedLaborFee));
    if (feeStr === null) return;
    const description = window.prompt("Description (bỏ trống để clear)", s.description ?? "");
    if (description === null) return;
    const isDeletedStr = window.prompt("IsDeleted (true/false) - bỏ trống để giữ", String(s.isDeleted));
    if (isDeletedStr === null) return;

    const payload: any = {};
    if (serviceName.trim().length > 0 && serviceName !== s.serviceName) payload.serviceName = serviceName;
    if (feeStr.trim().length > 0) payload.suggestedLaborFee = Number(feeStr);
    payload.description = description;
    if (isDeletedStr.trim().length > 0) payload.isDeleted = isDeletedStr.trim().toLowerCase() === "true";

    await updateService(s.serviceId, payload);
    await refreshServices();
  }

  async function onDeleteService(serviceId: number) {
    if (!window.confirm("Xóa mềm (soft delete) service này?")) return;
    await deleteService(serviceId);
    await refreshServices();
  }

  async function onCreateGarage() {
    if (mechanics.length === 0) await refreshMechanics();

    const mechanicHint = mechanics
      .slice(0, 20)
      .map((m: any) => `${m.userId} | ${m.phoneNumber} | ${m.fullName}`)
      .join("\n");

    const mechanicId = window.prompt(`MechanicId (GUID) là gì?\nGợi ý (20 dòng đầu):\n${mechanicHint}`);
    if (!mechanicId) return;

    const garageName = window.prompt("Tên garage (GarageName)?");
    if (!garageName) return;
    const address = window.prompt("Địa chỉ (Address)?");
    if (!address) return;

    await createGarage({ mechanicId, garageName, address });
    await refreshGarages();
  }

  async function onEditGarage(g: any) {
    const garageName = window.prompt("GarageName mới (bỏ trống để giữ)", g.garageName);
    if (garageName === null) return;
    const address = window.prompt("Address mới (bỏ trống để giữ)", g.address);
    if (address === null) return;
    const isDeletedStr = window.prompt("IsDeleted (true/false) - bỏ trống để giữ", String(g.isDeleted));
    if (isDeletedStr === null) return;

    const payload: any = {};
    if (garageName.trim().length > 0 && garageName !== g.garageName) payload.garageName = garageName;
    if (address.trim().length > 0 && address !== g.address) payload.address = address;
    if (isDeletedStr.trim().length > 0) payload.isDeleted = isDeletedStr.trim().toLowerCase() === "true";

    await updateGarage(g.garageId, payload);
    await refreshGarages();
  }

  async function onDeleteGarage(garageId: number) {
    if (!window.confirm("Xóa mềm (soft delete) garage này?")) return;
    await deleteGarage(garageId);
    await refreshGarages();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setTab("services")} disabled={tab === "services"}>
          Services
        </button>
        <button onClick={() => setTab("garages")} disabled={tab === "garages"}>
          Garages
        </button>
      </div>

      {tab === "services" ? (
        <div>
          <h1>Dịch vụ (Service)</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input placeholder="Tìm theo tên..." value={serviceQuery} onChange={(e) => setServiceQuery(e.target.value)} style={{ minWidth: 260 }} />
            <button onClick={refreshServices} disabled={servicesLoading}>
              {servicesLoading ? "Đang tải..." : "Tải lại"}
            </button>
            <button onClick={onCreateService}>+ Tạo service</button>
          </div>

          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>ID</th>
                <th>Tên</th>
                <th>SuggestedLaborFee</th>
                <th>Deleted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.serviceId} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{s.serviceId}</td>
                  <td>{s.serviceName}</td>
                  <td>{s.suggestedLaborFee}</td>
                  <td>{String(s.isDeleted)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button onClick={() => onEditService(s)}>Sửa</button>{" "}
                    <button onClick={() => onDeleteService(s.serviceId)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: "#666" }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <h1>Garage</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input placeholder="Tìm theo tên/địa chỉ/sđt thợ..." value={garageQuery} onChange={(e) => setGarageQuery(e.target.value)} style={{ minWidth: 300 }} />
            <button onClick={refreshGarages} disabled={garagesLoading}>
              {garagesLoading ? "Đang tải..." : "Tải lại"}
            </button>
            <button onClick={refreshMechanics}>Tải mechanics</button>
            <button onClick={onCreateGarage}>+ Tạo garage</button>
          </div>

          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>ID</th>
                <th>Tên</th>
                <th>Địa chỉ</th>
                <th>Thợ</th>
                <th>Deleted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {garages.map((g) => (
                <tr key={g.garageId} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{g.garageId}</td>
                  <td>{g.garageName}</td>
                  <td>{g.address}</td>
                  <td>
                    {g.mechanicFullName} ({g.mechanicPhoneNumber})
                  </td>
                  <td>{String(g.isDeleted)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button onClick={() => onEditGarage(g)}>Sửa</button>{" "}
                    <button onClick={() => onDeleteGarage(g.garageId)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {garages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: "#666" }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

