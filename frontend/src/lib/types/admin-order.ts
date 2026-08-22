/**
 * @file admin-order.ts
 * @description Định nghĩa TypeScript Interfaces cho Đơn hàng (Orders), Mã Voucher phát hành (Issued Vouchers) và Chi tiết mua hàng trong Quản trị Admin.
 */

/**
 * Một mã E-Voucher cá nhân được cấp cho khách hàng sau khi thanh toán thành công.
 */
export interface AdminIssuedVoucher {
  /** Mã định danh bản ghi phát hành */
  issued_voucher_id: number;
  /** Mã chuỗi ký tự voucher (độc nhất, bảo mật) */
  voucher_code: string;
  /** Chuỗi dữ liệu QR Code để nhân viên chi nhánh quét */
  qr_code: string;
  /** Trạng thái sử dụng của mã: UNUSED (Chưa dùng), USED (Đã đổi), CANCELLED (Đã hủy hoàn tiền), EXPIRED (Hết hạn) */
  usage_status: "UNUSED" | "USED" | "CANCELLED" | "EXPIRED";
  /** Thời điểm cấp mã */
  issued_at: string;
  /** Hạn chót sử dụng mã */
  expires_at: string;
  /** Thời điểm đổi voucher tại quầy chi nhánh */
  used_at: string | null;
  /** Khu vực áp dụng */
  applicable_region: string | null;
  /** Giá trị giảm */
  discount_amount: number | string;
}

/**
 * Một mục hàng trong đơn mua voucher.
 */
export interface AdminOrderItemDetail {
  order_item_id: number;
  order_id: number;
  program_id: number;
  quantity: number;
  unit_price: number | string;
  program_name: string;
  original_unit_price: number | string;
  partner_name: string;
  /** Danh sách các mã voucher cụ thể đã sinh ra cho mục này */
  vouchers: AdminIssuedVoucher[];
}

/**
 * Chi tiết toàn bộ đơn hàng của khách hàng.
 */
export interface AdminOrderDetail {
  /** Mã đơn hàng duy nhất */
  order_id: number;
  /** Thời điểm đặt hàng */
  created_at: string;
  /** Tổng tiền thanh toán */
  total_amount: number | string;
  /** Phương thức thanh toán (VNPAY, MOMO, COD,...) */
  payment_method: string;
  /** Trạng thái thanh toán: PAID, UNPAID, REFUNDED, FAILED */
  payment_status: "PAID" | "UNPAID" | "REFUNDED" | "FAILED";
  /** Trạng thái xử lý đơn: PENDING, COMPLETED, CANCELLED */
  order_status: "PENDING" | "COMPLETED" | "CANCELLED";
  /** Thông tin người mua */
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  /** Thông tin người nhận (nếu mua tặng) */
  recipient_id: number | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  /** Lý do hủy đơn nếu đơn bị hủy */
  cancel_reason: string | null;
  cancel_at: string | null;
  cancel_admin_name: string | null;
  /** Danh sách các voucher thuộc đơn */
  items: AdminOrderItemDetail[];
}

/**
 * Một dòng tóm tắt đơn hàng hiển thị trên bảng danh sách đơn.
 */
export interface AdminOrderListItem {
  order_id: number;
  created_at: string;
  total_amount: number | string;
  payment_method: string;
  payment_status: "PAID" | "UNPAID" | "REFUNDED" | "FAILED";
  order_status: "PENDING" | "COMPLETED" | "CANCELLED";
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

/**
 * Cấu trúc Response danh sách đơn hàng kèm thống kê và phân trang.
 */
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
    pending: number;
    cancelled: number;
  };
}
