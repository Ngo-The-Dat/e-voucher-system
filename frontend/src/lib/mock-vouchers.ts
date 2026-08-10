import { VoucherItem, CategoryOption } from "./types/voucher";

export const initialCategories: CategoryOption[] = [
  { id: "cat-01", name: "Cà phê & Trà", description: "Các thức uống Cà phê, Trà truyền thống & Hiện đại" },
  { id: "cat-02", name: "Bánh ngọt & Tráng miệng", description: "Bánh mì, Bánh ngọt, Bánh kem & Đồ tráng miệng" },
  { id: "cat-03", name: "Combo F&B", description: "Các gói Combo tiết kiệm" },
  { id: "cat-04", name: "Thức ăn nhanh", description: "Món ăn nhẹ, Đồ ăn nhanh" },
];

export const initialVouchers: VoucherItem[] = [
  {
    id: "VC-HL-2023-001",
    code: "VC-HL-2023-001",
    title: "Voucher Cà phê Phin giảm 20k",
    categoryId: "cat-01",
    categoryName: "Cà phê & Trà",
    branchIds: ["br-01", "br-02"],
    branchNames: ["Highlands Nguyễn Du", "Highlands Võ Văn Tần"],
    originalPrice: 45000,
    sellingPrice: 25000,
    discountAmount: 20000,
    issuedQuantity: 10000,
    sellStartDate: "2023-10-01",
    sellEndDate: "2023-12-31",
    useStartDate: "2023-10-01",
    useEndDate: "2023-12-31",
    displayStatus: "active",
    status: "approved",
    submittedAt: "2023-09-25 10:00",
    approvedAt: "2023-09-26 14:00",
    adminFeedback: "Hồ sơ voucher hợp lệ và đã được phê duyệt mở bán toàn hệ thống.",
    soldCount: 8420,
    usedCount: 5102,
    expiredCount: 318,
    createdAt: "2023-09-25T10:00:00Z",
    updatedAt: "2023-09-26T14:00:00Z",
  },
  {
    id: "VC-HL-2023-015",
    code: "VC-HL-2023-015",
    title: "Combo Bánh & Nước Sáng 49k",
    categoryId: "cat-03",
    categoryName: "Combo F&B",
    branchIds: ["br-01", "br-02", "br-03"],
    branchNames: ["Highlands Nguyễn Du", "Highlands Võ Văn Tần", "Highlands Trang Tiền"],
    originalPrice: 75000,
    sellingPrice: 49000,
    discountAmount: 26000,
    issuedQuantity: 5000,
    sellStartDate: "2023-11-15",
    sellEndDate: "2023-11-30",
    useStartDate: "2023-11-15",
    useEndDate: "2023-12-15",
    displayStatus: "active",
    status: "pending",
    submittedAt: "2023-11-10 14:30",
    soldCount: 0,
    usedCount: 0,
    expiredCount: 0,
    createdAt: "2023-11-10T14:30:00Z",
    updatedAt: "2023-11-10T14:30:00Z",
  },
  {
    id: "VC-HL-2023-099",
    code: "VC-HL-2023-099",
    title: "Ưu đãi Giảm 50k cho Đơn Cuối Tuần",
    categoryId: "cat-02",
    categoryName: "Bánh ngọt & Tráng miệng",
    branchIds: ["br-01"],
    branchNames: ["Highlands Nguyễn Du"],
    originalPrice: 150000,
    sellingPrice: 100000,
    discountAmount: 50000,
    issuedQuantity: 2000,
    sellStartDate: "2023-12-01",
    sellEndDate: "2023-12-25",
    useStartDate: "2023-12-01",
    useEndDate: "2023-12-31",
    displayStatus: "hidden",
    status: "draft",
    soldCount: 0,
    usedCount: 0,
    expiredCount: 0,
    createdAt: "2023-11-20T09:15:00Z",
    updatedAt: "2023-11-20T09:15:00Z",
  },
];

const STORAGE_KEY = "partner_vouchers_erd_v2";

export function getStoredVouchers(): VoucherItem[] {
  if (typeof window === "undefined") return initialVouchers;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load vouchers", e);
  }
  return initialVouchers;
}

export function saveVouchers(vouchers: VoucherItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
  } catch (e) {
    console.error("Failed to save vouchers", e);
  }
}

export function getVoucherById(id: string): VoucherItem | null {
  const vouchers = getStoredVouchers();
  return vouchers.find((v) => v.id === id || v.code === id) || null;
}

export function createVoucher(item: Omit<VoucherItem, "createdAt" | "updatedAt">): VoucherItem {
  const vouchers = getStoredVouchers();
  const now = new Date().toISOString();
  const newVoucher: VoucherItem = {
    ...item,
    createdAt: now,
    updatedAt: now,
  };
  const updatedList = [newVoucher, ...vouchers];
  saveVouchers(updatedList);
  return newVoucher;
}

export function updateVoucherStatus(id: string, status: VoucherItem["status"]): void {
  const vouchers = getStoredVouchers();
  const index = vouchers.findIndex((v) => v.id === id || v.code === id);
  if (index >= 0) {
    const nowStr = new Date().toLocaleString("vi-VN");
    vouchers[index].status = status;
    if (status === "pending") {
      vouchers[index].submittedAt = nowStr;
    } else if (status === "approved" || status === "rejected") {
      vouchers[index].approvedAt = nowStr;
    }
    vouchers[index].updatedAt = new Date().toISOString();
    saveVouchers(vouchers);
  }
}

export function updateVoucher(updatedItem: VoucherItem): void {
  const vouchers = getStoredVouchers();
  const index = vouchers.findIndex((v) => v.id === updatedItem.id || v.code === updatedItem.code);
  if (index >= 0) {
    vouchers[index] = { ...updatedItem, updatedAt: new Date().toISOString() };
    saveVouchers(vouchers);
  }
}
