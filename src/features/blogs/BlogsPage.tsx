import { useEffect, useState } from "react";
import { Modal } from "../../shared/components/Modal";
import {
  BlogListItem,
  BlogUpsertPayload,
  createBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  updateBlog
} from "./blogsApi";

export function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<BlogListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [form, setForm] = useState<BlogUpsertPayload>({
    title: "",
    summary: "",
    content: "",
    coverimageurl: "",
    category: "",
    ispublished: false
  });

  async function refresh() {
    setLoading(true);
    try {
      const res = await listBlogs({ q: query || undefined, page: 1, pageSize: 100, includeDeleted: true });
      setBlogs(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      summary: "",
      content: "",
      coverimageurl: "",
      category: "",
      ispublished: false
    });
    setModalOpen(true);
  }

  async function openEdit(blog: BlogListItem) {
    setEditing(blog);
    const detail = await getBlog(blog.blogpostid);
    setForm({
      title: detail.title,
      summary: detail.summary,
      content: detail.content,
      coverimageurl: detail.coverimageurl ?? "",
      category: detail.category ?? "",
      ispublished: detail.ispublished
    });
    setModalOpen(true);
  }

  function triggerConfirm(message: string, onConfirm: () => void) {
    setConfirmAction({ message, onConfirm });
    setConfirmOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      alert("Vui lòng nhập tiêu đề, tóm tắt và nội dung.");
      return;
    }
    try {
      const payload: BlogUpsertPayload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        coverimageurl: form.coverimageurl?.trim() || null,
        category: form.category?.trim() || null,
        ispublished: form.ispublished
      };
      if (editing) {
        await updateBlog(editing.blogpostid, payload);
      } else {
        await createBlog(payload);
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không lưu được bài viết.");
    }
  }

  async function onDelete(blogpostId: string) {
    triggerConfirm("Bạn có chắc muốn xóa mềm bài viết này không?", async () => {
      await deleteBlog(blogpostId);
      await refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Quản lý Blog</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Tạo, sửa, xuất bản và ẩn bài viết hiển thị trên landing page.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>+ Thêm bài viết</button>
      </div>

      <div style={{ display: "flex", gap: "8px", background: "var(--card-bg)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Tìm theo tiêu đề, slug hoặc danh mục..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" onClick={refresh} disabled={loading}>{loading ? "..." : "Tải lại"}</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Slug</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Xuất bản</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.blogpostid}>
                <td style={{ fontWeight: 700 }}>{blog.title}</td>
                <td><code>{blog.slug}</code></td>
                <td>{blog.category ?? "-"}</td>
                <td>
                  <span className={`badge ${blog.isdeleted ? "badge--danger" : blog.ispublished ? "badge--success" : "badge--warning"}`}>
                    {blog.isdeleted ? "Đã xóa" : blog.ispublished ? "Đã đăng" : "Nháp"}
                  </span>
                </td>
                <td>{blog.publishedat ? new Date(blog.publishedat).toLocaleString("vi-VN") : "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn--sm" onClick={() => openEdit(blog)}>Sửa</button>
                    <button className="btn btn--sm btn--danger" onClick={() => onDelete(blog.blogpostid)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Cập nhật bài viết" : "Tạo bài viết mới"}
        size="lg"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setModalOpen(false)}>Hủy</button>
            <button className="btn btn--primary" onClick={save}>Lưu</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="form-group">
            <label>Tiêu đề</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Tóm tắt</label>
            <textarea className="textarea" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nội dung HTML</label>
            <textarea className="textarea" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Ảnh bìa URL</label>
            <input className="input" value={form.coverimageurl ?? ""} onChange={(e) => setForm({ ...form, coverimageurl: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Danh mục</label>
            <input className="input" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.ispublished}
              onChange={(e) => setForm({ ...form, ispublished: e.target.checked })}
            />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Xuất bản ngay</span>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận thao tác"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" onClick={() => setConfirmOpen(false)}>Hủy</button>
            <button
              className="btn btn--danger"
              onClick={() => {
                confirmAction?.onConfirm();
                setConfirmOpen(false);
              }}
            >
              Đồng ý
            </button>
          </div>
        }
      >
        {confirmAction?.message}
      </Modal>
    </div>
  );
}
