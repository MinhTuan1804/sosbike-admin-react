import { useEffect, useMemo, useState } from "react";
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

type TabKey = "plans" | "benefits";

const AUDIENCES = ["B2C", "B2B", "DRIVER"] as const;

export function MembershipPage() {
  const [tab, setTab] = useState<TabKey>("plans");

  // Plans list
  const [planQuery, setPlanQuery] = useState("");
  const [planAudience, setPlanAudience] = useState<string>("");
  const [plans, setPlans] = useState<SubscriptionPlanListItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Benefits list
  const [benefitQuery, setBenefitQuery] = useState("");
  const [benefits, setBenefits] = useState<BenefitListItem[]>([]);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(false);

  const selectedPlanBenefitsMap = useMemo(() => {
    const map = new Map<number, { benefitValue: number | null; usageLimit: number | null }>();
    for (const b of selectedPlan?.benefits ?? []) map.set(b.benefitId, { benefitValue: b.benefitValue, usageLimit: b.usageLimit });
    return map;
  }, [selectedPlan]);

  async function refreshPlans() {
    setIsLoadingPlans(true);
    try {
      const data = await listPlans({ q: planQuery || undefined, targetAudience: planAudience || undefined, includeDeleted: true, page: 1, pageSize: 50 });
      setPlans(data.items);
      if (selectedPlanId && !data.items.some((p) => p.planId === selectedPlanId)) setSelectedPlanId(null);
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

  async function onCreatePlan() {
    const planName = window.prompt("Tên gói (PlanName) là gì?");
    if (!planName) return;

    const targetAudience = (window.prompt("TargetAudience (B2C/B2B/DRIVER)?", "B2C") || "B2C").toUpperCase();
    const price = Number(window.prompt("Giá (Price)?", "0") || "0");
    const durationDays = Number(window.prompt("Số ngày hiệu lực (DurationDays)?", "30") || "30");
    const platformFeeRateStr = window.prompt("PlatformFeeRate (vd 10.00) - có thể bỏ trống", "");
    const platformFeeRate = platformFeeRateStr ? Number(platformFeeRateStr) : null;

    const { planId } = await createPlan({ planName, targetAudience, price, durationDays, platformFeeRate });
    await refreshPlans();
    setSelectedPlanId(planId);
  }

  async function onUpdatePlan(plan: SubscriptionPlanListItem) {
    const planName = window.prompt("PlanName mới (bỏ trống để giữ nguyên)", plan.planName);
    if (planName === null) return;
    const targetAudience = window.prompt("TargetAudience (B2C/B2B/DRIVER) - bỏ trống để giữ", plan.targetAudience);
    if (targetAudience === null) return;
    const priceStr = window.prompt("Price - bỏ trống để giữ", String(plan.price));
    if (priceStr === null) return;
    const durationStr = window.prompt("DurationDays - bỏ trống để giữ", String(plan.durationDays));
    if (durationStr === null) return;
    const feeStr = window.prompt("PlatformFeeRate - bỏ trống để giữ", plan.platformFeeRate == null ? "" : String(plan.platformFeeRate));
    if (feeStr === null) return;
    const isDeletedStr = window.prompt("IsDeleted (true/false) - bỏ trống để giữ", String(plan.isDeleted));
    if (isDeletedStr === null) return;

    const payload: any = {};
    if (planName.trim().length > 0 && planName !== plan.planName) payload.planName = planName;
    if (targetAudience.trim().length > 0 && targetAudience.toUpperCase() !== plan.targetAudience) payload.targetAudience = targetAudience.toUpperCase();
    if (priceStr.trim().length > 0) payload.price = Number(priceStr);
    if (durationStr.trim().length > 0) payload.durationDays = Number(durationStr);
    if (feeStr.trim().length > 0) payload.platformFeeRate = Number(feeStr);
    if (feeStr.trim().length === 0) payload.platformFeeRate = null;
    if (isDeletedStr.trim().length > 0) payload.isDeleted = isDeletedStr.trim().toLowerCase() === "true";

    await updatePlan(plan.planId, payload);
    await refreshPlans();
    if (selectedPlanId === plan.planId) await refreshSelectedPlan(plan.planId);
  }

  async function onDeletePlan(planId: number) {
    if (!window.confirm("Xóa mềm (soft delete) gói này?")) return;
    await deletePlan(planId);
    await refreshPlans();
    if (selectedPlanId === planId) setSelectedPlanId(null);
  }

  async function onCreateBenefit() {
    const benefitCode = window.prompt("BenefitCode là gì? (vd FREE_KM)");
    if (!benefitCode) return;
    const benefitName = window.prompt("BenefitName là gì?");
    if (!benefitName) return;
    const description = window.prompt("Description (tuỳ chọn)", "") ?? "";
    await createBenefit({ benefitCode, benefitName, description });
    await refreshBenefits();
  }

  async function onUpdateBenefit(b: BenefitListItem) {
    const benefitCode = window.prompt("BenefitCode mới (bỏ trống để giữ)", b.benefitCode);
    if (benefitCode === null) return;
    const benefitName = window.prompt("BenefitName mới (bỏ trống để giữ)", b.benefitName);
    if (benefitName === null) return;
    const description = window.prompt("Description mới (bỏ trống để clear)", b.description ?? "");
    if (description === null) return;

    const payload: any = {};
    if (benefitCode.trim().length > 0 && benefitCode !== b.benefitCode) payload.benefitCode = benefitCode;
    if (benefitName.trim().length > 0 && benefitName !== b.benefitName) payload.benefitName = benefitName;
    payload.description = description;

    await updateBenefit(b.benefitId, payload);
    await refreshBenefits();
    if (selectedPlanId) await refreshSelectedPlan(selectedPlanId);
  }

  async function onDeleteBenefit(benefitId: number) {
    if (!window.confirm("Xóa benefit này? (chỉ xóa được nếu chưa dùng trong plan)")) return;
    await deleteBenefit(benefitId);
    await refreshBenefits();
  }

  async function onTogglePlanBenefit(planId: number, benefitId: number) {
    const isAssigned = selectedPlanBenefitsMap.has(benefitId);
    if (!isAssigned) {
      const benefitValueStr = window.prompt("BenefitValue (vd 5.00) - có thể bỏ trống", "");
      const usageLimitStr = window.prompt("UsageLimit (vd 10) - có thể bỏ trống", "");
      await upsertPlanBenefit(planId, benefitId, {
        benefitValue: benefitValueStr ? Number(benefitValueStr) : null,
        usageLimit: usageLimitStr ? Number(usageLimitStr) : null
      });
    } else {
      if (!window.confirm("Gỡ benefit khỏi plan?")) return;
      await removePlanBenefit(planId, benefitId);
    }
    await refreshSelectedPlan(planId);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setTab("plans")} disabled={tab === "plans"}>
          Gói dịch vụ
        </button>
        <button onClick={() => setTab("benefits")} disabled={tab === "benefits"}>
          Quyền lợi
        </button>
      </div>

      {tab === "plans" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div>
            <h1>Gói & Quyền lợi</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <input
                placeholder="Tìm theo tên gói..."
                value={planQuery}
                onChange={(e) => setPlanQuery(e.target.value)}
                style={{ minWidth: 220 }}
              />
              <select value={planAudience} onChange={(e) => setPlanAudience(e.target.value)}>
                <option value="">Tất cả Audience</option>
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <button onClick={refreshPlans} disabled={isLoadingPlans}>
                {isLoadingPlans ? "Đang tải..." : "Tải lại"}
              </button>
              <button onClick={onCreatePlan}>+ Tạo gói</button>
            </div>

            <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Audience</th>
                  <th>Giá</th>
                  <th>Ngày</th>
                  <th>Deleted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.planId} style={{ borderBottom: "1px solid #eee", background: selectedPlanId === p.planId ? "#f6f8ff" : "transparent" }}>
                    <td>{p.planId}</td>
                    <td>
                      <button
                        style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => setSelectedPlanId(p.planId)}
                      >
                        {p.planName}
                      </button>
                    </td>
                    <td>{p.targetAudience}</td>
                    <td>{p.price}</td>
                    <td>{p.durationDays}</td>
                    <td>{String(p.isDeleted)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button onClick={() => onUpdatePlan(p)}>Sửa</button>{" "}
                      <button onClick={() => onDeletePlan(p.planId)}>Xóa</button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 12, color: "#666" }}>
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div>
            <h2>Chi tiết gói</h2>
            {!selectedPlan ? (
              <p style={{ color: "#666" }}>Chọn 1 gói để xem / gán quyền lợi.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div>
                    <b>{selectedPlan.planName}</b> (ID: {selectedPlan.planId})
                  </div>
                  <div style={{ color: "#666" }}>
                    Audience: {selectedPlan.targetAudience} · Price: {selectedPlan.price} · DurationDays: {selectedPlan.durationDays}
                  </div>
                </div>

                <div>
                  <h3>Quyền lợi trong gói</h3>
                  <ul>
                    {(selectedPlan.benefits ?? []).map((b) => (
                      <li key={b.planBenefitId}>
                        {b.benefitCode} - {b.benefitName} (value: {b.benefitValue ?? "-"}, limit: {b.usageLimit ?? "-"})
                      </li>
                    ))}
                    {selectedPlan.benefits.length === 0 ? <li style={{ color: "#666" }}>Chưa có quyền lợi nào.</li> : null}
                  </ul>
                </div>

                <div>
                  <h3>Gán / gỡ quyền lợi</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <input
                      placeholder="Tìm benefit..."
                      value={benefitQuery}
                      onChange={(e) => setBenefitQuery(e.target.value)}
                      style={{ minWidth: 220 }}
                    />
                    <button onClick={refreshBenefits} disabled={isLoadingBenefits}>
                      {isLoadingBenefits ? "Đang tải..." : "Tải benefits"}
                    </button>
                  </div>

                  <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                        <th>Code</th>
                        <th>Tên</th>
                        <th>Đang gán</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {benefits.map((b) => {
                        const assigned = selectedPlanBenefitsMap.has(b.benefitId);
                        return (
                          <tr key={b.benefitId} style={{ borderBottom: "1px solid #eee" }}>
                            <td>{b.benefitCode}</td>
                            <td>{b.benefitName}</td>
                            <td>{assigned ? "Có" : "Không"}</td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              <button onClick={() => onTogglePlanBenefit(selectedPlan.planId, b.benefitId)}>
                                {assigned ? "Gỡ" : "Gán"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {benefits.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 12, color: "#666" }}>
                            Không có benefit nào.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1>Quyền lợi (Benefits)</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input placeholder="Tìm theo code/tên..." value={benefitQuery} onChange={(e) => setBenefitQuery(e.target.value)} style={{ minWidth: 260 }} />
            <button onClick={refreshBenefits} disabled={isLoadingBenefits}>
              {isLoadingBenefits ? "Đang tải..." : "Tải lại"}
            </button>
            <button onClick={onCreateBenefit}>+ Tạo benefit</button>
          </div>

          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>ID</th>
                <th>Code</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {benefits.map((b) => (
                <tr key={b.benefitId} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{b.benefitId}</td>
                  <td>{b.benefitCode}</td>
                  <td>{b.benefitName}</td>
                  <td style={{ color: "#666" }}>{b.description ?? ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button onClick={() => onUpdateBenefit(b)}>Sửa</button>{" "}
                    <button onClick={() => onDeleteBenefit(b.benefitId)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {benefits.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: "#666" }}>
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

