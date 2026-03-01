import { useAuthStore } from "@/stores/authStore";

const API_BASE = "/api";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, isFormData = false } = options;
  const token = useAuthStore.getState().token;

  const config: RequestInit = {
    method,
    headers: {
      ...(token ? { "X-Session-Token": token } : {}),
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

// ─── Auth API ────────────────────────────────────────────
export const authAPI = {
  register: () => request<{ anonId: string; alias: string; token: string }>("/auth/register", { method: "POST" }),
  me: () => request<{ anonId: string; alias: string }>("/auth/me"),
  rotate: () => request<{ token: string }>("/auth/rotate", { method: "POST" }),
  recover: (data: { recoveryPhrase: string; anonId: string }) =>
    request<{ anonId: string; alias: string; token: string }>("/auth/recover", { method: "POST", body: data }),
  setRecovery: (recoveryPhrase: string) =>
    request("/auth/set-recovery", { method: "POST", body: { recoveryPhrase } }),
  logout: () => request("/auth/logout", { method: "POST" }),
};

// ─── Chat API ────────────────────────────────────────────
export const chatAPI = {
  getMessages: (room = "global", limit = 50) =>
    request<any[]>(`/chat/messages?room=${room}&limit=${limit}`),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return request<{ imageUrl: string }>("/chat/upload-image", { method: "POST", body: fd, isFormData: true });
  },
};

// ─── Resources API ───────────────────────────────────────
export const resourceAPI = {
  list: (params: { sort?: string; tag?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.sort) qs.set("sort", params.sort);
    if (params.tag) qs.set("tag", params.tag);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    return request<{ resources: any[]; pagination: { page: number; pages: number; total: number } }>(
      `/resources?${qs.toString()}`
    );
  },
  get: (id: string | number) => request<any>(`/resources/${id}`),
  create: (formData: FormData) =>
    request<any>("/resources", { method: "POST", body: formData, isFormData: true }),
  report: (id: string | number) =>
    request("/resources/" + id + "/report", { method: "POST" }),
};

// ─── Blog API ────────────────────────────────────────────
export const blogAPI = {
  list: (params: { sort?: string; tag?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.sort) qs.set("sort", params.sort);
    if (params.tag) qs.set("tag", params.tag);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    return request<{ posts: any[]; pagination: { page: number; pages: number; total: number } }>(
      `/blog?${qs.toString()}`
    );
  },
  get: (id: string | number) => request<any>(`/blog/${id}`),
  create: (data: { title: string; content: string; tags?: string }) =>
    request<any>("/blog", { method: "POST", body: data }),
  upvote: (id: string | number) =>
    request<{ upvotes: number }>(`/blog/${id}/upvote`, { method: "POST" }),
  comment: (id: string | number, content: string) =>
    request<any>(`/blog/${id}/comments`, { method: "POST", body: { content } }),
  report: (id: string | number) =>
    request(`/blog/${id}/report`, { method: "POST" }),
};

// ─── Ideas API ───────────────────────────────────────────
export const ideaAPI = {
  list: (params: { sort?: string; category?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.sort) qs.set("sort", params.sort);
    if (params.category) qs.set("category", params.category);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    return request<{ ideas: any[]; pagination: { page: number; pages: number; total: number } }>(
      `/ideas?${qs.toString()}`
    );
  },
  get: (id: string | number) => request<any>(`/ideas/${id}`),
  create: (data: { title: string; description: string; category?: string; howIBuiltThis?: string }) =>
    request<any>("/ideas", { method: "POST", body: data }),
  upvote: (id: string | number) =>
    request<{ upvotes: number }>(`/ideas/${id}/upvote`, { method: "POST" }),
  save: (id: string | number) =>
    request<{ saved: boolean }>(`/ideas/${id}/save`, { method: "POST" }),
  report: (id: string | number) =>
    request(`/ideas/${id}/report`, { method: "POST" }),
};

// ─── Security Tools API ─────────────────────────────────
export const secToolsAPI = {
  list: () => request<{ tools: any[] }>("/security-tools"),
  execute: (name: string, input: { url?: string; text?: string; file?: File }) => {
    if (input.file) {
      const fd = new FormData();
      fd.append("file", input.file);
      return request<any>(`/security-tools/${name}/execute`, { method: "POST", body: fd, isFormData: true });
    }
    const body: any = {};
    if (input.url) body.url = input.url;
    if (input.text) body.text = input.text;
    return request<any>(`/security-tools/${name}/execute`, { method: "POST", body });
  },
};
