/**
 * @file admin-voucher.ts
 * @description Định nghĩa TypeScript Interfaces cho Duyệt Voucher (Pending Vouchers) và Quản lý Voucher (Managed Vouchers) trong Quản trị Admin.
 */

/**
 * Chi nhánh áp dụng của Voucher.
 */
export interface AdminVoucherBranch {
  branch_id: number;
  branch_name: string;
  address: string;
  region?: string | null;
  phone?: string | null;
  status?: string;
}

/**
 * Hình ảnh quảng bá chiến dịch Voucher (lưu trữ trên Cloudflare R2 / S3).
 */
export interface AdminVoucherImage {
  image_id: number;
  image_url: string;
  /** Ảnh đại diện chính (Primary Image) */
  is_primary: boolean;
  /** Thứ tự sắp xếp hiển thị */
  sort_order?: number;
}

/**
 * Một chiến dịch Voucher gửi lên chờ Admin phê duyệt.
 */
export interface AdminPendingVoucherItem {
  /** Mã yêu cầu phê duyệt */
  approval_request_id: number;
  /** Mã chiến dịch voucher */
  program_id: number;
  /** Thời điểm gửi yêu cầu duyệt */
  submitted_at: string;
  /** Trạng thái duyệt: PENDING, APPROVED, REJECTED */
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  /** Lý do phản hồi từ Admin */
  admin_feedback?: string | null;
  /** Tên chương trình voucher */
  program_name: string;
  /** Mã danh mục ngành hàng */
  category_id: number;
  /** Tên danh mục ngành hàng */
  category_name?: string | null;
  /** Giá niêm yết ban đầu */
  original_price: string | number;
  /** Giá ưu đãi mở bán */
  sale_price: string | number;
  /** Số tiền được giảm */
  discount_amount?: string | number;
  /** Số lượng phát hành */
  issue_quantity: number;
  /** Thời gian bắt đầu mở bán */
  sale_start_at: string;
  /** Thời gian kết thúc mở bán */
  sale_end_at: string;
  /** Thời gian bắt đầu có hiệu lực sử dụng tại cửa hàng */
  use_start_at: string;
  /** Hạn chót sử dụng voucher */
  use_end_at: string;
  /** Trạng thái hiển thị */
  display_status: string;
  /** Mã đối tác phát hành */
  partner_id: number;
  /** Tên doanh nghiệp đối tác */
  partner_name: string;
  /** Mã số thuế đối tác */
  tax_code: string;
  /** Người đại diện đối tác */
  partner_representative: string;
  /** Email liên hệ */
  partner_email: string;
  /** Số điện thoại liên hệ */
  partner_phone: string | null;
  /** Danh sách chi nhánh áp dụng */
  branches?: AdminVoucherBranch[];
  /** Bộ sưu tập ảnh voucher */
  images?: AdminVoucherImage[];
}

/**
 * Chi tiết một voucher gửi duyệt.
 */
export interface AdminPendingVoucherDetail extends AdminPendingVoucherItem {
  /** Thời điểm duyệt */
  reviewed_at?: string | null;
  /** Mã Admin đã duyệt */
  admin_id?: number | null;
  /** Số giấy phép kinh doanh của đối tác */
  business_license_no?: string | null;
}

/**
 * Cấu trúc Response danh sách voucher chờ duyệt.
 */
export interface PendingVouchersResponse {
  vouchers: AdminPendingVoucherItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Một chiến dịch Voucher trong danh sách quản lý chung toàn sàn.
 */
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
  /** Trạng thái hiển thị: PUBLISHED (Đang mở bán), HIDDEN (Tạm ẩn), ENDED (Đã kết thúc) */
  display_status: "PUBLISHED" | "HIDDEN" | "ENDED";
  partner_id: number;
  partner_name: string;
  tax_code: string;
  branch_name: string;
  /** Số lượng voucher khách hàng đã mua */
  sold_count: number;
  /** Số lượng còn trong kho có thể bán */
  stock: number;
  images?: AdminVoucherImage[];
}

/**
 * Chi tiết toàn diện của một voucher đang quản lý.
 */
export interface AdminManagedVoucherDetail extends AdminManagedVoucherItem {
  partner_representative?: string;
  partner_email?: string;
  partner_phone?: string | null;
  business_license_no?: string | null;
  branches?: AdminVoucherBranch[];
  /** Số lượng voucher khách đã mang đến quầy đổi thành công */
  used_count?: number;
}

/**
 * Cấu trúc Response danh sách voucher quản lý kèm số liệu thống kê.
 */
export interface ManagedVouchersResponse {
  vouchers: AdminManagedVoucherItem[];
  /** Thống kê số lượng voucher theo từng trạng thái */
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
