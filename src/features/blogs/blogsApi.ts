import { http } from "../../shared/http";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type BlogListItem = {
  blogpostid: string;
  slug: string;
  title: string;
  summary: string;
  coverimageurl: string | null;
  category: string | null;
  ispublished: boolean;
  isdeleted: boolean;
  publishedat: string | null;
  createdat: string | null;
};

export type BlogDetail = BlogListItem & {
  content: string;
  updatedat: string | null;
};

export type BlogUpsertPayload = {
  title: string;
  summary: string;
  content: string;
  coverimageurl?: string | null;
  category?: string | null;
  ispublished: boolean;
};

export async function listBlogs(params: { q?: string; includeDeleted?: boolean; page?: number; pageSize?: number }) {
  const res = await http.get<PagedResponse<BlogListItem>>("/admin/blogs", { params });
  return res.data;
}

export async function getBlog(blogpostId: string) {
  const res = await http.get<BlogDetail>(`/admin/blogs/${blogpostId}`);
  return res.data;
}

export async function createBlog(payload: BlogUpsertPayload) {
  const res = await http.post<{ blogpostid: string; slug: string }>("/admin/blogs", payload);
  return res.data;
}

export async function updateBlog(blogpostId: string, payload: BlogUpsertPayload) {
  await http.patch(`/admin/blogs/${blogpostId}`, payload);
}

export async function deleteBlog(blogpostId: string) {
  await http.delete(`/admin/blogs/${blogpostId}`);
}
