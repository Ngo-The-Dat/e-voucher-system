/**
 * =========================================================================================
 * FILE: admin-api.ts
 * VỊ TRÍ: frontend/src/lib/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Lớp Data Access / API Client tập trung dành riêng cho phân hệ Quản trị (Admin Portal).
 *   - Chịu trách nhiệm:
 *       1. Quản lý xác thực Bearer Token (Lấy từ localStorage hoặc Dev Token dự phòng).
 *       2. Định nghĩa hàm trung tâm `adminRequest`: Tự động đính kèm Headers, Authorization và xử lý lỗi đồng nhất (AdminApiError).
 *       3. Định nghĩa toàn bộ TypeScript Interfaces và các phương thức gọi API cho:
 *          - Người dùng (Users): getUsers, getUser, lockUser, unlockUser, changeUserRole.
 *          - Nhật ký hệ thống (Logs): getLogs, getLog.
 *          - Duyệt đối tác & nhân viên: getPendingPartners, getPendingPartnerDetail, approvePartner, rejectPartner, getPendingEmployees, approveEmployee, rejectEmployee.
 *          - Quản lý đối tác & chi nhánh: getPartners, getPartnerDetail, lockPartner, unlockPartner, createBranch, updateBranch, deleteBranch.
 *          - Duyệt & Quản lý Voucher: getPendingVouchers, getPendingVoucherDetail, approveVoucher, rejectVoucher, getManagedVouchers, getManagedVoucherDetail, updateVoucherStatus.
 *          - Quản lý đơn hàng: getOrders, getOrderDetail, cancelOrder.
 *          - Dashboard & Báo cáo: getDashboardOverview.
 *          - Quản lý truyền thông & nội dung: Banners, Popups, Content, Categories.
 * =========================================================================================
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

let isAdminRedirecting = false;

const redirectToLogin = () => {
  if (typeof window === "undefined" || isAdminRedirecting) return;

  const isProtectedAdminRoute = window.location.pathname.startsWith("/admin")
    && !window.location.pathname.startsWith("/admin/login");
  if (!isProtectedAdminRoute) return;

  isAdminRedirecting = true;
  window.location.replace("/admin/login");
};

/**
 * Lấy Bearer JWT Token của Admin từ LocalStorage
 */
const getStoredAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("admin_access_token");
  const isJwt = token !== null && token.split('.').length === 3;
  if (!isJwt) {
    localStorage.removeItem("admin_access_token");
    return null;
  }
  return token;
};

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: adminRequest
 * MỤC ĐÍCH: Hàm gọi HTTP Request dùng chung cho toàn bộ phân hệ Admin, tự động đính kèm Token và xử lý lỗi.
 * -----------------------------------------------------------------------------------------
 */
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
      localStorage.removeItem("admin_access_token");
      redirectToLogin();
      return new Promise(() => {}) as Promise<T>;
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

export interface SystemLogDetail extends SystemLogItem { }

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

export interface AdminPendingEmployeeListItem {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  identity_no?: string | null;
  gender?: string | null;
  nationality?: string | null;
  account_status: string;
  created_at: string;
  approval_request_id?: number | null;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
  reviewed_at?: string | null;
  admin_feedback?: string | null;
  branch_id: number;
  branch_name: string;
  branch_address: string;
  branch_phone?: string | null;
  partner_id: number;
  business_name: string;
  tax_code: string;
}

export interface AdminPendingEmployeeDetail extends AdminPendingEmployeeListItem {
  last_login_at?: string | null;
  reviewer_name?: string | null;
  branch_region?: string | null;
  branch_status?: string;
  brand_logo?: string | null;
  partner_activity_status?: string;
  business_license_no?: string | null;
}

export interface EmployeesResponse {
  employees: AdminPendingEmployeeListItem[];
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

export interface AdminVoucherImage {
  image_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order?: number;
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
  images?: AdminVoucherImage[];
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
  images?: AdminVoucherImage[];
}

export interface AdminManagedVoucherDetail extends AdminManagedVoucherItem {
  partner_representative?: string;
  partner_email?: string;
  partner_phone?: string | null;
  business_license_no?: string | null;
  branches?: AdminVoucherBranch[];
  used_count?: number;
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

  // Employee Approvals
  getPendingEmployees: async (params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<EmployeesResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<EmployeesResponse>(`/admin/partners/employee-approvals/pending${qs}`);
  },

  getPendingEmployee: async (id: string | number): Promise<AdminPendingEmployeeDetail> => {
    return adminRequest<AdminPendingEmployeeDetail>(`/admin/partners/employee-approvals/pending/${id}`);
  },

  approveEmployee: async (id: string | number): Promise<{ message: string; employee_id: number }> => {
    return adminRequest(`/admin/partners/employee-approvals/${id}/approve`, {
      method: "POST",
    });
  },

  rejectEmployee: async (
    id: string | number,
    reason?: string
  ): Promise<{ message: string; employee_id: number; reason?: string }> => {
    return adminRequest(`/admin/partners/employee-approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
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

  getManagedVoucher: async (programId: string | number): Promise<AdminManagedVoucherDetail> => {
    return adminRequest<AdminManagedVoucherDetail>(`/admin/vouchers/manage/${programId}`);
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

  // ─── Categories ─────────────────────────────────────────────────────────────
  getCategories: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<CategoriesResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<CategoriesResponse>(`/admin/categories${qs}`);
  },

  getCategory: async (id: string | number): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${id}`);
  },

  createCategory: async (data: {
    category_name: string;
    description?: string;
    status?: "ACTIVE" | "INACTIVE";
  }): Promise<AdminCategoryListItem> => {
    return adminRequest<AdminCategoryListItem>(`/admin/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (
    id: string | number,
    data: {
      category_name?: string;
      description?: string;
      status?: "ACTIVE" | "INACTIVE";
    }
  ): Promise<AdminCategoryListItem> => {
    return adminRequest<AdminCategoryListItem>(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id: string | number): Promise<{ message: string; category_id: number }> => {
    return adminRequest(`/admin/categories/${id}`, {
      method: "DELETE",
    });
  },

  assignVouchersToCategory: async (
    categoryId: string | number,
    programIds: number[]
  ): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${categoryId}/vouchers`, {
      method: "POST",
      body: JSON.stringify({ program_ids: programIds }),
    });
  },

  removeVoucherFromCategory: async (
    categoryId: string | number,
    programId: string | number
  ): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${categoryId}/vouchers/${programId}`, {
      method: "DELETE",
    });
  },

  // ─── Banners ────────────────────────────────────────────────────────────────
  getBanners: async (params?: {
    search?: string;
    status?: string;
    displayPosition?: string;
    page?: number;
    limit?: number;
  }): Promise<BannersResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.displayPosition && params.displayPosition !== "ALL") query.set("display_position", params.displayPosition);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<BannersResponse>(`/admin/banners${qs}`);
  },

  getBanner: async (id: string | number): Promise<AdminBannerDetail> => {
    return adminRequest<AdminBannerDetail>(`/admin/banners/${id}`);
  },

  createBanner: async (data: {
    program_id: number;
    title: string;
    image_url: string;
    target_url?: string;
    display_position?: string;
    display_from?: string;
    display_to?: string;
    status?: "ACTIVE" | "INACTIVE";
  }): Promise<AdminBannerDetail> => {
    return adminRequest<AdminBannerDetail>(`/admin/banners`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateBanner: async (
    id: string | number,
    data: {
      program_id?: number;
      title?: string;
      image_url?: string;
      target_url?: string;
      display_position?: string;
      display_from?: string;
      display_to?: string;
      status?: "ACTIVE" | "INACTIVE";
    }
  ): Promise<AdminBannerDetail> => {
    return adminRequest<AdminBannerDetail>(`/admin/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteBanner: async (id: string | number): Promise<{ message: string; banner_id: number }> => {
    return adminRequest(`/admin/banners/${id}`, {
      method: "DELETE",
    });
  },

  // ─── Popups ─────────────────────────────────────────────────────────────────
  getPopups: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PopupsResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<PopupsResponse>(`/admin/popups${qs}`);
  },

  getPopup: async (id: string | number): Promise<AdminPopupDetail> => {
    return adminRequest<AdminPopupDetail>(`/admin/popups/${id}`);
  },

  createPopup: async (data: {
    program_id: number;
    title: string;
    content?: string;
    target_url?: string;
    image_url?: string;
    start_at?: string;
    end_at?: string;
    status?: "ACTIVE" | "INACTIVE";
  }): Promise<AdminPopupDetail> => {
    return adminRequest<AdminPopupDetail>(`/admin/popups`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePopup: async (
    id: string | number,
    data: {
      program_id?: number;
      title?: string;
      content?: string;
      target_url?: string;
      image_url?: string;
      start_at?: string;
      end_at?: string;
      status?: "ACTIVE" | "INACTIVE";
    }
  ): Promise<AdminPopupDetail> => {
    return adminRequest<AdminPopupDetail>(`/admin/popups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deletePopup: async (id: string | number): Promise<{ message: string; popup_id: number }> => {
    return adminRequest(`/admin/popups/${id}`, {
      method: "DELETE",
    });
  },

  // ─── Contents / Articles ────────────────────────────────────────────────────
  getContents: async (params?: {
    search?: string;
    status?: string;
    contentType?: string;
    page?: number;
    limit?: number;
  }): Promise<ContentsResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.contentType && params.contentType !== "ALL") query.set("content_type", params.contentType);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return adminRequest<ContentsResponse>(`/admin/contents${qs}`);
  },

  getContent: async (id: string | number): Promise<AdminContentDetail> => {
    return adminRequest<AdminContentDetail>(`/admin/contents/${id}`);
  },

  createContent: async (data: {
    program_id: number;
    title: string;
    body: string;
    content_type?: "POLICY" | "ARTICLE";
    status?: "ACTIVE" | "INACTIVE";
  }): Promise<AdminContentDetail> => {
    return adminRequest<AdminContentDetail>(`/admin/contents`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateContent: async (
    id: string | number,
    data: {
      program_id?: number;
      title?: string;
      body?: string;
      content_type?: "POLICY" | "ARTICLE";
      status?: "ACTIVE" | "INACTIVE";
    }
  ): Promise<AdminContentDetail> => {
    return adminRequest<AdminContentDetail>(`/admin/contents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteContent: async (id: string | number): Promise<{ message: string; content_id: number }> => {
    return adminRequest(`/admin/contents/${id}`, {
      method: "DELETE",
    });
  },

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardOverview: async (params: DashboardQueryParams = {}): Promise<DashboardOverviewResponse> => {
    const query = new URLSearchParams();
    if (params.timeframe) query.set("timeframe", params.timeframe);
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);
    const qs = query.toString();
    return adminRequest<DashboardOverviewResponse>(`/admin/dashboard/overview${qs ? `?${qs}` : ""}`);
  },

  // ─── Voucher Options Helper ─────────────────────────────────────────────────
  getVoucherOptions: async (): Promise<{ options: VoucherProgramOption[] }> => {
    return adminRequest<{ options: VoucherProgramOption[] }>(`/admin/content/voucher-options`);
  },
};

// ─── Interfaces for Dashboard Module ────────────────────────────────────────
export interface DashboardQueryParams {
  timeframe?: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface DashboardKpiStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  color: string;
  description: string;
}

export interface DashboardEfficiencyMetric {
  title: string;
  value: string;
  rate?: number;
  description: string;
  badge?: string;
  badgeType?: "success" | "info" | "warning";
  icon: string;
  color: string;
}

export interface DashboardCategoryPerformance {
  id: string;
  name: string;
  soldCount: number;
  redeemedCount: number;
  rate: number;
  revenue: number;
}

export interface DashboardOverviewResponse {
  stats: DashboardKpiStat[];
  efficiencyMetrics: DashboardEfficiencyMetric[];
  categoryPerformance: DashboardCategoryPerformance[];
}

// ─── Interfaces for Content Module ──────────────────────────────────────────

export interface AdminCategoryListItem {
  category_id: number;
  category_name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  program_count: number;
}

export interface AdminCategoryVoucherItem {
  program_id: number;
  program_name: string;
  original_price: number;
  sale_price: number;
  display_status: string;
  sale_start_at: string;
  sale_end_at: string;
  partner_name: string;
}

export interface AdminCategoryDetail extends AdminCategoryListItem {
  vouchers: AdminCategoryVoucherItem[];
}

export interface CategoriesResponse {
  categories: AdminCategoryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminBannerListItem {
  banner_id: number;
  program_id: number;
  program_name: string;
  title: string;
  image_url: string;
  target_url: string;
  display_position: string;
  display_from: string | null;
  display_to: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminBannerDetail extends AdminBannerListItem { }

export interface BannersResponse {
  banners: AdminBannerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPopupListItem {
  popup_id: number;
  program_id: number;
  program_name: string;
  title: string;
  content: string;
  target_url: string;
  image_url: string;
  start_at: string | null;
  end_at: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminPopupDetail extends AdminPopupListItem { }

export interface PopupsResponse {
  popups: AdminPopupListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminContentListItem {
  content_id: number;
  program_id: number;
  program_name: string;
  title: string;
  body: string;
  content_type: "POLICY" | "ARTICLE";
  created_at: string;
  updated_at: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminContentDetail extends AdminContentListItem { }

export interface ContentsResponse {
  contents: AdminContentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VoucherProgramOption {
  program_id: number;
  program_name: string;
  category_id: number | null;
  category_name?: string | null;
  original_price: number;
  sale_price: number;
  display_status: string;
  partner_name: string;
}


