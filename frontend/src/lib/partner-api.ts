import { Branch, PartnerProfile } from "./types/profile";
import { CategoryOption, CreateVoucherInput, VoucherImage, VoucherItem } from "./types/voucher";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
    public retryAfter?: number,
  ) { super(message); }
}

let isRedirectingToLogin = false;

const redirectToPartnerLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) return;

  const isProtectedPartnerRoute = window.location.pathname.startsWith("/partner")
    && !window.location.pathname.startsWith("/partner/login")
    && !window.location.pathname.startsWith("/partner/register");
  if (!isProtectedPartnerRoute) return;

  isRedirectingToLogin = true;
  window.location.replace("/partner/login");
};

const getStoredPartnerToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("partner_access_token");
  const isJwt = token !== null && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
  if (!isJwt) {
    localStorage.removeItem("partner_access_token");
    return null;
  }

  return token;
};

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

const dateInput = (value?: string | null) => value ? value.slice(0, 16) : "";
const mapBranch = (row: any): Branch => ({
  id: String(row.branch_id), name: row.branch_name, address: row.address,
  region: row.region ?? "", phone: row.phone ?? "",
  status: row.status === "ACTIVE" ? "active" : "inactive",
});
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
    id: String(image.id), url: image.url, isPrimary: Boolean(image.isPrimary),
    sortOrder: Number(image.sortOrder),
  })),
});

export const partnerApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: { full_name: string; email: string } }>("/partner/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  checkRegistration: (payload: { email: string; identity_no: string; tax_code: string }) =>
    request<{ available: true }>("/partner/auth/registration/check", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendRegistrationOtp: (payload: { email: string; identity_no: string; tax_code: string }) =>
    request<{ message: string; challenge_id: string; expires_in: number; resend_after: number }>(
      "/partner/auth/registration/otp/send",
      { method: "POST", body: JSON.stringify(payload) },
    ),
  verifyRegistrationOtp: (payload: { email: string; challenge_id: string; otp: string }) =>
    request<{ message: string; verified: true; challenge_id: string }>(
      "/partner/auth/registration/otp/verify",
      { method: "POST", body: JSON.stringify(payload) },
    ),
  register: (payload: object) => request("/partner/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getProfile: async (): Promise<PartnerProfile> => {
    const [row, branches] = await Promise.all([
      request<any>("/partner/profile"), request<any[]>("/partner/branches"),
    ]);
    return {
      businessName: row.business_name ?? "Đối tác",
      brandLogo: row.brand_logo ?? null,
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
  uploadBrandLogo: async (file: File): Promise<{ logo_url: string; profile: any }> => {
    const formData = new FormData();
    formData.append("logo", file);
    return request<{ logo_url: string; profile: any }>("/partner/profile/logo", {
      method: "POST",
      body: formData,
    });
  },
  getBranches: async () => (await request<any[]>("/partner/branches")).map(mapBranch),
  createBranch: (branch: Branch) => request("/partner/branches", {
    method: "POST", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region, phone: branch.phone }),
  }),
  updateBranch: (branch: Branch) => request(`/partner/branches/${branch.id}`, {
    method: "PUT", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region, phone: branch.phone, status: branch.status.toUpperCase() }),
  }),
  deleteBranch: (id: string) => request(`/partner/branches/${id}`, { method: "DELETE" }),
  getCategories: async (): Promise<CategoryOption[]> => (await request<any[]>("/partner/vouchers/categories"))
    .map((row) => ({ id: String(row.category_id), name: row.category_name, description: row.description })),
  getVouchers: async (): Promise<VoucherItem[]> => {
    const [list, stats] = await Promise.all([
      request<{ data: any[] }>("/partner/vouchers?page=1&limit=100"),
      request<any[]>("/partner/dashboard/vouchers"),
    ]);
    const statMap = new Map(stats.map((row) => [String(row.program_id), row]));
    return list.data.map((row) => mapVoucher({ ...row, ...statMap.get(String(row.program_id)) }));
  },
  getVoucher: async (id: string) => mapVoucher(await request<any>(`/partner/vouchers/${id}`)),
  createVoucher: (voucher: CreateVoucherInput) => request<{ message: string; program: { program_id: number } }>("/partner/vouchers", {
    method: "POST", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId),
      original_price: voucher.originalPrice, sale_price: voucher.sellingPrice,
      issue_quantity: voucher.issuedQuantity, sale_start_at: voucher.sellStartDate,
      sale_end_at: voucher.sellEndDate, use_start_at: voucher.useStartDate,
      use_end_at: voucher.useEndDate, branch_ids: voucher.branchIds.map(Number),
    }),
  }),
  updateVoucher: (voucher: VoucherItem) => request(`/partner/vouchers/${voucher.id}`, {
    method: "PUT", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId),
      original_price: voucher.originalPrice, sale_price: voucher.sellingPrice,
      issue_quantity: voucher.issuedQuantity, sale_start_at: voucher.sellStartDate,
      sale_end_at: voucher.sellEndDate, use_start_at: voucher.useStartDate,
      use_end_at: voucher.useEndDate, branch_ids: voucher.branchIds.map(Number),
    }),
  }),
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
    const result = await request<{ image: VoucherImage }>(`/partner/vouchers/${voucherId}/images`, {
      method: "POST",
      body: formData,
    });
    return result.image;
  },
  setPrimaryVoucherImage: async (voucherId: string, imageId: string): Promise<VoucherImage[]> =>
    (await request<{ images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/${imageId}/primary`, {
      method: "PATCH",
    })).images,
  reorderVoucherImages: async (voucherId: string, imageIds: string[]): Promise<VoucherImage[]> =>
    (await request<{ images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/order`, {
      method: "PUT",
      body: JSON.stringify({ image_ids: imageIds.map(Number) }),
    })).images,
  deleteVoucherImage: async (voucherId: string, imageId: string): Promise<VoucherImage[]> =>
    (await request<{ images: VoucherImage[] }>(`/partner/vouchers/${voucherId}/images/${imageId}`, {
      method: "DELETE",
    })).images,
  submitVoucher: (id: string) => request(`/partner/vouchers/${id}/submit`, { method: "POST" }),
  lookupVoucher: (code: string) => request<any>(`/partner/redeem/lookup?code=${encodeURIComponent(code)}`),
  lookupVoucherByQr: (qrValue: string) => request<any>("/partner/redeem/lookup-qr", {
    method: "POST", body: JSON.stringify({ qr_value: qrValue }),
  }),
  redeemVoucher: (code: string, branchId: string) => request<any>("/partner/redeem", {
    method: "POST", body: JSON.stringify({ voucher_code: code, branch_id: Number(branchId) }),
  }),
};
