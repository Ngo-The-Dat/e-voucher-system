/**
 * @file admin-partner.ts
 * @description Định nghĩa TypeScript Interfaces cho Đối tác (Partners), Chi nhánh (Branches) và Nhân viên chi nhánh (Partner Employees) trong Quản trị Admin.
 */

/**
 * Thông tin tóm tắt của đối tác doanh nghiệp trên danh sách quản lý.
 */
export interface AdminPartnerListItem {
  /** Mã định danh tài khoản đối tác */
  user_id: number;
  /** Tên thương hiệu / Tên công ty đăng ký */
  business_name: string;
  /** Mã số thuế doanh nghiệp */
  tax_code: string;
  /** Trạng thái xét duyệt hồ sơ: PENDING (Chờ duyệt), APPROVED (Đã duyệt), REJECTED (Từ chối), REVISION_REQUESTED (Yêu cầu sửa đổi) */
  approval_status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  /** Trạng thái hoạt động kinh doanh: ACTIVE (Bình thường), INACTIVE (Tạm ngưng), LOCKED (Bị khóa vi phạm) */
  activity_status: "ACTIVE" | "INACTIVE" | "LOCKED";
  /** Thời điểm nộp hồ sơ đăng ký đối tác */
  registered_at: string;
  /** Số Giấy chứng nhận đăng ký kinh doanh */
  business_license_no: string | null;
  /** Ngày cấp giấy phép */
  license_issue_date: string | null;
  /** Nơi cấp giấy phép */
  license_issue_place: string | null;
  /** Họ tên người đại diện pháp luật */
  representative_name: string;
  /** Email liên hệ chính */
  email: string;
  /** Số điện thoại hotline / người đại diện */
  phone: string | null;
  /** Tổng số chi nhánh đang hoạt động */
  branches_count?: number;
  /** Tổng số chương trình voucher đã tạo */
  voucher_programs_count?: number;
  /** Trạng thái tài khoản người dùng */
  user_status?: string;
}

/**
 * Thông tin một chi nhánh cửa hàng của đối tác (nơi khách hàng mang voucher đến đổi).
 */
export interface AdminBranchItem {
  /** Mã chi nhánh */
  branch_id: number;
  /** Tên chi nhánh (ví dụ: Chi nhánh Quận 1, Chi nhánh Cầu Giấy,...) */
  branch_name: string;
  /** Địa chỉ cụ thể */
  address: string;
  /** Khu vực / Tỉnh thành (Hà Nội, TP.HCM,...) */
  region: string | null;
  /** Số điện thoại chi nhánh */
  phone: string | null;
  /** Trạng thái chi nhánh: ACTIVE, INACTIVE */
  status: "ACTIVE" | "INACTIVE";
}

/**
 * Tóm tắt một chương trình Voucher thuộc sở hữu của đối tác.
 */
export interface AdminVoucherProgramItem {
  /** Mã chiến dịch voucher */
  program_id: number;
  /** Tên chiến dịch voucher */
  program_name: string;
  /** Giá niêm yết gốc */
  original_price: string | number;
  /** Giá ưu đãi bán cho khách */
  sale_price: string | number;
  /** Tổng số lượng phát hành */
  issue_quantity: number;
  /** Trạng thái hiển thị (PUBLISHED, HIDDEN, ENDED) */
  display_status: string;
  /** Ngày bắt đầu mở bán */
  sale_start_at: string;
  /** Ngày kết thúc mở bán */
  sale_end_at: string;
}

/**
 * Toàn bộ hồ sơ chi tiết của đối tác phục vụ việc thẩm định và quản lý.
 */
export interface AdminPartnerDetail extends AdminPartnerListItem {
  /** Số CCCD / CMND của người đại diện */
  identity_no?: string | null;
  /** Giới tính người đại diện */
  gender?: string | null;
  /** Quốc tịch */
  nationality?: string | null;
  /** Lý do khóa hoạt động nếu đối tác bị khóa */
  lock_reason?: string | null;
  /** Danh sách các chi nhánh của đối tác */
  branches?: AdminBranchItem[];
  /** Danh sách các chiến dịch voucher của đối tác */
  voucher_programs?: AdminVoucherProgramItem[];
}

/**
 * Cấu trúc Response trả về từ API danh sách đối tác.
 */
export interface PartnersResponse {
  partners: AdminPartnerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Thông tin nhân viên chi nhánh gửi yêu cầu duyệt tài khoản.
 */
export interface AdminPendingEmployeeListItem {
  /** Mã user của nhân viên */
  user_id: number;
  /** Họ và tên nhân viên */
  full_name: string;
  /** Email đăng nhập */
  email: string;
  /** Số điện thoại */
  phone?: string | null;
  /** Số CCCD */
  identity_no?: string | null;
  /** Giới tính */
  gender?: string | null;
  /** Quốc tịch */
  nationality?: string | null;
  /** Trạng thái tài khoản người dùng */
  account_status: string;
  /** Ngày tạo tài khoản */
  created_at: string;
  /** Mã yêu cầu phê duyệt */
  approval_request_id?: number | null;
  /** Trạng thái xét duyệt: PENDING, APPROVED, REJECTED */
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  /** Thời điểm gửi yêu cầu duyệt */
  submitted_at: string;
  /** Thời điểm Admin duyệt / từ chối */
  reviewed_at?: string | null;
  /** Phản hồi lý do của Admin */
  admin_feedback?: string | null;
  /** Mã chi nhánh nhân viên làm việc */
  branch_id: number;
  /** Tên chi nhánh */
  branch_name: string;
  /** Địa chỉ chi nhánh */
  branch_address: string;
  /** Hotline chi nhánh */
  branch_phone?: string | null;
  /** Mã đối tác sở hữu chi nhánh */
  partner_id: number;
  /** Tên doanh nghiệp đối tác */
  business_name: string;
  /** Mã số thuế doanh nghiệp */
  tax_code: string;
}

/**
 * Chi tiết hồ sơ nhân viên chi nhánh chờ duyệt.
 */
export interface AdminPendingEmployeeDetail extends AdminPendingEmployeeListItem {
  /** Lần đăng nhập cuối */
  last_login_at?: string | null;
  /** Tên Admin đã xét duyệt */
  reviewer_name?: string | null;
  /** Khu vực chi nhánh */
  branch_region?: string | null;
  /** Trạng thái hoạt động của chi nhánh */
  branch_status?: string;
  /** Logo thương hiệu đối tác */
  brand_logo?: string | null;
  /** Trạng thái hoạt động của đối tác */
  partner_activity_status?: string;
  /** Giấy phép kinh doanh của đối tác */
  business_license_no?: string | null;
}

/**
 * Cấu trúc Response trả về từ API danh sách nhân viên chờ duyệt.
 */
export interface EmployeesResponse {
  employees: AdminPendingEmployeeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
