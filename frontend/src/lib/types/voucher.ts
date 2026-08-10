export type VoucherApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export interface CategoryOption {
  id: string;
  name: string;
  description?: string;
}

export interface VoucherItem {
  id: string; // Mã chương trình (PK)
  code: string; // Mã chương trình
  title: string; // Tên chương trình
  categoryId: string; // Mã danh mục (FK)
  categoryName: string; // Tên danh mục
  branchIds: string[]; // Danh sách Mã chi nhánh áp dụng (FK)
  branchNames: string[]; // Danh sách Tên chi nhánh áp dụng
  originalPrice: number; // Giá gốc (VNĐ)
  sellingPrice: number; // Giá bán (VNĐ)
  discountAmount: number; // Mức giảm [Giá gốc - Giá bán]
  issuedQuantity: number; // Số lượng phát hành
  sellStartDate: string; // Thời gian bắt đầu bán
  sellEndDate: string; // Thời gian kết thúc bán
  useStartDate: string; // Thời gian bắt đầu sử dụng
  useEndDate: string; // Thời gian kết thúc sử dụng
  displayStatus: "active" | "hidden"; // Trạng thái hiển thị
  
  // Thông tin xét duyệt (Bảng Xét duyệt)
  status: VoucherApprovalStatus; // Trạng thái duyệt
  submittedAt?: string; // Thời gian gửi duyệt
  approvedAt?: string; // Thời gian xét duyệt
  adminFeedback?: string; // Phản hồi của admin

  // Thống kê sử dụng
  soldCount?: number;
  usedCount?: number;
  expiredCount?: number;
  revenue?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export type VoucherFormErrors = Record<string, string>;
