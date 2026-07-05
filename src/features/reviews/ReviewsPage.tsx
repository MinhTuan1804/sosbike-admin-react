import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { listReviews, setReviewVisibility, type ReviewListItem } from "./reviewsApi";
import { Modal } from "../../shared/components/Modal";

const PAGE_SIZE = 20;

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  let str = value.trim();
  if (!str.endsWith("Z") && !str.includes("+") && str.includes("T")) {
    str += "Z";
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function renderStars(stars: number) {
  return (
    <span style={{ color: "#f59e0b", letterSpacing: "2px", fontSize: "15px", whiteSpace: "nowrap" }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ color: index < stars ? "#f59e0b" : "#d1d5db" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onPrev,
  onNext
}: {
  page: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap"
      }}
    >
      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
        Tổng cộng: <strong>{total}</strong> đánh giá
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button className="btn btn--ghost btn--sm" onClick={onPrev} disabled={page <= 1}>
          Trước
        </button>
        <span style={{ minWidth: "84px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
          Trang {page} / {totalPages}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onNext} disabled={page >= totalPages}>
          Sau
        </button>
      </div>
    </div>
  );
}

export function ReviewsPage() {
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<string>("");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewListItem[]>([]);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listReviews({
        q: q || undefined,
        rating: rating ? Number(rating) : undefined,
        includeHidden,
        page,
        pageSize: PAGE_SIZE
      });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmModalOpen(true);
  }

  async function onToggleHidden(review: ReviewListItem) {
    const next = !review.isHidden;
    const message = next
      ? "Bạn có chắc chắn muốn ẩn đánh giá này không? Đánh giá bị ẩn sẽ không hiển thị trên ứng dụng khách hàng."
      : "Bạn muốn hiển thị lại đánh giá này trên ứng dụng?";

    triggerConfirm(message, async () => {
      await setReviewVisibility(review.reviewId, next);
      await refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="page-header">
        <div className="page-header__info">
          <h1>Đánh giá & Review</h1>
          <p>Giám sát chất lượng cứu hộ thông qua đánh giá sao và ý kiến đóng góp từ khách hàng.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={refresh} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại danh sách"}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Tìm theo nội dung đánh giá, SĐT khách, tên thợ..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: "260px" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              refresh();
            }
          }}
        />
        <select
          className="select"
          style={{ width: "160px" }}
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={String(value)}>
              {value} sao
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={includeHidden}
            onChange={(e) => {
              setIncludeHidden(e.target.checked);
              setPage(1);
            }}
            style={{ width: "16px", height: "16px" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Hiện đánh giá đã ẩn</span>
        </label>
        <button
          className="btn btn--ghost"
          onClick={() => {
            setPage(1);
            refresh();
          }}
          disabled={loading}
        >
          Lọc
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Khách hàng</th>
              <th>Thợ cứu hộ</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((review) => (
              <tr key={review.reviewId} style={{ opacity: review.isHidden ? 0.72 : 1 }}>
                <td>
                  <div>{renderStars(review.rating ?? 0)}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                    Mã: {review.reviewId.slice(0, 8).toUpperCase()}
                  </div>
                </td>
                <td style={{ maxWidth: "320px" }}>
                  {review.comment ? (
                    <span style={{ fontWeight: 500 }}>"{review.comment}"</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(Khách hàng không để lại nhận xét)</span>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{review.customerFullName}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{review.customerPhoneNumber}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{review.mechanicFullName}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{review.mechanicPhoneNumber}</div>
                </td>
                <td>
                  <span className={`badge ${review.isHidden ? "badge--danger" : "badge--success"}`}>
                    {review.isHidden ? "Đã ẩn" : "Hiển thị"}
                  </span>
                </td>
                <td>{formatDateTime(review.createdAt)}</td>
                <td>
                  <button
                    className={`btn btn--sm ${review.isHidden ? "btn--primary" : "btn--danger"}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={() => onToggleHidden(review)}
                  >
                    {review.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{review.isHidden ? "Hiện lại" : "Ẩn đánh giá"}</span>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Không có đánh giá nào phù hợp với bộ lọc tìm kiếm.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage((prev) => prev - 1)}
        onNext={() => setPage((prev) => prev + 1)}
      />

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận thao tác đánh giá"
        footer={
          <div className="flex-gap gap-8">
            <button className="btn" onClick={() => setConfirmModalOpen(false)}>
              Hủy bỏ
            </button>
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
          <MessageSquare size={28} style={{ color: "var(--primary)" }} />
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>{confirmAction?.message}</div>
        </div>
      </Modal>
    </div>
  );
}
