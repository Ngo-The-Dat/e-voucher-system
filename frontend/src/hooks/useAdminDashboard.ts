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
  const [hasData, setHasData] = useState(true);

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
        setHasData(false);
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

      const hasStats = Boolean(data.stats && data.stats.length > 0);
      const hasMetrics = Boolean(data.efficiencyMetrics && data.efficiencyMetrics.length > 0);
      const hasCategories = Boolean(data.categoryPerformance && data.categoryPerformance.length > 0);

      setStats(data.stats || []);
      setEfficiencyMetrics(data.efficiencyMetrics || []);
      setCategoryPerformance(data.categoryPerformance || []);
      setHasData(hasStats || hasMetrics || hasCategories);
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu dashboard admin:", err);
      setError(err?.message || "Không thể tải dữ liệu dashboard.");
      setStats([]);
      setEfficiencyMetrics([]);
      setCategoryPerformance([]);
      setHasData(false);
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
    hasData,
    setHasData,
    stats,
    efficiencyMetrics,
    categoryPerformance,
    refetch: fetchDashboardData,
  };
}
