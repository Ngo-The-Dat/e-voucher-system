/**
 * @file admin-content.ts
 * @description Định nghĩa TypeScript Interfaces cho Dashboard Thống kê, Danh mục ngành hàng, Banner, Popup và Bài viết nội dung trong Quản trị Admin.
 */

// =========================================================================
// 1. DASHBOARD & BÁO CÁO THỐNG KÊ (ANALYTICS)
// =========================================================================

/**
 * Tham số truy vấn thời gian lọc Dashboard.
 */
export interface DashboardQueryParams {
  /** Khung thời gian định sẵn: hôm nay, tuần này, tháng này, tùy chỉnh */
  timeframe?: "today" | "week" | "month" | "custom";
  /** Ngày bắt đầu (YYYY-MM-DD) */
  startDate?: string;
  /** Ngày kết thúc (YYYY-MM-DD) */
  endDate?: string;
}

/**
 * Thẻ chỉ số KPI chính trên đầu trang Dashboard.
 */
export interface DashboardKpiStat {
  /** Tiêu đề chỉ số (ví dụ: Tổng doanh thu, Số voucher bán,...) */
  title: string;
  /** Giá trị hiển thị (ví dụ: "150.000.000 đ", "1.250") */
  value: string;
  /** Tỷ lệ tăng giảm so với kỳ trước */
  change: string;
  /** Xu hướng biến động: up (tăng), down (giảm), neutral (đi ngang) */
  trend: "up" | "down" | "neutral";
  /** Tên icon hiển thị */
  icon: string;
  /** Mã màu chủ đạo */
  color: string;
  /** Mô tả ngắn chi tiết */
  description: string;
}

/**
 * Chỉ số đo lường hiệu suất vận hành (tỷ lệ đổi voucher, tỷ lệ hoàn trả,...).
 */
export interface DashboardEfficiencyMetric {
  title: string;
  value: string;
  rate?: number;
  description: string;
  badge?: string;
  badgeType?: "success" | "info" | "warning";
  icon: string;
  color: string;
}

/**
 * Hiệu suất bán và đổi voucher theo từng danh mục ngành hàng.
 */
export interface DashboardCategoryPerformance {
  /** ID danh mục */
  id: string;
  /** Tên danh mục */
  name: string;
  /** Số voucher bán ra */
  soldCount: number;
  /** Số voucher đã mang đi đổi */
  redeemedCount: number;
  /** Tỷ lệ quy đổi (%) */
  rate: number;
  /** Doanh thu mang lại */
  revenue: number;
}

/**
 * Cấu trúc Response toàn bộ dữ liệu trang Dashboard Admin.
 */
export interface DashboardOverviewResponse {
  stats: DashboardKpiStat[];
  efficiencyMetrics: DashboardEfficiencyMetric[];
  categoryPerformance: DashboardCategoryPerformance[];
}

// =========================================================================
// 2. DANH MỤC NGÀNH HÀNG (CATEGORIES)
// =========================================================================

/**
 * Dòng tóm tắt danh mục trong bảng quản lý.
 */
export interface AdminCategoryListItem {
  category_id: number;
  category_name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  /** Số lượng voucher thuộc danh mục này */
  program_count: number;
}

/**
 * Thông tin voucher hiển thị bên trong chi tiết danh mục.
 */
export interface AdminCategoryVoucherItem {
  program_id: number;
  program_name: string;
  original_price: number;
  sale_price: number;
  display_status: string;
  sale_start_at: string;
  sale_end_at: string;
  partner_name: string;
}

/**
 * Chi tiết danh mục kèm danh sách các voucher thuộc danh mục.
 */
export interface AdminCategoryDetail extends AdminCategoryListItem {
  vouchers: AdminCategoryVoucherItem[];
}

/**
 * Cấu trúc Response danh sách danh mục có phân trang.
 */
export interface CategoriesResponse {
  categories: AdminCategoryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =========================================================================
// 3. BANNER QUẢNG CÁO (BANNERS)
// =========================================================================

/**
 * Dòng tóm tắt banner trong danh sách.
 */
export interface AdminBannerListItem {
  banner_id: number;
  program_id: number;
  program_name: string;
  title: string;
  image_url: string;
  target_url: string;
  display_position: string;
  display_from: string | null;
  display_to: string | null;
  status: "ACTIVE" | "INACTIVE";
}

/**
 * Chi tiết banner quảng cáo.
 */
export interface AdminBannerDetail extends AdminBannerListItem {}

/**
 * Cấu trúc Response danh sách banner có phân trang.
 */
export interface BannersResponse {
  banners: AdminBannerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =========================================================================
// 4. POPUP QUẢNG CÁO (POPUPS)
// =========================================================================

/**
 * Dòng tóm tắt popup trong danh sách.
 */
export interface AdminPopupListItem {
  popup_id: number;
  program_id: number;
  program_name: string;
  title: string;
  content: string;
  target_url: string;
  image_url: string;
  start_at: string | null;
  end_at: string | null;
  status: "ACTIVE" | "INACTIVE";
}

/**
 * Chi tiết popup quảng cáo.
 */
export interface AdminPopupDetail extends AdminPopupListItem {}

/**
 * Cấu trúc Response danh sách popup có phân trang.
 */
export interface PopupsResponse {
  popups: AdminPopupListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =========================================================================
// 5. BÀI VIẾT & CHÍNH SÁCH NỘI DUNG (CONTENT & ARTICLES)
// =========================================================================

/**
 * Dòng tóm tắt bài viết / điều khoản chính sách trong danh sách.
 */
export interface AdminContentListItem {
  content_id: number;
  program_id: number;
  program_name: string;
  title: string;
  body: string;
  content_type: "POLICY" | "ARTICLE";
  created_at: string;
  updated_at: string | null;
  status: "ACTIVE" | "INACTIVE";
}

/**
 * Chi tiết bài viết / chính sách.
 */
export interface AdminContentDetail extends AdminContentListItem {}

/**
 * Cấu trúc Response danh sách bài viết / chính sách có phân trang.
 */
export interface ContentsResponse {
  contents: AdminContentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =========================================================================
// 6. TÙY CHỌN VOUCHER HELPER (DROPDOWN OPTIONS)
// =========================================================================

/**
 * Tùy chọn voucher rút gọn phục vụ chọn trong dropdown selector khi tạo Banner/Popup.
 */
export interface VoucherProgramOption {
  program_id: number;
  program_name: string;
  category_id: number | null;
  category_name?: string | null;
  original_price: number;
  sale_price: number;
  display_status: string;
  partner_name: string;
}
