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

export interface AdminPartnerListItem {
  user_id: number;
  business_name: string;
  tax_code: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  activity_status: "ACTIVE" | "INACTIVE" | "LOCKED";
  registered_at: string;
  business_license_no: string | null;
  license_issue_date: string | null;
  license_issue_place: string | null;
  representative_name: string;
  email: string;
  phone: string | null;
  branches_count?: number;
  voucher_programs_count?: number;
  user_status?: string;
}

export interface AdminBranchItem {
  branch_id: number;
  branch_name: string;
  address: string;
  region: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminVoucherProgramItem {
  program_id: number;
  program_name: string;
  original_price: string | number;
  sale_price: string | number;
  issue_quantity: number;
  display_status: string;
  sale_start_at: string;
  sale_end_at: string;
}

export interface AdminPartnerDetail extends AdminPartnerListItem {
  identity_no?: string | null;
  gender?: string | null;
  nationality?: string | null;
  lock_reason?: string | null;
  branches?: AdminBranchItem[];
  voucher_programs?: AdminVoucherProgramItem[];
}

export interface PartnersResponse {
  partners: AdminPartnerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminVoucherBranch {
  branch_id: number;
  branch_name: string;
  address: string;
  region?: string | null;
  phone?: string | null;
  status?: string;
}

export interface AdminPendingVoucherItem {
  approval_request_id: number;
  program_id: number;
  submitted_at: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  admin_feedback?: string | null;
  program_name: string;
  category_id: number;
  category_name?: string | null;
  original_price: string | number;
  sale_price: string | number;
  discount_amount?: string | number;
  issue_quantity: number;
  sale_start_at: string;
  sale_end_at: string;
  use_start_at: string;
  use_end_at: string;
  display_status: string;
  partner_id: number;
  partner_name: string;
  tax_code: string;
  partner_representative: string;
  partner_email: string;
  partner_phone: string | null;
  branches?: AdminVoucherBranch[];
}

export interface AdminPendingVoucherDetail extends AdminPendingVoucherItem {
  reviewed_at?: string | null;
  admin_id?: number | null;
  business_license_no?: string | null;
}

export interface PendingVouchersResponse {
  vouchers: AdminPendingVoucherItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminManagedVoucherItem {
  program_id: number;
  program_name: string;
  category_id: number;
  category_name?: string | null;
  original_price: string | number;
  sale_price: string | number;
  discount_amount?: string | number;
  issue_quantity: number;
  sale_start_at: string;
  sale_end_at: string;
  use_start_at: string;
  use_end_at: string;
  display_status: "PUBLISHED" | "HIDDEN" | "ENDED";
  partner_id: number;
  partner_name: string;
  tax_code: string;
  branch_name: string;
  sold_count: number;
  stock: number;
}

export interface ManagedVouchersResponse {
  vouchers: AdminManagedVoucherItem[];
  stats: {
    all: number;
    published: number;
    hidden: number;
    ended: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminIssuedVoucher {
  issued_voucher_id: number;
  voucher_code: string;
  qr_code: string;
  usage_status: "UNUSED" | "USED" | "CANCELLED" | "EXPIRED";
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  applicable_region: string | null;
  discount_amount: number | string;
}

export interface AdminOrderItemDetail {
  order_item_id: number;
  order_id: number;
  program_id: number;
  quantity: number;
  unit_price: number | string;
  program_name: string;
  original_unit_price: number | string;
  partner_name: string;
  vouchers: AdminIssuedVoucher[];
}

export interface AdminOrderDetail {
  order_id: number;
  created_at: string;
  total_amount: number | string;
  payment_method: string;
  payment_status: "PAID" | "UNPAID" | "REFUNDED" | "FAILED";
  order_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  recipient_id: number | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  cancel_reason: string | null;
  cancel_at: string | null;
  cancel_admin_name: string | null;
  items: AdminOrderItemDetail[];
}

export interface AdminOrderListItem {
  order_id: number;
  created_at: string;
  total_amount: number | string;
  payment_method: string;
  payment_status: "PAID" | "UNPAID" | "REFUNDED" | "FAILED";
  order_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  recipient_id: number | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  items_count: number | string;
  total_quantity: number | string;
}

export interface AdminOrdersResponse {
  orders: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    all: number;
    completed: number;
    confirmed: number;
    pending: number;
    cancelled: number;
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

  // Partners - Pending
  getPendingPartners: async (params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<PartnersResponse>(`/admin/partners/pending${qs}`);
  },

  getPendingPartner: async (id: string | number): Promise<AdminPartnerDetail> => {
    return adminRequest<AdminPartnerDetail>(`/admin/partners/pending/${id}`);
  },

  approvePartner: async (id: string | number): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/approve`, {
      method: "POST",
    });
  },

  rejectPartner: async (
    id: string | number,
    reason?: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  },

  requestRevisionPartner: async (
    id: string | number,
    note?: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/request-revision`, {
      method: "POST",
      body: JSON.stringify({ note: note || "" }),
    });
  },

  // Partners - Managed
  getManagedPartners: async (params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<PartnersResponse>(`/admin/partners/manage${qs}`);
  },

  getManagedPartner: async (id: string | number): Promise<AdminPartnerDetail> => {
    return adminRequest<AdminPartnerDetail>(`/admin/partners/manage/${id}`);
  },

  lockPartner: async (
    id: string | number,
    reason: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  unlockPartner: async (id: string | number): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/unlock`, {
      method: "POST",
    });
  },

  // Branch Management
  createPartnerBranch: async (
    partnerId: string | number,
    data: { branch_name: string; address: string; region?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }
  ): Promise<AdminBranchItem> => {
    return adminRequest<AdminBranchItem>(`/admin/partners/${partnerId}/branches`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePartnerBranch: async (
    partnerId: string | number,
    branchId: string | number,
    data: { branch_name?: string; address?: string; region?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }
  ): Promise<AdminBranchItem> => {
    return adminRequest<AdminBranchItem>(`/admin/partners/${partnerId}/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deletePartnerBranch: async (
    partnerId: string | number,
    branchId: string | number
  ): Promise<{ message: string; branch_id: number }> => {
    return adminRequest(`/admin/partners/${partnerId}/branches/${branchId}`, {
      method: "DELETE",
    });
  },

  // Vouchers - Pending
  getPendingVouchers: async (params?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PendingVouchersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<PendingVouchersResponse>(`/admin/vouchers/pending${qs}`);
  },

  getPendingVoucher: async (requestId: string | number): Promise<AdminPendingVoucherDetail> => {
    return adminRequest<AdminPendingVoucherDetail>(`/admin/vouchers/pending/${requestId}`);
  },

  approveVoucher: async (
    requestId: string | number
  ): Promise<{ message: string; approval_request_id: number; program_id: number }> => {
    return adminRequest(`/admin/vouchers/pending/${requestId}/approve`, {
      method: "POST",
    });
  },

  rejectVoucher: async (
    requestId: string | number,
    reason: string
  ): Promise<{ message: string; approval_request_id: number; program_id: number }> => {
    return adminRequest(`/admin/vouchers/pending/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Vouchers - Managed
  getManagedVouchers: async (params?: {
    search?: string;
    status?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
  }): Promise<ManagedVouchersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.categoryId) query.set("category_id", String(params.categoryId));
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<ManagedVouchersResponse>(`/admin/vouchers/manage${qs}`);
  },

  updateVoucherStatus: async (
    programId: string | number,
    status: "PUBLISHED" | "HIDDEN" | "ENDED"
  ): Promise<{ message: string; program_id: number; display_status: string }> => {
    return adminRequest(`/admin/vouchers/${programId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Orders
  getOrders: async (params?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminOrdersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.orderStatus && params.orderStatus !== "ALL") query.set("order_status", params.orderStatus);
    if (params?.paymentStatus && params.paymentStatus !== "ALL") query.set("payment_status", params.paymentStatus);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<AdminOrdersResponse>(`/admin/orders${qs}`);
  },

  getOrder: async (orderId: string | number): Promise<AdminOrderDetail> => {
    return adminRequest<AdminOrderDetail>(`/admin/orders/${orderId}`);
  },

  cancelOrder: async (
    orderId: string | number,
    reason: string
  ): Promise<{ success: boolean; message: string; order_id: number; order_status: string; payment_status: string }> => {
    return adminRequest(`/admin/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};

