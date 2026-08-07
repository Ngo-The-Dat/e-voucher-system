import { useState, useEffect } from "react";

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
      setStats([
        {
          title: "Tổng doanh thu",
          value: hasData ? "1.285.400.000 ₫" : "Chưa có dữ liệu",
          change: hasData ? "+14.2%" : "0%",
          trend: hasData ? "up" : "neutral",
          icon: "payments",
          color: "bg-blue-50 text-blue-600",
          description: "Doanh thu sàn giao dịch",
        },
        {
          title: "Đơn hàng hoàn tất",
          value: hasData ? "18.420" : "Chưa có dữ liệu",
          change: hasData ? "+8.5%" : "0%",
          trend: hasData ? "up" : "neutral",
          icon: "shopping_bag",
          color: "bg-emerald-50 text-emerald-600",
          description: "Đơn thành công trong kỳ",
        },
        {
          title: "Voucher đã quy đổi",
          value: hasData ? "14.150 / 16.000" : "Chưa có dữ liệu",
          change: hasData ? "88.4%" : "0%",
          trend: "neutral",
          icon: "confirmation_number",
          color: "bg-amber-50 text-amber-600",
          description: "Tỷ lệ quy đổi voucher",
        },
        {
          title: "Khách hàng",
          value: hasData ? "125.400" : "Chưa có dữ liệu",
          change: hasData ? "+1.250 mới" : "0 mới",
          trend: hasData ? "up" : "neutral",
          icon: "group",
          color: "bg-purple-50 text-purple-600",
          description: "Tổng tài khoản người dùng",
        },
        {
          title: "Đối tác hoạt động",
          value: hasData ? "240 đối tác" : "Chưa có dữ liệu",
          change: hasData ? "+4 chờ duyệt" : "0 chờ duyệt",
          trend: hasData ? "up" : "neutral",
          icon: "store",
          color: "bg-indigo-50 text-indigo-600",
          description: "Thương hiệu & điểm bán",
        },
      ]);

      setPendingApprovals([
        {
          id: "P-892",
          name: "Tập đoàn Ẩm thực Golden Gate",
          type: "Đối tác thương hiệu",
          date: "03/08/2026",
          status: "Chờ duyệt hồ sơ",
          link: "/admin/partners/pending",
        },
        {
          id: "V-1024",
          name: "Voucher giảm 50k Bánh mì Huỳnh Hoa",
          type: "Duyệt chiến dịch Voucher",
          date: "03/08/2026",
          status: "Chờ kiểm duyệt nội dung",
          link: "/admin/vouchers/pending",
        },
        {
          id: "P-890",
          name: "Chuỗi Cà phê Highlands Coffee",
          type: "Cập nhật tài khoản doanh nghiệp",
          date: "02/08/2026",
          status: "Chờ xác minh thuế",
          link: "/admin/partners/pending",
        },
      ]);

      setChartData([
        { label: "T2", issue: 65, redeem: 50, revenue: 120, orders: 85 },
        { label: "T3", issue: 80, redeem: 70, revenue: 155, orders: 110 },
        { label: "T4", issue: 45, redeem: 38, revenue: 95, orders: 65 },
        { label: "T5", issue: 90, redeem: 82, revenue: 180, orders: 130 },
        { label: "T6", issue: 100, redeem: 95, revenue: 210, orders: 150 },
        { label: "T7", issue: 120, redeem: 110, revenue: 260, orders: 190 },
        { label: "CN", issue: 115, redeem: 105, revenue: 240, orders: 175 },
      ]);

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
