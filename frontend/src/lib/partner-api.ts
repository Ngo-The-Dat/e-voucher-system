/**
 * @file partner-api.ts
 * @description Client API SDK phía Frontend tích hợp toàn bộ các dịch vụ Backend dành cho:
 * 1. Xác thực Đối tác: Đăng ký, đăng nhập, gửi OTP, xác thực OTP email.
 * 2. Hồ sơ Doanh nghiệp & Chi nhánh: Lấy thông tin, cập nhật pháp lý, upload logo R2, quản lý chi nhánh.
 * 3. Chiến dịch Voucher & Bộ sưu tập ảnh: Tạo voucher, sửa, xóa, upload ảnh, sắp xếp ảnh, gửi duyệt.
 * 4. Tra cứu & Đổi Voucher (Redeem): Tra cứu theo mã hoặc QR, xác nhận đổi tại quầy chi nhánh.
 * 5. Cổng Nhân viên chi nhánh (Employee Portal): Thông tin cá nhân, cập nhật hồ sơ, đổi mật khẩu.
 * 6. Quản trị Nhân sự chi nhánh (Partner Employee Management): Đối tác xem danh sách, tạo mới, chỉnh sửa nhân viên.
 * 
 * Tự động gắn Bearer JWT token và xử lý điều hướng khi hết hạn phiên đăng nhập (401 Unauthorized).
 */

import { Branch, PartnerProfile } from "./types/partner-profile";
import { CategoryOption, CreateVoucherInput, VoucherImage, VoucherItem } from "./types/partner-voucher";
import { EmployeeProfile, PartnerEmployeeItem, CreateEmployeePayload } from "./types/partner-employee";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Lớp lỗi chuẩn hóa cho các API call đối tác.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
    public retryAfter?: number,
  ) { super(message); }
}

let isRedirectingToLogin = false;

/**
 * Tự động chuyển hướng về trang đăng nhập đối tác khi phiên làm việc hết hạn hoặc không hợp lệ.
 */
const redirectToPartnerLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) return;

  const isProtectedPartnerRoute = window.location.pathname.startsWith("/partner")
    && !window.location.pathname.startsWith("/login")
    && !window.location.pathname.startsWith("/register");
  if (!isProtectedPartnerRoute) return;

  isRedirectingToLogin = true;
  window.location.replace("/login");
};

/**
 * Lấy Access Token đã lưu trong localStorage của trình duyệt.
 */
const getStoredPartnerToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("partner_access_token");
  const isJwt = token !== null && token.split('.').length === 3;
  if (!isJwt) {
    localStorage.removeItem("partner_access_token");
    return null;
  }

  return token;
};

/**
 * Hàm gọi API wrapper dùng chung:
 * Tự động inject header Content-Type và Authorization token, bắt lỗi HTTP status != 2xx.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredPartnerToken();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as {
    message?: string;
    field?: string;
    retry_after?: number;
  };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("partner_access_token");
      redirectToPartnerLogin();
      return new Promise(() => { }) as Promise<T>;
    }
    throw new ApiError(
      response.status,
      body.message ?? "Không thể kết nối đến máy chủ.",
      body.field,
      body.retry_after,
    );
  }
  return body as T;
}

/** Chuyển đổi định dạng ngày sang YYYY-MM-DD cho input HTML */
const dateInput = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value.slice(0, 10);
};

/** Ánh xạ dữ liệu thô từ backend sang kiểu Branch */
const mapBranch = (row: any): Branch => ({
  id: String(row.branch_id), name: row.branch_name, address: row.address,
  region: row.region ?? "", phone: row.phone ?? "",
  status: row.status === "ACTIVE" ? "active" : "inactive",
});

/** Ánh xạ dữ liệu thô từ backend sang kiểu VoucherItem */
const mapVoucher = (row: any): VoucherItem => ({
  id: String(row.program_id), code: String(row.program_id), title: row.program_name,
  categoryId: String(row.category_id), categoryName: row.category_name ?? "",
  branchIds: (row.branch_ids ?? []).map(String), branchNames: row.branch_names ?? [],
  originalPrice: Number(row.original_price), sellingPrice: Number(row.sale_price ?? row.selling_price),
  discountAmount: Number(row.discount_amount ?? 0),
  issuedQuantity: Number(row.issue_quantity ?? row.issued_quantity),
  sellStartDate: dateInput(row.sale_start_at ?? row.sell_start_date),
  sellEndDate: dateInput(row.sale_end_at ?? row.sell_end_date),
  useStartDate: dateInput(row.use_start_at), useEndDate: dateInput(row.use_end_at),
  displayStatus: row.display_status === "HIDDEN" ? "hidden" : "active",
  status: row.status ?? (row.display_status === "PENDING_APPROVAL" ? "pending" : row.display_status === "PUBLISHED" ? "approved" : "draft"),
  submittedAt: row.submitted_at ?? undefined, approvedAt: row.reviewed_at ?? undefined,
  adminFeedback: row.admin_feedback ?? undefined,
  soldCount: Number(row.sold_count ?? 0), usedCount: Number(row.used_count ?? 0),
  expiredCount: Number(row.expired_count ?? 0), revenue: Number(row.revenue ?? 0),
  thumbnail: row.thumbnail ?? null,
  images: (row.images ?? []).map((image: any): VoucherImage => ({
    id: String(image.id ?? image.image_id),
    url: image.url ?? image.image_url,
    isPrimary: Boolean(image.isPrimary ?? image.is_primary),
    sortOrder: Number(image.sortOrder ?? image.sort_order ?? 0),
  })),
});

/** Đối tượng partnerApi chứa toàn bộ các hàm gọi API cho phân hệ đối tác */
export const partnerApi = {
  // ─── Xác thực & Đăng ký Đối tác ─────────────────────────────────────────────
  /** Đăng nhập cho Đối tác hoặc Nhân viên */
  login: (payload: { email: string; password: string }) =>
    request<{
      token: string;
      user: {
        id: number;
        full_name: string;
        email: string;
        role: string;
        business_name?: string;
        branch?: { id: number; name: string; address: string };
      };
    }>("/partner/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Kiểm tra tính khả dụng của email, CCCD, MST */
  checkRegistration: (payload: { email: string; identity_no: string; tax_code: string }) =>
    request<{ available: true }>("/partner/auth/registration/check", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Gửi mã OTP xác thực email */
  sendRegistrationOtp: (payload: { email: string; identity_no: string; tax_code: string }) =>
    request<{ message: string; challenge_id: string; expires_in: number; resend_after: number }>(
      "/partner/auth/registration/otp/send",
      { method: "POST", body: JSON.stringify(payload) },
    ),

  /** Xác thực mã OTP 6 số */
  verifyRegistrationOtp: (payload: { email: string; challenge_id: string; otp: string }) =>
    request<{ message: string; verified: true; challenge_id: string }>(
      "/partner/auth/registration/otp/verify",
      { method: "POST", body: JSON.stringify(payload) },
    ),

  /** Hoàn tất đăng ký tài khoản đối tác */
  register: (payload: object) => request("/partner/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  // ─── Hồ sơ Doanh nghiệp Đối tác ──────────────────────────────────────────────
  /** Lấy thông tin hồ sơ đối tác */
  getProfile: async (): Promise<PartnerProfile> => {
    const [row, branches] = await Promise.all([
      request<any>("/partner/profile"), request<any[]>("/partner/branches"),
    ]);
    return {
      businessName: row.business_name ?? "Đối tác",
      brandLogo: row.brand_logo ?? null,
      activityStatus: row.activity_status ?? "ACTIVE",
      approvalStatus: row.approval_status ?? "PENDING",
      adminFeedback: row.admin_feedback ?? null,
      legalInfo: {
        taxId: row.tax_code, businessLicenseNo: row.business_license_no ?? "",
        issueDate: row.license_issue_date?.slice(0, 10) ?? "", issuePlace: row.license_issue_place ?? "",
        verificationStatus: row.approval_status === "APPROVED" ? "verified" : row.approval_status === "REJECTED" ? "rejected" : "pending",
      },
      representativeInfo: {
        fullName: row.full_name ?? "", title: row.representative_title ?? "",
        identityNo: row.identity_no ?? "", phone: row.phone ?? "",
        email: row.email ?? "",
      },
      branches: branches.map(mapBranch),
    };
  },

  /** Cập nhật thông tin hồ sơ đối tác */
  updateProfile: (profile: PartnerProfile) => request("/partner/profile", {
    method: "PUT", body: JSON.stringify({
      business_name: profile.businessName,
      brand_logo: profile.brandLogo,
      business_license_no: profile.legalInfo.businessLicenseNo,
      license_issue_date: profile.legalInfo.issueDate || null,
      license_issue_place: profile.legalInfo.issuePlace,
      full_name: profile.representativeInfo.fullName,
      representative_title: profile.representativeInfo.title,
      identity_no: profile.representativeInfo.identityNo,
      phone: profile.representativeInfo.phone,
    }),
  }),

  /** Tải lên ảnh logo thương hiệu */
  uploadBrandLogo: async (file: File): Promise<{ logo_url: string; profile: any }> => {
    const formData = new FormData();
    formData.append("logo", file);
    return request<{ logo_url: string; profile: any }>("/partner/profile/logo", {
      method: "POST",
      body: formData,
    });
  },

  // ─── Quản lý Chi nhánh ───────────────────────────────────────────────────────
  /** Danh sách chi nhánh */
  getBranches: async () => (await request<any[]>("/partner/branches")).map(mapBranch),

  /** Tạo chi nhánh mới */
  createBranch: (branch: Branch) => request("/partner/branches", {
    method: "POST", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region, phone: branch.phone }),
  }),

  /** Cập nhật chi nhánh */
  updateBranch: (branch: Branch) => request(`/partner/branches/${branch.id}`, {
    method: "PUT", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region, phone: branch.phone, status: branch.status.toUpperCase() }),
  }),

  /** Xóa chi nhánh */
  deleteBranch: (id: string) => request(`/partner/branches/${id}`, { method: "DELETE" }),

  // ─── Quản lý Voucher ─────────────────────────────────────────────────────────
  /** Lấy danh mục ngành hàng */
  getCategories: async (): Promise<CategoryOption[]> => (await request<any[]>("/partner/vouchers/categories"))
    .map((row) => ({ id: String(row.category_id), name: row.category_name, description: row.description })),

  /** Lấy danh sách voucher kèm thống kê */
  getVouchers: async (): Promise<VoucherItem[]> => {
    const [list, stats] = await Promise.all([
      request<{ data: any[] }>("/partner/vouchers?page=1&limit=100"),
      request<any[]>("/partner/dashboard/vouchers"),
    ]);
    const statMap = new Map(stats.map((row) => [String(row.program_id), row]));
    return list.data.map((row) => mapVoucher({ ...row, ...statMap.get(String(row.program_id)) }));
  },

  /** Xem chi tiết voucher */
  getVoucher: async (id: string) => mapVoucher(await request<any>(`/partner/vouchers/${id}`)),

  /** Tạo chương trình voucher */
  createVoucher: (voucher: CreateVoucherInput) => request<{ message: string; program: { program_id: number } }>("/partner/vouchers", {
    method: "POST", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId),
      original_price: voucher.originalPrice, sale_price: voucher.sellingPrice,
      issue_quantity: voucher.issuedQuantity, sale_start_at: voucher.sellStartDate,
      sale_end_at: voucher.sellEndDate, use_start_at: voucher.useStartDate,
      use_end_at: voucher.useEndDate, branch_ids: voucher.branchIds.map(Number),
    }),
  }),

  /** Cập nhật chương trình voucher */
  updateVoucher: (voucher: VoucherItem) => request(`/partner/vouchers/${voucher.id}`, {
    method: "PUT", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId),
      original_price: voucher.originalPrice, sale_price: voucher.sellingPrice,
      issue_quantity: voucher.issuedQuantity, sale_start_at: voucher.sellStartDate,
      sale_end_at: voucher.sellEndDate, use_start_at: voucher.useStartDate,
      use_end_at: voucher.useEndDate, branch_ids: voucher.branchIds.map(Number),
    }),
  }),

  /** Tải lên ảnh voucher */
  uploadVoucherImage: async (
    voucherId: string,
    file: File,
    isPrimary: boolean,
    sortOrder: number,
  ): Promise<VoucherImage> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("is_primary", String(isPrimary));
    formData.append("sort_order", String(sortOrder));
    const result = await request<{ message: string; image: VoucherImage }>(`/partner/vouchers/${voucherId}/images`, {
      method: "POST",
      body: formData,
    });
    return result.image;
  },

  /** Đặt ảnh chính cho voucher */
  setPrimaryVoucherImage: async (voucherId: string, imageId: string): Promise<VoucherImage[]> =>
    (await request<{ message: string; images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/${imageId}/primary`, {
      method: "PATCH",
    })).images,

  /** Sắp xếp lại danh sách ảnh voucher */
  reorderVoucherImages: async (voucherId: string, imageIds: string[]): Promise<VoucherImage[]> =>
    (await request<{ message: string; images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/order`, {
      method: "PUT",
      body: JSON.stringify({ image_ids: imageIds.map(Number) }),
    })).images,

  /** Xóa ảnh khỏi voucher */
  deleteVoucherImage: async (voucherId: string, imageId: string): Promise<VoucherImage[]> =>
    (await request<{ message: string; images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/${imageId}`, {
      method: "DELETE",
    })).images,

  /** Gửi yêu cầu duyệt voucher lên Admin */
  submitVoucher: (id: string) => request(`/partner/vouchers/${id}/submit`, { method: "POST" }),

  // ─── Tra cứu & Đổi Voucher (Redemption) ──────────────────────────────────────
  /** Tra cứu voucher theo mã code */
  lookupVoucher: (code: string) => request<any>(`/partner/redeem/lookup?code=${encodeURIComponent(code)}`),

  /** Tra cứu voucher theo QR code */
  lookupVoucherByQr: (qrValue: string) => request<any>("/partner/redeem/lookup-qr", {
    method: "POST", body: JSON.stringify({ qr_value: qrValue }),
  }),

  /** Xác nhận đổi voucher tại chi nhánh */
  redeemVoucher: (code: string, branchId: string | number) => request<any>("/partner/redeem", {
    method: "POST", body: JSON.stringify({ voucher_code: code, branch_id: Number(branchId) }),
  }),

  // ─── Cổng Nhân viên Chi nhánh (Employee Portal) ──────────────────────────────
  /** Lấy thông tin cá nhân của nhân viên */
  getEmployeeProfile: () => request<EmployeeProfile>("/partner/employee/profile"),

  /** Cập nhật thông tin cá nhân nhân viên */
  updateEmployeeProfile: (payload: { full_name?: string; phone?: string; gender?: string; nationality?: string }) =>
    request<EmployeeProfile>("/partner/employee/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** Đổi mật khẩu tài khoản nhân viên */
  changeEmployeePassword: (payload: { old_password: string; new_password: string }) =>
    request<{ message: string }>("/partner/employee/change-password", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // ─── Quản trị Nhân sự Chi nhánh (Partner Employee Management) ────────────────
  /** Đối tác lấy danh sách nhân viên chi nhánh */
  getEmployees: () => request<PartnerEmployeeItem[]>("/partner/employees"),

  /** Đối tác tạo nhân viên chi nhánh mới */
  createEmployee: (payload: CreateEmployeePayload) =>
    request<PartnerEmployeeItem>("/partner/employees", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Đối tác cập nhật thông tin nhân viên hoặc chuyển chi nhánh */
  updateEmployee: (id: number | string, payload: Partial<CreateEmployeePayload>) =>
    request<{ message: string }>(`/partner/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
