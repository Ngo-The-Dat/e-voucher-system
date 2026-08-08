import { useState, useEffect } from "react";
import { mockAdminStats, mockAdminPendingApprovals, mockAdminChartData } from "@/data/mockData";

export function useAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  // Mocked state
  const [stats, setStats] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setStats(
        mockAdminStats.map((stat) => ({
          ...stat,
          value: hasData ? stat.value : "Chưa có dữ liệu",
          change: hasData ? stat.change : "0%",
          trend: hasData ? stat.trend : "neutral",
        }))
      );

      setPendingApprovals(mockAdminPendingApprovals);
      setChartData(mockAdminChartData);

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [hasData]);

  return {
    isLoading,
    hasData,
    setHasData,
    stats,
    pendingApprovals,
    chartData,
  };
}

