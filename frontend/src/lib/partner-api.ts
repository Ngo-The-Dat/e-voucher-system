import { Branch, PartnerProfile } from "./types/profile";
import { CategoryOption, CreateVoucherInput, VoucherItem } from "./types/voucher";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("partner_access_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new ApiError(response.status, body.message ?? "Không thể kết nối đến máy chủ.");
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
});

export const partnerApi = {
  register: (payload: object) => request("/partner/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getProfile: async (): Promise<PartnerProfile> => {
    const [row, branches] = await Promise.all([
      request<any>("/partner/profile"), request<any[]>("/partner/branches"),
    ]);
    return {
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
      branches: branches.map(mapBranch),
    };
  },
  updateProfile: (profile: PartnerProfile) => request("/partner/profile", {
    method: "PUT", body: JSON.stringify({
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
  createVoucher: (voucher: CreateVoucherInput) => request("/partner/vouchers", {
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
  submitVoucher: (id: string) => request(`/partner/vouchers/${id}/submit`, { method: "POST" }),
  lookupVoucher: (code: string) => request<any>(`/partner/redeem/lookup?code=${encodeURIComponent(code)}`),
  redeemVoucher: (code: string, branchId: string) => request<any>("/partner/redeem", {
    method: "POST", body: JSON.stringify({ voucher_code: code, branch_id: Number(branchId) }),
  }),
};
