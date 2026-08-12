import { useState, useEffect } from "react";
import {
  mockAdminDashboardData,
  getCustomAdminDashboardData,
  CategoryPerformanceItem,
  EfficiencyMetricItem,
} from "@/data/mockData";

export interface UseAdminDashboardOptions {
  timeframe?: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
}

export function useAdminDashboard(options: UseAdminDashboardOptions = {}) {
  const { timeframe = "week", startDate = "2026-08-01", endDate = "2026-08-05" } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  // Data states
  const [stats, setStats] = useState<any[]>([]);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetricItem[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformanceItem[]>([]);

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      // Check invalid custom date range
      if (timeframe === "custom" && startDate && endDate && startDate > endDate) {
        setStats([]);
        setEfficiencyMetrics([]);
        setCategoryPerformance([]);
        setHasData(false);
        setIsLoading(false);
        return;
      }

      let data;
      if (timeframe === "custom" && startDate && endDate) {
        data = getCustomAdminDashboardData(startDate, endDate);
      } else {
        data = mockAdminDashboardData[timeframe as "today" | "week" | "month"] || mockAdminDashboardData.week;
      }

      if (hasData) {
        setStats(data.stats);
        setEfficiencyMetrics(data.efficiencyMetrics);
        setCategoryPerformance(data.categoryPerformance);
      } else {
        setStats(
          data.stats.map((stat) => ({
            ...stat,
            value: "0",
            change: "0%",
            trend: "neutral",
            description: "Chưa có dữ liệu trong kỳ",
          }))
        );
        setEfficiencyMetrics([]);
        setCategoryPerformance([]);
      }

      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [timeframe, startDate, endDate, hasData]);

  return {
    isLoading,
    hasData,
    setHasData,
    stats,
    efficiencyMetrics,
    categoryPerformance,
  };
}
