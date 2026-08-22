/**
 * =========================================================================================
 * FILE: admin-api.ts
 * VỊ TRÍ: frontend/src/lib/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Lớp Data Access / API Client tập trung dành riêng cho phân hệ Quản trị (Admin Portal).
 *   - Đóng vai trò là cầu nối giao tiếp HTTP giữa Giao diện Admin (Next.js) và Backend API.
 * 
 * NGUYÊN LÝ HOẠT ĐỘNG:
 *   1. Quản lý xác thực Bearer JWT Token: Tự động trích xuất token từ localStorage, kiểm tra tính hợp lệ.
 *   2. Hàm trung tâm `adminRequest`: Đính kèm Headers (JSON, Auth Token), thực hiện gọi fetch và bắt lỗi.
 *   3. Cơ chế bảo vệ phiên làm việc (Session Guard): Tự động xóa token và chuyển hướng về `/admin/login` khi nhận lỗi 401 Unauthorized.
 *   4. Đóng gói đầy đủ các hàm API theo từng module chức năng nghiệp vụ quản trị.
 * =========================================================================================
 */

import {
  AdminUserListItem,
  AdminUserDetail,
  UsersResponse,
  SystemLogItem,
  SystemLogDetail,
  LogsResponse,
} from "./types/admin-user";

import {
  AdminPartnerListItem,
  AdminBranchItem,
  AdminVoucherProgramItem,
  AdminPartnerDetail,
  PartnersResponse,
  AdminPendingEmployeeListItem,
  AdminPendingEmployeeDetail,
  EmployeesResponse,
} from "./types/admin-partner";

import {
  AdminVoucherBranch,
  AdminVoucherImage,
  AdminPendingVoucherItem,
  AdminPendingVoucherDetail,
  PendingVouchersResponse,
  AdminManagedVoucherItem,
  AdminManagedVoucherDetail,
  ManagedVouchersResponse,
} from "./types/admin-voucher";

import {
  AdminIssuedVoucher,
  AdminOrderItemDetail,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrdersResponse,
} from "./types/admin-order";

import {
  DashboardQueryParams,
  DashboardKpiStat,
  DashboardEfficiencyMetric,
  DashboardCategoryPerformance,
  DashboardOverviewResponse,
  AdminCategoryListItem,
  AdminCategoryVoucherItem,
  AdminCategoryDetail,
  CategoriesResponse,
  AdminBannerListItem,
  AdminBannerDetail,
  BannersResponse,
  AdminPopupListItem,
  AdminPopupDetail,
  PopupsResponse,
  AdminContentListItem,
  AdminContentDetail,
  ContentsResponse,
  VoucherProgramOption,
} from "./types/admin-content";
import {
  AdminProfile,
  UpdateAdminProfilePayload,
  ChangeAdminPasswordPayload,
} from "./types/admin-profile";

// Re-export toàn bộ types để các components / pages đang import từ '@/lib/admin-api' không bị ảnh hưởng
export * from "./types/admin-user";
export * from "./types/admin-partner";
export * from "./types/admin-voucher";
export * from "./types/admin-order";
export * from "./types/admin-content";
export * from "./types/admin-profile";

/** URL gốc của máy chủ Backend API (lấy từ biến môi trường .env) */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Lớp lỗi tùy chỉnh (Custom Exception) cho API Quản trị.
 * Kế thừa từ Error chuẩn để bổ sung thêm mã trạng thái HTTP (status: 400, 401, 403, 404, 500,...).
 * Giúp các Hook/Component bắt lỗi (try/catch) và hiển thị thông báo chính xác cho Admin.
 */
export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Biến cờ hiệu ngăn chặn việc gọi chuyển hướng đăng nhập lặp vô tận (infinite loop) */
let isAdminRedirecting = false;

/**
 * Hàm điều hướng về trang Đăng nhập Admin (`/admin/login`).
 * Được kích hoạt tự động khi phiên làm việc hết hạn hoặc token không hợp lệ (mã lỗi 401 Unauthorized).
 * Chỉ kích hoạt nếu trình duyệt đang ở các route yêu cầu quyền quản trị (`/admin/...`).
 */
const redirectToLogin = () => {
  if (typeof window === "undefined" || isAdminRedirecting) return;

  const isProtectedAdminRoute = window.location.pathname.startsWith("/admin")
    && !window.location.pathname.startsWith("/admin/login");
  if (!isProtectedAdminRoute) return;

  isAdminRedirecting = true;
  window.location.replace("/admin/login");
};

/**
 * Lấy Bearer JWT Token của Admin từ bộ nhớ trình duyệt (LocalStorage).
 * Thực hiện kiểm tra định dạng cấu trúc JWT (gồm đúng 3 phần ngăn cách bởi dấu chấm: Header.Payload.Signature).
 * Nếu token không đúng định dạng hoặc bị hỏng, tự động xóa bỏ khỏi localStorage để bảo đảm an toàn.
 * 
 * @returns Chuỗi JWT token hợp lệ hoặc null nếu chưa đăng nhập.
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
 * Hàm gọi HTTP Request trung tâm dùng chung cho toàn bộ phân hệ Admin.
 * 
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tự động lấy JWT token từ LocalStorage và đính kèm vào Header `Authorization: Bearer <token>`.
 * 2. Tự động đặt Header `Content-Type: application/json` khi có dữ liệu body gửi đi.
 * 3. Bắt lỗi HTTP 401 (Unauthorized): Xóa token hết hạn và chuyển hướng về trang đăng nhập.
 * 4. Ném lỗi `AdminApiError` chuẩn hóa khi Backend trả về mã lỗi HTTP không thành công (!response.ok).
 * 5. Parse và trả về dữ liệu kiểu generic `T` tương ứng với DTO mong muốn.
 * 
 * @template T Kiểu dữ liệu trả về từ API response
 * @param path Đường dẫn endpoint tương đối (ví dụ: `/admin/users`)
 * @param init Cấu hình bổ sung cho hàm fetch (method, body, headers,...)
 * @returns Promise chứa dữ liệu kiểu T
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

/**
 * Đối tượng chứa toàn bộ các hàm gọi API của Phân hệ Quản trị Admin.
 * Được phân nhóm theo từng nghiệp vụ quản lý rõ ràng.
 */
export const adminApi = {

  // =========================================================================
  // 1. QUẢN LÝ NGƯỜI DÙNG (USERS MANAGEMENT)
  // =========================================================================

  /**
   * Lấy danh sách người dùng có phân trang và bộ lọc tìm kiếm.
   * Method: GET `/admin/users?search=...&role=...&status=...&page=1&limit=10`
   * 
   * @param params Tham số lọc: từ khóa tìm kiếm, vai trò (ADMIN, PARTNER, CUSTOMER), trạng thái (ACTIVE, LOCKED), trang, giới hạn số lượng.
   * @returns Danh sách người dùng cùng thông tin phân trang (UsersResponse).
   */
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

  /**
   * Lấy thông tin chi tiết một người dùng theo ID.
   * Method: GET `/admin/users/:id`
   * 
   * @param id Mã định danh người dùng (user_id).
   * @returns Chi tiết người dùng bao gồm thông tin doanh nghiệp, lý do khóa nếu có (AdminUserDetail).
   */
  getUser: async (id: string | number): Promise<AdminUserDetail> => {
    return adminRequest<AdminUserDetail>(`/admin/users/${id}`);
  },

  /**
   * Khóa tài khoản người dùng và ghi nhận lý do khóa.
   * Method: POST `/admin/users/:id/lock`
   * 
   * @param id Mã người dùng cần khóa.
   * @param reason Lý do khóa tài khoản (bắt buộc nhập để lưu vết kiểm toán).
   */
  lockUser: async (id: string | number, reason: string): Promise<{ message: string; user_id: number }> => {
    return adminRequest(`/admin/users/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Mở khóa tài khoản người dùng, khôi phục quyền truy cập hệ thống.
   * Method: POST `/admin/users/:id/unlock`
   * 
   * @param id Mã người dùng cần mở khóa.
   */
  unlockUser: async (id: string | number): Promise<{ message: string; user_id: number }> => {
    return adminRequest(`/admin/users/${id}/unlock`, {
      method: "POST",
    });
  },

  /**
   * Thay đổi vai trò (Role) của người dùng trong hệ thống (ADMIN, PARTNER, CUSTOMER, PARTNER_EMPLOYEE).
   * Method: PUT `/admin/users/:id/role`
   * 
   * @param id Mã người dùng.
   * @param role Vai trò mới muốn gán cho tài khoản.
   */
  changeUserRole: async (
    id: string | number,
    role: string
  ): Promise<{ message: string; user_id: number; role: string }> => {
    return adminRequest(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  // =========================================================================
  // 2. NHẬT KÝ HỆ THỐNG (SYSTEM AUDIT LOGS)
  // =========================================================================

  /**
   * Lấy danh sách nhật ký hành động (Audit Logs) của hệ thống để tra cứu bảo mật.
   * Method: GET `/admin/logs?search=...&object_type=...&result=...&start_date=...&end_date=...`
   * 
   * @param params Bộ lọc nhật ký: từ khóa, loại đối tượng (USER, VOUCHER, ORDER,...), kết quả (SUCCESS, FAILED), khoảng thời gian, phân trang.
   * @returns Danh sách các dòng nhật ký thao tác (LogsResponse).
   */
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

  /**
   * Xem chi tiết một bản ghi nhật ký hệ thống (bao gồm giá trị cũ `old_value` và giá trị mới `new_value`).
   * Method: GET `/admin/logs/:id`
   * 
   * @param id Mã bản ghi nhật ký (log_id).
   */
  getLog: async (id: string | number): Promise<SystemLogDetail> => {
    return adminRequest<SystemLogDetail>(`/admin/logs/${id}`);
  },

  // =========================================================================
  // 3. PHÊ DUYỆT NHÂN VIÊN CHI NHÁNH ĐỐI TÁC (EMPLOYEE APPROVALS)
  // =========================================================================

  /**
   * Lấy danh sách yêu cầu đăng ký tài khoản nhân viên chi nhánh đang chờ Admin phê duyệt.
   * Method: GET `/admin/partners/employee-approvals/pending`
   * 
   * @param params Bộ lọc tìm kiếm, trạng thái duyệt, thời gian gửi, phân trang.
   */
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

  /**
   * Xem hồ sơ chi tiết của nhân viên chi nhánh đang chờ duyệt kèm thông tin doanh nghiệp và chi nhánh trực thuộc.
   * Method: GET `/admin/partners/employee-approvals/pending/:id`
   * 
   * @param id Mã yêu cầu duyệt hoặc user_id của nhân viên.
   */
  getPendingEmployee: async (id: string | number): Promise<AdminPendingEmployeeDetail> => {
    return adminRequest<AdminPendingEmployeeDetail>(`/admin/partners/employee-approvals/pending/${id}`);
  },

  /**
   * Phê duyệt hồ sơ nhân viên chi nhánh, cấp quyền đăng nhập và quét đổi voucher tại quầy.
   * Method: POST `/admin/partners/employee-approvals/:id/approve`
   * 
   * @param id Mã yêu cầu duyệt của nhân viên.
   */
  approveEmployee: async (id: string | number): Promise<{ message: string; employee_id: number }> => {
    return adminRequest(`/admin/partners/employee-approvals/${id}/approve`, {
      method: "POST",
    });
  },

  /**
   * Từ chối hồ sơ nhân viên chi nhánh kèm lý do phản hồi.
   * Method: POST `/admin/partners/employee-approvals/:id/reject`
   * 
   * @param id Mã yêu cầu duyệt của nhân viên.
   * @param reason Lý do từ chối để gửi thông báo cho Đối tác.
   */
  rejectEmployee: async (
    id: string | number,
    reason?: string
  ): Promise<{ message: string; employee_id: number; reason?: string }> => {
    return adminRequest(`/admin/partners/employee-approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  },

  // =========================================================================
  // 4. PHÊ DUYỆT HỒ SƠ ĐỐI TÁC DOANH NGHIỆP (PARTNER ONBOARDING APPROVALS)
  // =========================================================================

  /**
   * Lấy danh sách hồ sơ doanh nghiệp đối tác mới đăng ký đang chờ xét duyệt pháp lý.
   * Method: GET `/admin/partners/pending`
   * 
   * @param params Bộ lọc tìm kiếm tên công ty, mã số thuế, khoảng thời gian đăng ký.
   */
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

  /**
   * Xem toàn bộ hồ sơ pháp lý, giấy phép kinh doanh và người đại diện của đối tác chờ duyệt.
   * Method: GET `/admin/partners/pending/:id`
   * 
   * @param id Mã đối tác (partner_id / user_id).
   */
  getPendingPartner: async (id: string | number): Promise<AdminPartnerDetail> => {
    return adminRequest<AdminPartnerDetail>(`/admin/partners/pending/${id}`);
  },

  /**
   * Phê duyệt hồ sơ đối tác, kích hoạt tài khoản để đối tác có thể tạo chiến dịch voucher.
   * Method: POST `/admin/partners/:id/approve`
   * 
   * @param id Mã đối tác cần duyệt.
   */
  approvePartner: async (id: string | number): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/approve`, {
      method: "POST",
    });
  },

  /**
   * Từ chối hồ sơ đối tác không hợp lệ.
   * Method: POST `/admin/partners/:id/reject`
   * 
   * @param id Mã đối tác.
   * @param reason Lý do từ chối hồ sơ.
   */
  rejectPartner: async (
    id: string | number,
    reason?: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  },

  /**
   * Yêu cầu đối tác chỉnh sửa, bổ sung thông tin hoặc hình ảnh giấy phép kinh doanh.
   * Method: POST `/admin/partners/:id/request-revision`
   * 
   * @param id Mã đối tác.
   * @param note Ghi chú chi tiết các mục cần bổ sung.
   */
  requestRevisionPartner: async (
    id: string | number,
    note?: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/request-revision`, {
      method: "POST",
      body: JSON.stringify({ note: note || "" }),
    });
  },

  // =========================================================================
  // 5. QUẢN LÝ ĐỐI TÁC & CHI NHÁNH (PARTNERS & BRANCHES MANAGEMENT)
  // =========================================================================

  /**
   * Lấy danh sách các đối tác đã chính thức hoạt động trong hệ thống.
   * Method: GET `/admin/partners/manage`
   */
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

  /**
   * Lấy chi tiết thông tin đối tác đang quản lý (bao gồm danh sách chi nhánh và chương trình voucher).
   * Method: GET `/admin/partners/manage/:id`
   */
  getManagedPartner: async (id: string | number): Promise<AdminPartnerDetail> => {
    return adminRequest<AdminPartnerDetail>(`/admin/partners/manage/${id}`);
  },

  /**
   * Khóa hoạt động của doanh nghiệp đối tác khi có vi phạm điều khoản.
   * Method: POST `/admin/partners/:id/lock`
   */
  lockPartner: async (
    id: string | number,
    reason: string
  ): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Mở khóa hoạt động cho đối tác kinh doanh.
   * Method: POST `/admin/partners/:id/unlock`
   */
  unlockPartner: async (id: string | number): Promise<{ message: string; partner_id: number }> => {
    return adminRequest(`/admin/partners/${id}/unlock`, {
      method: "POST",
    });
  },

  /**
   * Thêm mới một chi nhánh áp dụng voucher cho đối tác.
   * Method: POST `/admin/partners/:partnerId/branches`
   */
  createPartnerBranch: async (
    partnerId: string | number,
    data: { branch_name: string; address: string; region?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }
  ): Promise<AdminBranchItem> => {
    return adminRequest<AdminBranchItem>(`/admin/partners/${partnerId}/branches`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Cập nhật thông tin chi nhánh đối tác (tên chi nhánh, địa chỉ, khu vực, hotline).
   * Method: PUT `/admin/partners/:partnerId/branches/:branchId`
   */
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

  /**
   * Xóa một chi nhánh của đối tác.
   * Method: DELETE `/admin/partners/:partnerId/branches/:branchId`
   */
  deletePartnerBranch: async (
    partnerId: string | number,
    branchId: string | number
  ): Promise<{ message: string; branch_id: number }> => {
    return adminRequest(`/admin/partners/${partnerId}/branches/${branchId}`, {
      method: "DELETE",
    });
  },

  // =========================================================================
  // 6. PHÊ DUYỆT CHIẾN DỊCH VOUCHER (VOUCHER APPROVALS)
  // =========================================================================

  /**
   * Lấy danh sách các chiến dịch Voucher do Đối tác tạo đang chờ Admin duyệt trước khi mở bán.
   * Method: GET `/admin/vouchers/pending`
   */
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

  /**
   * Xem nội dung chi tiết chiến dịch voucher gửi duyệt (hình ảnh, giá bán, thời hạn, điều khoản sử dụng).
   * Method: GET `/admin/vouchers/pending/:requestId`
   */
  getPendingVoucher: async (requestId: string | number): Promise<AdminPendingVoucherDetail> => {
    return adminRequest<AdminPendingVoucherDetail>(`/admin/vouchers/pending/${requestId}`);
  },

  /**
   * Phê duyệt chiến dịch voucher, cho phép hiển thị và mở bán trên sàn E-Voucher.
   * Method: POST `/admin/vouchers/pending/:requestId/approve`
   */
  approveVoucher: async (
    requestId: string | number
  ): Promise<{ message: string; approval_request_id: number; program_id: number }> => {
    return adminRequest(`/admin/vouchers/pending/${requestId}/approve`, {
      method: "POST",
    });
  },

  /**
   * Từ chối duyệt chiến dịch voucher và gửi lý do phản hồi cho đối tác chỉnh sửa.
   * Method: POST `/admin/vouchers/pending/:requestId/reject`
   */
  rejectVoucher: async (
    requestId: string | number,
    reason: string
  ): Promise<{ message: string; approval_request_id: number; program_id: number }> => {
    return adminRequest(`/admin/vouchers/pending/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // =========================================================================
  // 7. QUẢN LÝ VOUCHER ĐANG PHÁT HÀNH (MANAGED VOUCHERS)
  // =========================================================================

  /**
   * Lấy danh sách toàn bộ voucher đã được duyệt trên toàn sàn, theo dõi số lượng tồn kho và đã bán.
   * Method: GET `/admin/vouchers/manage`
   */
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

  /**
   * Xem thông tin chi tiết một chiến dịch voucher đang quản lý.
   * Method: GET `/admin/vouchers/manage/:programId`
   */
  getManagedVoucher: async (programId: string | number): Promise<AdminManagedVoucherDetail> => {
    return adminRequest<AdminManagedVoucherDetail>(`/admin/vouchers/manage/${programId}`);
  },

  /**
   * Cập nhật trạng thái hiển thị của voucher trên sàn (PUBLISHED: Đang hiển thị mở bán, HIDDEN: Tạm ẩn, ENDED: Kết thúc sớm).
   * Method: PUT `/admin/vouchers/:programId/status`
   */
  updateVoucherStatus: async (
    programId: string | number,
    status: "PUBLISHED" | "HIDDEN" | "ENDED"
  ): Promise<{ message: string; program_id: number; display_status: string }> => {
    return adminRequest(`/admin/vouchers/${programId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // =========================================================================
  // 8. QUẢN LÝ ĐƠN HÀNG (ORDERS MANAGEMENT)
  // =========================================================================

  /**
   * Lấy danh sách các đơn đặt mua voucher của khách hàng có phân trang và bộ lọc trạng thái đơn / thanh toán.
   * Method: GET `/admin/orders`
   */
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

  /**
   * Lấy chi tiết đơn hàng (người mua, phương thức thanh toán, danh sách mã voucher cá nhân kèm mã QR đã phát hành).
   * Method: GET `/admin/orders/:orderId`
   */
  getOrder: async (orderId: string | number): Promise<AdminOrderDetail> => {
    return adminRequest<AdminOrderDetail>(`/admin/orders/${orderId}`);
  },

  /**
   * Hủy đơn hàng và vô hiệu hóa các mã voucher phát hành theo đơn.
   * Method: POST `/admin/orders/:orderId/cancel`
   * 
   * @param orderId Mã đơn hàng cần hủy.
   * @param reason Lý do hủy đơn (ví dụ: Khách yêu cầu hoàn tiền, gian lận thanh toán,...).
   */
  cancelOrder: async (
    orderId: string | number,
    reason: string
  ): Promise<{ success: boolean; message: string; order_id: number; order_status: string; payment_status: string }> => {
    return adminRequest(`/admin/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // =========================================================================
  // 9. QUẢN LÝ DANH MỤC NGÀNH HÀNG (CATEGORIES)
  // =========================================================================

  /**
   * Lấy danh sách danh mục ngành hàng (Ẩm thực, Spa, Du lịch, Giải trí,...) kèm số lượng voucher trong mỗi danh mục.
   * Method: GET `/admin/categories`
   */
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

  /**
   * Xem chi tiết danh mục kèm danh sách các voucher thuộc danh mục đó.
   * Method: GET `/admin/categories/:id`
   */
  getCategory: async (id: string | number): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${id}`);
  },

  /**
   * Tạo mới danh mục ngành hàng.
   * Method: POST `/admin/categories`
   */
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

  /**
   * Cập nhật thông tin danh mục ngành hàng.
   * Method: PUT `/admin/categories/:id`
   */
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

  /**
   * Xóa danh mục ngành hàng.
   * Method: DELETE `/admin/categories/:id`
   */
  deleteCategory: async (id: string | number): Promise<{ message: string; category_id: number }> => {
    return adminRequest(`/admin/categories/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Gán hàng loạt voucher vào danh mục đã chọn.
   * Method: POST `/admin/categories/:categoryId/vouchers`
   */
  assignVouchersToCategory: async (
    categoryId: string | number,
    programIds: number[]
  ): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${categoryId}/vouchers`, {
      method: "POST",
      body: JSON.stringify({ program_ids: programIds }),
    });
  },

  /**
   * Gỡ bỏ một voucher ra khỏi danh mục.
   * Method: DELETE `/admin/categories/:categoryId/vouchers/:programId`
   */
  removeVoucherFromCategory: async (
    categoryId: string | number,
    programId: string | number
  ): Promise<AdminCategoryDetail> => {
    return adminRequest<AdminCategoryDetail>(`/admin/categories/${categoryId}/vouchers/${programId}`, {
      method: "DELETE",
    });
  },

  // =========================================================================
  // 10. QUẢN LÝ BANNER QUẢNG CÁO TRANG CHỦ (BANNERS)
  // =========================================================================

  /**
   * Lấy danh sách banner quảng cáo (Hero Slider, Middle Banner, Sidebar,...).
   * Method: GET `/admin/banners`
   */
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

  /**
   * Xem chi tiết một banner quảng cáo.
   * Method: GET `/admin/banners/:id`
   */
  getBanner: async (id: string | number): Promise<AdminBannerDetail> => {
    return adminRequest<AdminBannerDetail>(`/admin/banners/${id}`);
  },

  /**
   * Tạo mới banner quảng cáo liên kết với chương trình voucher hoặc link sự kiện.
   * Method: POST `/admin/banners`
   */
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

  /**
   * Cập nhật thông tin, hình ảnh hoặc vị trí hiển thị banner.
   * Method: PUT `/admin/banners/:id`
   */
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

  /**
   * Xóa banner quảng cáo.
   * Method: DELETE `/admin/banners/:id`
   */
  deleteBanner: async (id: string | number): Promise<{ message: string; banner_id: number }> => {
    return adminRequest(`/admin/banners/${id}`, {
      method: "DELETE",
    });
  },

  // =========================================================================
  // 11. QUẢN LÝ POPUP QUẢNG CÁO KHUYẾN MÃI (POPUPS)
  // =========================================================================

  /**
   * Lấy danh sách các popup sự kiện / khuyến mãi nổi bật.
   * Method: GET `/admin/popups`
   */
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

  /**
   * Xem chi tiết thông tin cấu hình popup.
   * Method: GET `/admin/popups/:id`
   */
  getPopup: async (id: string | number): Promise<AdminPopupDetail> => {
    return adminRequest<AdminPopupDetail>(`/admin/popups/${id}`);
  },

  /**
   * Tạo mới popup quảng cáo bật lên khi người dùng truy cập website.
   * Method: POST `/admin/popups`
   */
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

  /**
   * Cập nhật thời gian hiển thị hoặc nội dung popup.
   * Method: PUT `/admin/popups/:id`
   */
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

  /**
   * Xóa popup.
   * Method: DELETE `/admin/popups/:id`
   */
  deletePopup: async (id: string | number): Promise<{ message: string; popup_id: number }> => {
    return adminRequest(`/admin/popups/${id}`, {
      method: "DELETE",
    });
  },

  // =========================================================================
  // 12. QUẢN LÝ BÀI VIẾT & CHÍNH SÁCH (CONTENT & ARTICLES)
  // =========================================================================

  /**
   * Lấy danh sách các bài viết tin tức, hướng dẫn hoặc điều khoản chính sách.
   * Method: GET `/admin/contents`
   */
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

  /**
   * Xem nội dung chi tiết bài viết hoặc chính sách.
   * Method: GET `/admin/contents/:id`
   */
  getContent: async (id: string | number): Promise<AdminContentDetail> => {
    return adminRequest<AdminContentDetail>(`/admin/contents/${id}`);
  },

  /**
   * Tạo mới bài viết hoặc điều khoản chính sách.
   * Method: POST `/admin/contents`
   */
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

  /**
   * Cập nhật nội dung bài viết hoặc chính sách.
   * Method: PUT `/admin/contents/:id`
   */
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

  /**
   * Xóa bài viết / chính sách.
   * Method: DELETE `/admin/contents/:id`
   */
  deleteContent: async (id: string | number): Promise<{ message: string; content_id: number }> => {
    return adminRequest(`/admin/contents/${id}`, {
      method: "DELETE",
    });
  },

  // =========================================================================
  // 13. TỔNG QUAN DASHBOARD & BÁO CÁO THỐNG KÊ (DASHBOARD ANALYTICS)
  // =========================================================================

  /**
   * Lấy dữ liệu tổng quan Dashboard Admin: chỉ số KPI doanh thu, số voucher bán ra, tỷ lệ quy đổi (redeem rate), hiệu quả từng danh mục.
   * Method: GET `/admin/dashboard/overview?timeframe=today|week|month|custom&start_date=...&end_date=...`
   * 
   * @param params Khung thời gian cần thống kê.
   * @returns Báo cáo tổng hợp DashboardOverviewResponse.
   */
  getDashboardOverview: async (params: DashboardQueryParams = {}): Promise<DashboardOverviewResponse> => {
    const query = new URLSearchParams();
    if (params.timeframe) query.set("timeframe", params.timeframe);
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);
    const qs = query.toString();
    return adminRequest<DashboardOverviewResponse>(`/admin/dashboard/overview${qs ? `?${qs}` : ""}`);
  },

  // =========================================================================
  // 14. TIỆN ÍCH TRỢ GIÚP (HELPERS)
  // =========================================================================

  /**
   * Lấy danh sách tóm tắt các Voucher đang hoạt động để làm dropdown chọn Voucher khi tạo Banner/Popup.
   * Method: GET `/admin/content/voucher-options`
   */
  getVoucherOptions: async (): Promise<{ options: VoucherProgramOption[] }> => {
    return adminRequest<{ options: VoucherProgramOption[] }>(`/admin/content/voucher-options`);
  },

  // =========================================================================
  // 15. HỒ SƠ & BẢO MẬT QUẢN TRỊ VIÊN (ADMIN PROFILE & SECURITY)
  // =========================================================================

  /**
   * Lấy thông tin chi tiết hồ sơ cá nhân của Quản trị viên đang đăng nhập.
   * Method: GET `/admin/profile`
   */
  getProfile: async (): Promise<AdminProfile> => {
    return adminRequest<AdminProfile>(`/admin/profile`);
  },

  /**
   * Cập nhật thông tin cá nhân của Quản trị viên (Họ tên, SĐT, giới tính, quốc tịch, CCCD).
   * Method: PUT `/admin/profile`
   * 
   * @param payload Dữ liệu thông tin cá nhân cần cập nhật.
   */
  updateProfile: async (payload: UpdateAdminProfilePayload): Promise<AdminProfile> => {
    return adminRequest<AdminProfile>(`/admin/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Đổi mật khẩu tài khoản Quản trị viên.
   * Method: PUT `/admin/profile/change-password`
   * 
   * @param payload Mật khẩu cũ và mật khẩu mới.
   */
  changePassword: async (payload: ChangeAdminPasswordPayload): Promise<{ message: string }> => {
    return adminRequest<{ message: string }>(`/admin/profile/change-password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
