import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  DashboardKpiStat,
  DashboardEfficiencyMetric,
  DashboardCategoryPerformance,
} from "@/lib/admin-api";

export interface UseAdminDashboardOptions {
  timeframe?: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}

export function useAdminDashboard(options: UseAdminDashboardOptions = {}) {
  const { timeframe = "week", startDate, endDate } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<DashboardKpiStat[]>([]);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<DashboardEfficiencyMetric[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<DashboardCategoryPerformance[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Kiểm tra khoảng thời gian tùy chọn
    if (timeframe === "custom") {
      if (!startDate || !endDate) {
        setIsLoading(false);
        return;
      }
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
      const data = await adminApi.getDashboardOverview({
        timeframe,
        startDate: timeframe === "custom" ? startDate : undefined,
        endDate: timeframe === "custom" ? endDate : undefined,
      });

      setStats(data.stats || []);
      setEfficiencyMetrics(data.efficiencyMetrics || []);
      setCategoryPerformance(data.categoryPerformance || []);
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu dashboard admin:", err);
      setError(err?.message || "Không thể kết nối đến máy chủ.");
      setStats([]);
      setEfficiencyMetrics([]);
      setCategoryPerformance([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    isLoading,
    error,
    stats,
    efficiencyMetrics,
    categoryPerformance,
    refetch: fetchDashboardData,
  };
}
