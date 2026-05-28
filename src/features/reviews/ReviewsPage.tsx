import { useEffect, useState } from "react";
import { listReviews, setReviewVisibility, type ReviewListItem } from "./reviewsApi";

export function ReviewsPage() {
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<string>("");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewListItem[]>([]);

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

  async function onToggleHidden(r: ReviewListItem) {
    const next = !r.isHidden;
    const ok = window.confirm(next ? "Ẩn review này?" : "Hiện lại review này?");
    if (!ok) return;
    await setReviewVisibility(r.reviewId, next);
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1>Đánh giá (Reviews)</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Tìm theo comment / orderId / sđt / tên..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 320 }}
        />
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">Tất cả sao</option>
          {[1, 2, 3, 4, 5].map((x) => (
            <option key={x} value={String(x)}>
              {x} sao
            </option>
          ))}
        </select>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={includeHidden} onChange={(e) => setIncludeHidden(e.target.checked)} />
          Hiện cả review đã ẩn
        </label>
        <button onClick={refresh} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Ngày</th>
            <th>Sao</th>
            <th>Khách</th>
            <th>Thợ</th>
            <th>Comment</th>
            <th>Hidden</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.reviewId} style={{ borderBottom: "1px solid #eee", background: r.isHidden ? "#fff6f6" : "transparent" }}>
              <td style={{ whiteSpace: "nowrap" }}>{r.createdAt ?? ""}</td>
              <td style={{ whiteSpace: "nowrap" }}>{r.rating ?? "-"}</td>
              <td>
                {r.customerFullName} ({r.customerPhoneNumber})
              </td>
              <td>
                {r.mechanicFullName} ({r.mechanicPhoneNumber})
              </td>
              <td style={{ color: "#333" }}>{r.comment ?? ""}</td>
              <td style={{ whiteSpace: "nowrap" }}>{String(r.isHidden)}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button onClick={() => onToggleHidden(r)}>{r.isHidden ? "Hiện" : "Ẩn"}</button>
              </td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 12, color: "#666" }}>
                Không có dữ liệu.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

