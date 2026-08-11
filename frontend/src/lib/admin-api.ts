const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AdminUserListItem {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  gender: string | null;
  nationality: string | null;
  identity_no: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  lock_reason: string | null;
  business_name?: string | null;
  tax_code?: string | null;
}

export interface UsersResponse {
  users: AdminUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_DEV_ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiZW1haWwiOiJhZG1pbjFAdm91Y2hlci52biIsImlhdCI6MTc4NjQyMzcyMCwiZXhwIjoxNzg5MDE1NzIwfQ.XsTBJRntIyXgZJXSxG6c0OrosYN_PrrJsHYi5df9pV8";

const getStoredAdminToken = (): string | null => {
  if (typeof window === "undefined") return DEFAULT_DEV_ADMIN_TOKEN;
  let token = localStorage.getItem("admin_access_token") || localStorage.getItem("token");
  if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    token = DEFAULT_DEV_ADMIN_TOKEN;
    localStorage.setItem("admin_access_token", token);
  }
  return token;
};

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAdminToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.setItem("admin_access_token", DEFAULT_DEV_ADMIN_TOKEN);
    }
    throw new AdminApiError(response.status, body.message ?? "Không thể kết nối đến máy chủ.");
  }
  return body as T;
}

export interface SystemLogItem {
  log_id: string;
  user_id: string;
  user_name: string;
  user_role?: string;
  action: string;
  object_id: string | null;
  object_type: string | null;
  old_value: any;
  new_value: any;
  performed_at: string;
  result: "SUCCESS" | "FAILED";
}

export interface SystemLogDetail extends SystemLogItem {}

export interface LogsResponse {
  logs: SystemLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminApi = {
  // Users
  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<UsersResponse>(`/admin/users${qs}`);
  },

  getUser: async (id: string | number): Promise<AdminUserDetail> => {
    return adminRequest<AdminUserDetail>(`/admin/users/${id}`);
  },

  lockUser: async (id: string | number, reason: string): Promise<{ message: string; user_id: number }> => {
    return adminRequest(`/admin/users/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  unlockUser: async (id: string | number): Promise<{ message: string; user_id: number }> => {
    return adminRequest(`/admin/users/${id}/unlock`, {
      method: "POST",
    });
  },

  changeUserRole: async (
    id: string | number,
    role: string
  ): Promise<{ message: string; user_id: number; role: string }> => {
    return adminRequest(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  // System Logs
  getLogs: async (params?: {
    search?: string;
    objectType?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<LogsResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.objectType && params.objectType !== "ALL") query.set("object_type", params.objectType);
    if (params?.result && params.result !== "ALL") query.set("result", params.result);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<LogsResponse>(`/admin/logs${qs}`);
  },

  getLog: async (id: string | number): Promise<SystemLogDetail> => {
    return adminRequest<SystemLogDetail>(`/admin/logs/${id}`);
  },
};
