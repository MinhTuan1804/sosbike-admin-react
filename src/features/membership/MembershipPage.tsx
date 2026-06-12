import { useEffect, useMemo, useState } from "react";
import { Ticket, Star, Info, AlertTriangle } from "lucide-react";
import {
  BenefitListItem,
  PlanDetail,
  SubscriptionPlanListItem,
  createBenefit,
  createPlan,
  deleteBenefit,
  deletePlan,
  getPlan,
  listBenefits,
  listPlans,
  removePlanBenefit,
  updateBenefit,
  updatePlan,
  upsertPlanBenefit
} from "./membershipApi";
import { Modal } from "../../shared/components/Modal";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(v));
}

type TabKey = "plans" | "benefits";
const AUDIENCES = ["B2C", "B2B", "DRIVER"] as const;

export function MembershipPage() {
  const [tab, setTab] = useState<TabKey>("plans");

  // Plans list state
  const [planQuery, setPlanQuery] = useState("");
  const [planAudience, setPlanAudience] = useState<string>("");
  const [plans, setPlans] = useState<SubscriptionPlanListItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Benefits list state
  const [benefitQuery, setBenefitQuery] = useState("");
  const [benefits, setBenefits] = useState<BenefitListItem[]>([]);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(false);

  // Modal control states
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanListItem | null>(null);
  const [planForm, setPlanForm] = useState({
    planName: "",
    targetAudience: "B2C",
    price: 0,
    durationDays: 30,
    platformFeeRate: "" as string | number,
    isDeleted: false
  });

  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<BenefitListItem | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    benefitCode: "",
    benefitName: "",
    description: ""
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ planId: number; benefitId: number; benefitCode: string } | null>(null);
  const [assignForm, setAssignForm] = useState({
    benefitValue: "",
    usageLimit: ""
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const selectedPlanBenefitsMap = useMemo(() => {
    const map = new Map<number, { benefitValue: number | null; usageLimit: number | null }>();
    for (const b of selectedPlan?.benefits ?? []) {
      map.set(b.benefitId, { benefitValue: b.benefitValue, usageLimit: b.usageLimit });
    }
    return map;
  }, [selectedPlan]);

  async function refreshPlans() {
    setIsLoadingPlans(true);
    try {
      const data = await listPlans({
        q: planQuery || undefined,
        targetAudience: planAudience || undefined,
        includeDeleted: true,
        page: 1,
        pageSize: 50
      });
      setPlans(data.items);
      if (selectedPlanId && !data.items.some((p) => p.planId === selectedPlanId)) {
        setSelectedPlanId(null);
      }
    } finally {
      setIsLoadingPlans(false);
    }
  }

  async function refreshBenefits() {
    setIsLoadingBenefits(true);
    try {
      const data = await listBenefits({ q: benefitQuery || undefined, page: 1, pageSize: 200 });
      setBenefits(data.items);
    } finally {
      setIsLoadingBenefits(false);
    }
  }

  async function refreshSelectedPlan(planId: number) {
    const detail = await getPlan(planId);
    setSelectedPlan(detail);
  }

  useEffect(() => {
    refreshPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshBenefits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedPlan(null);
      return;
    }
    refreshSelectedPlan(selectedPlanId);
  }, [selectedPlanId]);

  // Trigger Confirmation Modal
  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmModalOpen(true);
  }

  // Plan Handlers
  function openCreatePlanModal() {
    setEditingPlan(null);
    setPlanForm({
      planName: "",
      targetAudience: "B2C",
      price: 0,
      durationDays: 30,
      platformFeeRate: "",
      isDeleted: false
    });
    setPlanModalOpen(true);
  }

  function openEditPlanModal(plan: SubscriptionPlanListItem) {
    setEditingPlan(plan);
    setPlanForm({
      planName: plan.planName,
      targetAudience: plan.targetAudience,
      price: plan.price,
      durationDays: plan.durationDays,
      platformFeeRate: plan.platformFeeRate == null ? "" : plan.platformFeeRate,
      isDeleted: plan.isDeleted
    });
    setPlanModalOpen(true);
  }

  async function savePlanSubmit() {
    const feeVal = planForm.platformFeeRate === "" ? null : Number(planForm.platformFeeRate);
    if (!planForm.planName.trim()) {
      alert("Tên gói không được bỏ trống");
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.planId, {
          planName: planForm.planName,
          targetAudience: planForm.targetAudience,
          price: Number(planForm.price),
          durationDays: Number(planForm.durationDays),
          platformFeeRate: feeVal,
          isDeleted: planForm.isDeleted
        });
      } else {
        const { planId } = await createPlan({
          planName: planForm.planName,
          targetAudience: planForm.targetAudience,
          price: Number(planForm.price),
          durationDays: Number(planForm.durationDays),
          platformFeeRate: feeVal
        });
        setSelectedPlanId(planId);
      }
      setPlanModalOpen(false);
      await refreshPlans();
      if (editingPlan && selectedPlanId === editingPlan.planId) {
        await refreshSelectedPlan(editingPlan.planId);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác lỗi.");
    }
  }

  async function onDeletePlan(planId: number) {
    triggerConfirm("Bạn có chắc muốn xóa mềm gói dịch vụ này không?", async () => {
      await deletePlan(planId);
      await refreshPlans();
      if (selectedPlanId === planId) setSelectedPlanId(null);
    });
  }

  // Benefit Handlers
  function openCreateBenefitModal() {
    setEditingBenefit(null);
    setBenefitForm({ benefitCode: "", benefitName: "", description: "" });
    setBenefitModalOpen(true);
  }

  function openEditBenefitModal(b: BenefitListItem) {
    setEditingBenefit(b);
    setBenefitForm({
      benefitCode: b.benefitCode,
      benefitName: b.benefitName,
      description: b.description ?? ""
    });
    setBenefitModalOpen(true);
  }

  async function saveBenefitSubmit() {
    if (!benefitForm.benefitCode.trim() || !benefitForm.benefitName.trim()) {
      alert("Vui lòng điền mã và tên quyền lợi.");
      return;
    }
    try {
      if (editingBenefit) {
        await updateBenefit(editingBenefit.benefitId, {
          benefitCode: benefitForm.benefitCode,
          benefitName: benefitForm.benefitName,
          description: benefitForm.description
        });
      } else {
        await createBenefit({
          benefitCode: benefitForm.benefitCode,
          benefitName: benefitForm.benefitName,
          description: benefitForm.description
        });
      }
      setBenefitModalOpen(false);
      await refreshBenefits();
      if (selectedPlanId) await refreshSelectedPlan(selectedPlanId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác lỗi.");
    }
  }

  async function onDeleteBenefit(benefitId: number) {
    triggerConfirm("Bạn có chắc chắn muốn xóa quyền lợi này không? Chỉ có thể xóa nếu quyền lợi chưa được gắn vào gói nào.", async () => {
      try {
        await deleteBenefit(benefitId);
        await refreshBenefits();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa quyền lợi lỗi.");
      }
    });
  }

  // Plan-Benefit Assignment Handlers
  async function onTogglePlanBenefit(planId: number, benefitId: number, benefitCode: string) {
    const isAssigned = selectedPlanBenefitsMap.has(benefitId);
    if (!isAssigned) {
      // Open Assignment Modal
      setAssignTarget({ planId, benefitId, benefitCode });
      setAssignForm({ benefitValue: "", usageLimit: "" });
      setAssignModalOpen(true);
    } else {
      triggerConfirm(`Bạn muốn gỡ quyền lợi [${benefitCode}] khỏi gói hiện tại?`, async () => {
        await removePlanBenefit(planId, benefitId);
        await refreshSelectedPlan(planId);
      });
    }
  }

  async function saveAssignmentSubmit() {
    if (!assignTarget) return;
    const { planId, benefitId } = assignTarget;
    try {
      await upsertPlanBenefit(planId, benefitId, {
        benefitValue: assignForm.benefitValue === "" ? null : Number(assignForm.benefitValue),
        usageLimit: assignForm.usageLimit === "" ? null : Number(assignForm.usageLimit)
      });
      setAssignModalOpen(false);
      setAssignTarget(null);
      await refreshSelectedPlan(planId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gán quyền lợi thất bại.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Tab Switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "8px" }}>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "plans" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "plans" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "plans" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("plans")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Ticket size={16} />
            <span>Gói dịch vụ hội viên</span>
          </div>
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            borderBottom: tab === "benefits" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
            color: tab === "benefits" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: tab === "benefits" ? "700" : "500",
            padding: "12px 4px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)"
          }}
          onClick={() => setTab("benefits")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Star size={16} />
            <span>Danh mục quyền lợi</span>
          </div>
        </button>
      </div>

      {/* Plans Workspace */}
      {tab === "plans" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          
          {/* Plans list */}
          <div>
            <div className="flex-between">
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Gói hội viên</h2>
              <button className="btn btn--primary btn--sm" onClick={openCreatePlanModal}>+ Tạo gói mới</button>
            </div>

            <div style={{ display: "flex", gap: "8px", margin: "16px 0", flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: "150px" }}
                placeholder="Tìm gói..."
                value={planQuery}
                onChange={(e) => setPlanQuery(e.target.value)}
              />
              <select className="select" style={{ width: "160px" }} value={planAudience} onChange={(e) => setPlanAudience(e.target.value)}>
                <option value="">Tất cả Audience</option>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button className="btn btn--sm" onClick={refreshPlans} disabled={isLoadingPlans}>
                {isLoadingPlans ? "..." : "Lọc"}
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Gói dịch vụ</th>
                    <th>Audience</th>
                    <th>Giá / Hạn</th>
                    <th>Soft Deleted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr
                      key={p.planId}
                      style={{
                        background: selectedPlanId === p.planId ? "var(--primary-light)" : "transparent",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedPlanId(p.planId)}
                    >
                      <td style={{ fontWeight: 600 }}>{p.planName}</td>
                      <td>
                        <span className="badge badge--info" style={{ fontSize: "10px" }}>{p.targetAudience}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "700" }}>{formatMoney(p.price)}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.durationDays} ngày</div>
                      </td>
                      <td>
                        <span className={`badge ${p.isDeleted ? "badge--danger" : "badge--success"}`}>
                          {p.isDeleted ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn--sm" onClick={() => openEditPlanModal(p)}>Sửa</button>
                          <button className="btn btn--sm btn--danger" onClick={() => onDeletePlan(p.planId)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Không có gói nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan Details Panel */}
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Chi tiết & Phân quyền lợi</h2>
            {!selectedPlan ? (
              <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <Info size={32} style={{ color: "var(--primary)" }} />
                <span>Hãy chọn một gói dịch vụ từ danh sách bên trái để quản lý cấu hình các quyền lợi đi kèm.</span>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                
                {/* Active Details Card */}
                <div className="card" style={{ background: "var(--neutral-bg)", padding: "16px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>GÓI ĐANG XEM</div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--secondary)", marginTop: "4px" }}>{selectedPlan.planName}</div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "13px" }}>
                    <span>Audience: <b>{selectedPlan.targetAudience}</b></span>
                    <span>Giá: <b>{formatMoney(selectedPlan.price)}</b></span>
                    <span>Hiệu lực: <b>{selectedPlan.durationDays} ngày</b></span>
                  </div>
                  {selectedPlan.platformFeeRate != null && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>
                      Chiết khấu riêng: {selectedPlan.platformFeeRate}%
                    </div>
                  )}
                </div>

                {/* Assigned Benefits List */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Quyền lợi đi kèm gói này</h3>
                  <ul style={{ listStyleType: "none", display: "grid", gap: "8px" }}>
                    {selectedPlan.benefits && selectedPlan.benefits.map((b) => (
                      <li
                        key={b.planBenefitId}
                        style={{
                          background: "var(--neutral-bg)",
                          border: "1px solid var(--border-color)",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <span className="badge badge--info" style={{ textTransform: "none", fontSize: "10px" }}>{b.benefitCode}</span>
                          <span style={{ fontWeight: 600, marginLeft: "8px", fontSize: "13px" }}>{b.benefitName}</span>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Giá trị áp dụng: <b>{b.benefitValue ?? "N/A"}</b> • Giới hạn sử dụng: <b>{b.usageLimit ?? "Vô hạn"} lần</b>
                          </div>
                        </div>
                      </li>
                    ))}
                    {(!selectedPlan.benefits || selectedPlan.benefits.length === 0) && (
                      <li style={{ color: "var(--text-light)", fontStyle: "italic", fontSize: "13px" }}>Chưa cấu hình quyền lợi nào.</li>
                    )}
                  </ul>
                </div>

                {/* Assignment Management Table */}
                <div className="card" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Quản lý gán quyền lợi</h3>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input
                      className="input"
                      placeholder="Tìm quyền lợi..."
                      value={benefitQuery}
                      onChange={(e) => setBenefitQuery(e.target.value)}
                    />
                    <button className="btn btn--sm" onClick={refreshBenefits} disabled={isLoadingBenefits}>Tải</button>
                  </div>

                  <div className="table-container" style={{ marginTop: 0 }}>
                    <table className="table" style={{ fontSize: "12px" }}>
                      <thead>
                        <tr>
                          <th>Quyền lợi</th>
                          <th>Đang gán</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {benefits.map((b) => {
                          const assigned = selectedPlanBenefitsMap.has(b.benefitId);
                          return (
                            <tr key={b.benefitId}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{b.benefitName}</div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{b.benefitCode}</div>
                              </td>
                              <td>
                                <span className={`badge ${assigned ? "badge--success" : "badge--danger"}`}>
                                  {assigned ? "Đã gán" : "Chưa"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={`btn btn--sm ${assigned ? "btn--danger" : "btn--primary"}`}
                                  onClick={() => onTogglePlanBenefit(selectedPlan.planId, b.benefitId, b.benefitCode)}
                                >
                                  {assigned ? "Gỡ bỏ" : "Cấp"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits Workspace */}
      {tab === "benefits" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div className="flex-between">
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Danh mục quyền lợi hệ thống</h2>
            <button className="btn btn--primary btn--sm" onClick={openCreateBenefitModal}>+ Tạo quyền lợi mới</button>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Tìm theo mã code hoặc tên quyền lợi..."
              value={benefitQuery}
              onChange={(e) => setBenefitQuery(e.target.value)}
            />
            <button className="btn" onClick={refreshBenefits} disabled={isLoadingBenefits}>
              {isLoadingBenefits ? "..." : "Tải lại"}
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã quyền lợi</th>
                  <th>Tên quyền lợi</th>
                  <th>Mô tả chức năng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {benefits.map((b) => (
                  <tr key={b.benefitId}>
                    <td style={{ fontWeight: "700", color: "var(--primary)" }}>{b.benefitCode}</td>
                    <td style={{ fontWeight: 600 }}>{b.benefitName}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{b.description ?? "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn--sm" onClick={() => openEditBenefitModal(b)}>Sửa</button>
                        <button className="btn btn--sm btn--danger" onClick={() => onDeleteBenefit(b.benefitId)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Dialog Modals */}
      
      {/* 1. Plan Form Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? "Cập nhật gói dịch vụ" : "Tạo gói dịch vụ mới"}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setPlanModalOpen(false)}>Hủy</button>
            <button className="btn btn--primary" onClick={savePlanSubmit}>Lưu cấu hình</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>Tên gói hội viên</label>
            <input
              className="input"
              value={planForm.planName}
              onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
              placeholder="Ví dụ: Standard Rider, Premium Partner..."
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Đối tượng áp dụng (Audience)</label>
              <select
                className="select"
                value={planForm.targetAudience}
                onChange={(e) => setPlanForm({ ...planForm, targetAudience: e.target.value })}
              >
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Thời gian hiệu lực (ngày)</label>
              <input
                className="input"
                type="number"
                value={planForm.durationDays}
                onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Giá bán (VND)</label>
              <input
                className="input"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Chiết khấu riêng (% - để trống nếu mặc định)</label>
              <input
                className="input"
                type="number"
                placeholder="Ví dụ: 8.5"
                value={planForm.platformFeeRate}
                onChange={(e) => setPlanForm({ ...planForm, platformFeeRate: e.target.value })}
              />
            </div>
          </div>

          {editingPlan && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={planForm.isDeleted}
                onChange={(e) => setPlanForm({ ...planForm, isDeleted: e.target.checked })}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--danger)" }}>Đã xóa mềm (Ngừng cung cấp gói này)</span>
            </label>
          )}
        </div>
      </Modal>

      {/* 2. Benefit Form Modal */}
      <Modal
        isOpen={benefitModalOpen}
        onClose={() => setBenefitModalOpen(false)}
        title={editingBenefit ? "Cập nhật quyền lợi" : "Tạo quyền lợi hệ thống"}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setBenefitModalOpen(false)}>Hủy</button>
            <button className="btn btn--primary" onClick={saveBenefitSubmit}>Lưu quyền lợi</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>Mã code quyền lợi (viết hoa, không dấu)</label>
            <input
              className="input"
              value={benefitForm.benefitCode}
              onChange={(e) => setBenefitForm({ ...benefitForm, benefitCode: e.target.value })}
              placeholder="Ví dụ: FREE_REPAIR, REFUND_50K..."
              disabled={!!editingBenefit} // Do not change code if editing
            />
          </div>

          <div className="form-group">
            <label>Tên quyền lợi hiển thị</label>
            <input
              className="input"
              value={benefitForm.benefitName}
              onChange={(e) => setBenefitForm({ ...benefitForm, benefitName: e.target.value })}
              placeholder="Ví dụ: Miễn phí sửa chữa, Hoàn tiền khi hủy..."
            />
          </div>

          <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea
              className="textarea"
              rows={4}
              value={benefitForm.description}
              onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
              placeholder="Mô tả cụ thể cách hoạt động và quyền lợi để admin/khách nắm thông tin..."
            />
          </div>
        </div>
      </Modal>

      {/* 3. Assign Plan-Benefit Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setAssignTarget(null); }}
        title={`Thiết lập quyền lợi: ${assignTarget?.benefitCode}`}
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => { setAssignModalOpen(false); setAssignTarget(null); }}>Hủy</button>
            <button className="btn btn--primary" onClick={saveAssignmentSubmit}>Lưu thiết lập</button>
          </div>
        }
      >
        {assignTarget && (
          <div style={{ display: "grid", gap: "12px" }}>
            <div className="form-group">
              <label>Giá trị áp dụng (Benefit Value - Ví dụ: 50000 hoặc 5 km)</label>
              <input
                className="input"
                type="number"
                placeholder="Nhập giá trị số (ví dụ: 100000)"
                value={assignForm.benefitValue}
                onChange={(e) => setAssignForm({ ...assignForm, benefitValue: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Giới hạn sử dụng tối đa (lần - để trống nếu vô hạn)</label>
              <input
                className="input"
                type="number"
                placeholder="Ví dụ: 5"
                value={assignForm.usageLimit}
                onChange={(e) => setAssignForm({ ...assignForm, usageLimit: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Global Confirm Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận thao tác"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>Hủy bỏ</button>
            <button
              className="btn btn--danger"
              onClick={() => {
                if (confirmAction) confirmAction.onConfirm();
                setConfirmModalOpen(false);
              }}
            >
              Đồng ý xác nhận
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

    </div>
  );
}
