import { useEffect, useState } from "react";
import { listReviews, setReviewVisibility, type ReviewListItem } from "./reviewsApi";
import { Modal } from "../../shared/components/Modal";

export function ReviewsPage() {
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<string>("");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewListItem[]>([]);

  // Dialog states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listReviews({
        q: q || undefined,
        rating: rating ? Number(rating) : undefined,
        includeHidden,
        page: 1,
        pageSize: 200
      });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmModalOpen(true);
  }

  async function onToggleHidden(r: ReviewListItem) {
    const next = !r.isHidden;
    const msg = next
      ? "Bạn có chắc chắn muốn ẨN đánh giá này không? Đánh giá bị ẩn sẽ không hiển thị trên ứng dụng khách hàng."
      : "Bạn muốn HIỂN THỊ lại đánh giá này trên ứng dụng?";
    
    triggerConfirm(msg, async () => {
      await setReviewVisibility(r.reviewId, next);
      await refresh();
    });
  }

  function renderStars(stars: number) {
    return (
      <span style={{ color: "#f59e0b", fontSize: "14px", fontWeight: "bold", display: "flex", gap: "2px" }}>
        {"★".repeat(stars)}
        {"☆".repeat(Math.max(0, 5 - stars))}
      </span>
    );
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--secondary)", letterSpacing: "-0.03em" }}>Đánh giá & Phản hồi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Giám sát chất lượng cứu hộ thông qua đánh giá sao và ý kiến đóng góp từ khách hàng.
          </p>
        </div>
        <button className="btn btn--primary" onClick={refresh} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại danh sách"}
        </button>
      </div>

      {/* Filter Card */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
        <input
          className="input"
          placeholder="Tìm theo nội dung đánh giá, SĐT khách, tên thợ..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: "260px" }}
        />
        <select className="select" style={{ width: "160px" }} value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((x) => (
            <option key={x} value={String(x)}>
              {x} sao
            </option>
          ))}
        </select>
        
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
          <input 
            type="checkbox" 
            checked={includeHidden} 
            onChange={(e) => setIncludeHidden(e.target.checked)}
            style={{ width: "16px", height: "16px" }}
          />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>Hiện đánh giá đã ẩn</span>
        </label>
      </div>

      {/* Grid of reviews cards (Testimonial Style for UX optimization) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
        {items.map((r) => (
          <div
            key={r.reviewId}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: r.isHidden ? 0.7 : 1,
              background: r.isHidden ? "var(--neutral-bg)" : "var(--card-bg)",
              border: r.isHidden ? "1px dashed var(--danger)" : "1px solid var(--border-color)",
              position: "relative"
            }}
          >
            {/* Top header line */}
            <div className="flex-between">
              <div>
                {renderStars(r.rating ?? 0)}
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Ngày gửi: {new Date(r.createdAt ?? "").toLocaleString("vi-VN")}
                </div>
              </div>
              <div>
                {r.isHidden ? (
                  <span className="badge badge--danger">Đã ẩn</span>
                ) : (
                  <span className="badge badge--success">Hiển thị</span>
                )}
              </div>
            </div>

            {/* Comment Section */}
            <div style={{ margin: "16px 0", fontSize: "14px", fontWeight: "500", color: "var(--text-main)", fontStyle: r.comment ? "normal" : "italic", minHeight: "44px" }}>
              {r.comment ? `"${r.comment}"` : "(Khách hàng không để lại nhận xét)"}
            </div>

            {/* User Meta Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "12px", fontSize: "12px" }}>
              <div>
                <div style={{ color: "var(--text-light)", fontWeight: "600", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.02em" }}>Khách hàng</div>
                <div style={{ fontWeight: "700", marginTop: "2px" }}>{r.customerFullName}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{r.customerPhoneNumber}</div>
              </div>
              <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "12px" }}>
                <div style={{ color: "var(--text-light)", fontWeight: "600", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.02em" }}>Thợ cứu hộ</div>
                <div style={{ fontWeight: "700", marginTop: "2px" }}>{r.mechanicFullName}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{r.mechanicPhoneNumber}</div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                className={`btn btn--sm ${r.isHidden ? "btn--primary" : "btn--danger"}`}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => onToggleHidden(r)}
              >
                {r.isHidden ? "🔓 Khôi phục hiển thị" : "🔒 Ẩn đánh giá khỏi App"}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Không có đánh giá nào phù hợp với bộ lọc tìm kiếm.
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận thao tác đánh giá"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>Hủy bỏ</button>
            <button
              className="btn btn--primary"
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
          <span style={{ fontSize: "28px" }}>💬</span>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
            {confirmAction?.message}
          </div>
        </div>
      </Modal>
    </div>
  );
}
