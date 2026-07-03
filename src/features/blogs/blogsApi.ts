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
  viewCount: number;
  uniqueViewers: number;
  appViews: number;
  landingPageViews: number;
  lastViewedAt: string | null;
};

export type BlogDetail = BlogListItem & {
  content: string;
  updatedat: string | null;
};

export type BlogAnalyticsRow = {
  blogpostid: string;
  slug: string;
  title: string;
  category: string | null;
  viewCount: number;
  uniqueViewers: number;
  appViews: number;
  landingPageViews: number;
  lastViewedAt: string | null;
};

export type BlogAnalyticsResponse = {
  from: string | null;
  to: string | null;
  totalViews: number;
  uniqueViewers: number;
  appViews: number;
  landingPageViews: number;
  totalBlogs: number;
  publishedBlogs: number;
  topBlog: BlogAnalyticsRow | null;
  items: BlogAnalyticsRow[];
};

export type BlogUpsertPayload = {
  title: string;
  summary: string;
  content: string;
  coverimageurl?: string | null;
  category?: string | null;
  ispublished: boolean;
  publishedat?: string | null;
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

export async function getBlogAnalytics(params?: { from?: string; to?: string; top?: number }) {
  const res = await http.get<BlogAnalyticsResponse>("/admin/blog-analytics", { params });
  return res.data;
}

export async function exportBlogAnalytics(params?: { from?: string; to?: string }) {
  const res = await http.get("/admin/blog-analytics/export", {
    params,
    responseType: "blob"
  });
  return res.data as Blob;
}
