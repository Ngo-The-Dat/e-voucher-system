/**
 * =========================================================================================
 * FILE: useAdminDashboard.ts
 * VỊ TRÍ: frontend/src/hooks/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Custom Hook chuyên trách quản lý trạng thái và luồng dữ liệu của trang Dashboard Tổng quan Admin.
 *   - Đóng gói toàn bộ logic gọi API báo cáo thống kê, tự động xử lý lọc theo khung thời gian,
 *     kiểm tra tính hợp lệ của ngày tháng (Validation) và cung cấp hàm tải lại dữ liệu (Refetch).
 * 
 * DỮ LIỆU CUNG CẤP CHO GIAO DIỆN:
 *   1. Stats (Thẻ KPI đầu trang): Tổng doanh thu, Số voucher đã bán, Tỷ lệ đổi voucher, Người dùng mới,...
 *   2. Efficiency Metrics (Chỉ số hiệu quả): Tỷ lệ lấp đầy, Tỷ lệ hoàn đơn, Thời gian xử lý đơn,...
 *   3. Category Performance (Biểu đồ ngành hàng): Doanh số và số lượng voucher theo từng danh mục.
 * =========================================================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  DashboardKpiStat,
  DashboardEfficiencyMetric,
  DashboardCategoryPerformance,
} from "@/lib/admin-api";

/**
 * Tùy chọn tham số đầu vào khi sử dụng Hook `useAdminDashboard`.
 */
export interface UseAdminDashboardOptions {
  /** 
   * Khung thời gian cần thống kê:
   * - "today": Thống kê trong ngày hôm nay
   * - "week": Thống kê 7 ngày gần nhất (Mặc định)
   * - "month": Thống kê 30 ngày gần nhất
   * - "custom": Tùy chỉnh theo khoảng ngày từ `startDate` đến `endDate`
   */
  timeframe?: "today" | "week" | "month" | "custom";
  /** Ngày bắt đầu thống kê (Định dạng YYYY-MM-DD, dùng khi timeframe = "custom") */
  startDate?: string;
  /** Ngày kết thúc thống kê (Định dạng YYYY-MM-DD, dùng khi timeframe = "custom") */
  endDate?: string;
}

/**
 * Custom Hook truy xuất và quản lý dữ liệu Dashboard Admin.
 * 
 * @param options Tùy chọn bộ lọc thời gian
 * @returns Đối tượng chứa trạng thái loading, lỗi, các tập dữ liệu KPI và hàm refetch
 */
export function useAdminDashboard(options: UseAdminDashboardOptions = {}) {
  // Trích xuất tùy chọn thời gian, mặc định là thống kê theo tuần ("week")
  const { timeframe = "week", startDate, endDate } = options;

  // ─── 1. CÁC STATE QUẢN LÝ TRẠNG THÁI (STATUS STATES) ────────────────────────
  /** Trạng thái đang tải dữ liệu từ máy chủ (true: hiển thị skeleton loading) */
  const [isLoading, setIsLoading] = useState(true);

  /** Chuỗi thông báo lỗi nếu quá trình gọi API gặp sự cố (null nếu không có lỗi) */
  const [error, setError] = useState<string | null>(null);

  // ─── 2. CÁC STATE LƯU TRỮ DỮ LIỆU THỐNG KÊ (DATA STATES) ─────────────────────
  /** Danh sách các thẻ chỉ số KPI chính */
  const [stats, setStats] = useState<DashboardKpiStat[]>([]);

  /** Danh sách các chỉ số đo lường hiệu suất vận hành */
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<DashboardEfficiencyMetric[]>([]);

  /** Dữ liệu hiệu suất bán & quy đổi theo từng danh mục ngành hàng */
  const [categoryPerformance, setCategoryPerformance] = useState<DashboardCategoryPerformance[]>([]);

  // ─── 3. HÀM GỌI API LẤY DỮ LIỆU (FETCH FUNCTION) ─────────────────────────────
  /**
   * Hàm gọi Backend API lấy dữ liệu tổng hợp cho Dashboard.
   * Sử dụng `useCallback` để ghi nhớ tham chiếu hàm, tránh re-render lặp vô tận.
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Kiểm tra tính hợp lệ khi người dùng chọn lọc khoảng ngày tùy chỉnh (Client Validation)
    if (timeframe === "custom") {
      // Nếu chưa chọn đủ cả 2 ngày bắt đầu và kết thúc -> Tạm dừng không gọi API
      if (!startDate || !endDate) {
        setIsLoading(false);
        return;
      }
      // Nếu ngày bắt đầu lớn hơn ngày kết thúc -> Báo lỗi và xóa dữ liệu cũ
      if (startDate > endDate) {
        setStats([]);
        setEfficiencyMetrics([]);
        setCategoryPerformance([]);
        setIsLoading(false);
        setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        return;
      }
    }

    try {
      // Gọi API Client của phân hệ Admin
      const data = await adminApi.getDashboardOverview({
        timeframe,
        startDate: timeframe === "custom" ? startDate : undefined,
        endDate: timeframe === "custom" ? endDate : undefined,
      });

      // Cập nhật dữ liệu nhận được vào state
      setStats(data.stats || []);
      setEfficiencyMetrics(data.efficiencyMetrics || []);
      setCategoryPerformance(data.categoryPerformance || []);
    } catch (err: any) {
      // Ghi log lỗi vào console trình duyệt để hỗ trợ debug
      console.error("Lỗi khi tải dữ liệu dashboard admin:", err);
      // Hiển thị thông báo lỗi thân thiện cho Admin
      setError(err?.message || "Không thể kết nối đến máy chủ.");
      setStats([]);
      setEfficiencyMetrics([]);
      setCategoryPerformance([]);
    } finally {
      // Luôn tắt trạng thái loading sau khi gọi xong (dù thành công hay thất bại)
      setIsLoading(false);
    }
  }, [timeframe, startDate, endDate]);

  // ─── 4. TỰ ĐỘNG TẢI DỮ LIỆU KHI THAY ĐỔI BỘ LỌC (EFFECT) ───────────────────
  // Mỗi khi `timeframe`, `startDate` hoặc `endDate` thay đổi, `fetchDashboardData` sẽ được kích hoạt lại
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── 5. TRẢ VỀ DỮ LIỆU VÀ HÀM CHO GIAO DIỆN (HOOK RETURN) ───────────────────
  return {
    /** Đang tải dữ liệu */
    isLoading,
    /** Thông báo lỗi nếu có */
    error,
    /** Dữ liệu các thẻ KPI */
    stats,
    /** Dữ liệu các chỉ số hiệu suất */
    efficiencyMetrics,
    /** Dữ liệu thống kê theo ngành hàng */
    categoryPerformance,
    /** Hàm chủ động tải lại dữ liệu mới nhất (gắn vào nút Refresh trên giao diện) */
    refetch: fetchDashboardData,
  };
}
