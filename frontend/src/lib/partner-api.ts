import type { Branch, PartnerProfile } from "@/lib/types/profile";
import type { CategoryOption, VoucherItem } from "@/lib/types/voucher";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "partner_access_token";
const USER_KEY = "partner_user";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type PartnerUser = {
  id: number;
  full_name: string;
  email: string;
  business_name: string;
  role: "PARTNER";
  approval_status: string;
};

export const authStore = {
  getToken: () => typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  getUser: (): PartnerUser | null => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? "null"); } catch { return null; }
  },
  setSession: (token: string, user: PartnerUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authStore.getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) {
    if (response.status === 401 && token) authStore.clear();
    throw new ApiError(response.status, body.message ?? "Không thể kết nối đến máy chủ.");
  }
  return body as T;
}

const toDateInput = (value?: string | null) => value ? value.slice(0, 16) : "";
const toBranch = (row: any): Branch => ({
  id: String(row.branch_id), name: row.branch_name, region: row.region ?? "",
  address: row.address, status: row.status === "ACTIVE" ? "active" : "inactive",
});
const toVoucher = (row: any): VoucherItem => ({
  id: String(row.program_id), code: String(row.program_id), title: row.program_name,
  categoryId: String(row.category_id), categoryName: row.category_name ?? "",
  branchIds: (row.branch_ids ?? []).map(String), branchNames: row.branch_names ?? [],
  originalPrice: Number(row.original_price), sellingPrice: Number(row.sale_price ?? row.selling_price),
  discountAmount: Number(row.discount_amount ?? Number(row.original_price) - Number(row.sale_price)),
  issuedQuantity: Number(row.issue_quantity ?? row.issued_quantity),
  sellStartDate: toDateInput(row.sale_start_at ?? row.sell_start_date),
  sellEndDate: toDateInput(row.sale_end_at ?? row.sell_end_date),
  useStartDate: toDateInput(row.use_start_at), useEndDate: toDateInput(row.use_end_at),
  displayStatus: row.display_status === "HIDDEN" ? "hidden" : "active",
  status: row.status ?? (row.display_status === "PENDING_APPROVAL" ? "pending" : row.display_status === "PUBLISHED" ? "approved" : "draft"),
  submittedAt: row.submitted_at ?? undefined, approvedAt: row.reviewed_at ?? undefined,
  adminFeedback: row.admin_feedback ?? undefined,
  soldCount: Number(row.sold_count ?? 0), usedCount: Number(row.used_count ?? 0),
  expiredCount: Number(row.expired_count ?? 0), revenue: Number(row.revenue ?? 0),
});

export const partnerApi = {
  login: (email: string, password: string) => apiFetch<{ token: string; user: PartnerUser }>("/partner/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  }),
  register: (payload: object) => apiFetch<{ message: string }>("/partner/auth/register", {
    method: "POST", body: JSON.stringify(payload),
  }),
  getProfile: async (): Promise<PartnerProfile> => {
    const [row, branches] = await Promise.all([
      apiFetch<any>("/partner/profile"), apiFetch<any[]>("/partner/branches"),
    ]);
    return {
      businessName: row.business_name, fullName: row.full_name, email: row.email, phone: row.phone ?? "",
      legalInfo: {
        taxId: row.tax_code, businessLicenseNo: row.business_license_no ?? "",
        issueDate: row.license_issue_date?.slice(0, 10) ?? "", issuePlace: row.license_issue_place ?? "",
        verificationStatus: row.approval_status === "APPROVED" ? "verified" : row.approval_status === "REJECTED" ? "rejected" : "pending",
      },
      representativeInfo: {
        fullName: row.representative_full_name ?? "", title: row.representative_title ?? "",
        identityNo: row.representative_identity_no ?? "", phone: row.representative_phone ?? "",
        email: row.representative_email ?? "",
      },
      branches: branches.map(toBranch),
    };
  },
  updateProfile: (profile: PartnerProfile) => apiFetch("/partner/profile", {
    method: "PUT", body: JSON.stringify({
      full_name: profile.fullName, phone: profile.phone, business_name: profile.businessName,
      business_license_no: profile.legalInfo.businessLicenseNo,
      license_issue_date: profile.legalInfo.issueDate || null,
      license_issue_place: profile.legalInfo.issuePlace,
      representative_full_name: profile.representativeInfo.fullName,
      representative_title: profile.representativeInfo.title,
      representative_identity_no: profile.representativeInfo.identityNo,
      representative_phone: profile.representativeInfo.phone,
      representative_email: profile.representativeInfo.email,
    }),
  }),
  getBranches: async () => (await apiFetch<any[]>("/partner/branches")).map(toBranch),
  createBranch: async (branch: Branch) => toBranch((await apiFetch<any>("/partner/branches", {
    method: "POST", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region }),
  })).branch),
  updateBranch: async (branch: Branch) => toBranch((await apiFetch<any>(`/partner/branches/${branch.id}`, {
    method: "PUT", body: JSON.stringify({ branch_name: branch.name, address: branch.address, region: branch.region, status: branch.status.toUpperCase() }),
  })).branch),
  deleteBranch: (id: string) => apiFetch(`/partner/branches/${id}`, { method: "DELETE" }),
  getCategories: async (): Promise<CategoryOption[]> => (await apiFetch<any[]>("/partner/vouchers/categories"))
    .map((row) => ({ id: String(row.category_id), name: row.category_name, description: row.description })),
  getVouchers: async (): Promise<VoucherItem[]> => {
    const [firstPage, stats] = await Promise.all([
      apiFetch<{ data: any[]; total: number }>("/partner/vouchers?page=1&limit=100"),
      apiFetch<any[]>("/partner/dashboard/vouchers"),
    ]);
    const pageCount = Math.ceil(firstPage.total / 100);
    const remainingPages = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      apiFetch<{ data: any[] }>(`/partner/vouchers?page=${index + 2}&limit=100`)
    ));
    const rows = [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
    const statById = new Map(stats.map((row) => [String(row.program_id), row]));
    return rows.map((row) => toVoucher({ ...row, ...statById.get(String(row.program_id)) }));
  },
  getVoucher: async (id: string) => toVoucher(await apiFetch<any>(`/partner/vouchers/${id}`)),
  createVoucher: (voucher: VoucherItem) => apiFetch("/partner/vouchers", {
    method: "POST", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId), original_price: voucher.originalPrice,
      sale_price: voucher.sellingPrice, issue_quantity: voucher.issuedQuantity,
      sale_start_at: voucher.sellStartDate, sale_end_at: voucher.sellEndDate,
      use_start_at: voucher.useStartDate, use_end_at: voucher.useEndDate,
      branch_ids: voucher.branchIds.map(Number),
    }),
  }),
  updateVoucher: (voucher: VoucherItem) => apiFetch(`/partner/vouchers/${voucher.id}`, {
    method: "PUT", body: JSON.stringify({
      program_name: voucher.title, category_id: Number(voucher.categoryId), original_price: voucher.originalPrice,
      sale_price: voucher.sellingPrice, issue_quantity: voucher.issuedQuantity,
      sale_start_at: voucher.sellStartDate, sale_end_at: voucher.sellEndDate,
      use_start_at: voucher.useStartDate, use_end_at: voucher.useEndDate,
      branch_ids: voucher.branchIds.map(Number),
    }),
  }),
  submitVoucher: (id: string) => apiFetch(`/partner/vouchers/${id}/submit`, { method: "POST" }),
  setVisibility: (id: string, visible: boolean) => apiFetch(`/partner/vouchers/${id}/visibility`, {
    method: "PATCH", body: JSON.stringify({ display_status: visible ? "PUBLISHED" : "HIDDEN" }),
  }),
  getOverview: () => apiFetch<any>("/partner/dashboard/overview"),
  lookupVoucher: (code: string) => apiFetch<any>(`/partner/redeem/lookup?code=${encodeURIComponent(code)}`),
  redeemVoucher: (code: string, branchId: string) => apiFetch<any>("/partner/redeem", {
    method: "POST", body: JSON.stringify({ voucher_code: code, branch_id: Number(branchId) }),
  }),
};
