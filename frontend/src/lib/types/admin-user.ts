/**
 * @file admin-user.ts
 * @description Định nghĩa TypeScript Interfaces cho Người dùng (Users) và Nhật ký Hệ thống (System Logs) trong Quản trị Admin.
 */

/**
 * Thông tin tóm tắt của người dùng trong danh sách quản lý.
 */
export interface AdminUserListItem {
  /** Mã định danh người dùng duy nhất (Khóa chính) */
  user_id: number;
  /** Họ và tên đầy đủ */
  full_name: string;
  /** Email đăng nhập */
  email: string;
  /** Số điện thoại liên hệ */
  phone: string | null;
  /** Vai trò trong hệ thống: ADMIN, PARTNER, PARTNER_EMPLOYEE, CUSTOMER */
  role: string;
  /** Trạng thái tài khoản: ACTIVE (Hoạt động), LOCKED (Bị khóa) */
  status: string;
  /** Giới tính: MALE, FEMALE, OTHER */
  gender: string | null;
  /** Quốc tịch */
  nationality: string | null;
  /** Số CMND / CCCD / Hộ chiếu */
  identity_no: string | null;
  /** Thời điểm tạo tài khoản (ISO String) */
  created_at: string;
  /** Thời điểm đăng nhập gần nhất */
  last_login_at: string | null;
}

/**
 * Thông tin chi tiết của người dùng khi xem màn hình xem chi tiết hoặc chỉnh sửa.
 */
export interface AdminUserDetail extends AdminUserListItem {
  /** Lý do khóa tài khoản (nếu tài khoản đang ở trạng thái LOCKED) */
  lock_reason: string | null;
  /** Tên thương hiệu/doanh nghiệp (nếu là tài khoản Đối tác) */
  business_name?: string | null;
  /** Mã số thuế doanh nghiệp (nếu là tài khoản Đối tác) */
  tax_code?: string | null;
}

/**
 * Cấu trúc Response trả về từ API lấy danh sách người dùng kèm phân trang.
 */
export interface UsersResponse {
  /** Mảng danh sách người dùng */
  users: AdminUserListItem[];
  /** Thông tin phân trang */
  pagination: {
    /** Trang hiện tại (1-based) */
    page: number;
    /** Số bản ghi trên mỗi trang */
    limit: number;
    /** Tổng số bản ghi thỏa mãn điều kiện lọc */
    total: number;
    /** Tổng số trang */
    totalPages: number;
  };
}

/**
 * Một bản ghi nhật ký thao tác (Audit Log) của hệ thống.
 */
export interface SystemLogItem {
  /** Mã định danh nhật ký */
  log_id: string;
  /** Mã người dùng thực hiện thao tác */
  user_id: string;
  /** Tên người dùng thực hiện */
  user_name: string;
  /** Vai trò của người thực hiện */
  user_role?: string;
  /** Tên hành động (CREATE, UPDATE, DELETE, LOCK, APPROVE,...) */
  action: string;
  /** Mã định danh của đối tượng bị tác động (user_id, voucher_id,...) */
  object_id: string | null;
  /** Loại đối tượng (USER, VOUCHER, ORDER, PARTNER,...) */
  object_type: string | null;
  /** Giá trị cũ trước khi thay đổi (Dùng để so sánh diff) */
  old_value: any;
  /** Giá trị mới sau khi thay đổi */
  new_value: any;
  /** Thời điểm thực hiện hành động */
  performed_at: string;
  /** Kết quả thao tác: SUCCESS (Thành công) hoặc FAILED (Thất bại) */
  result: "SUCCESS" | "FAILED";
}

/**
 * Chi tiết bản ghi nhật ký hệ thống.
 */
export interface SystemLogDetail extends SystemLogItem {}

/**
 * Cấu trúc Response trả về từ API lấy danh sách nhật ký hệ thống kèm phân trang.
 */
export interface LogsResponse {
  /** Danh sách các bản ghi nhật ký */
  logs: SystemLogItem[];
  /** Thông tin phân trang */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
