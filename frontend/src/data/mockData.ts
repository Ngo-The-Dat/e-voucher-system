export interface Review {
  author: string;
  avatarLetter: string;
  rating: number;
  timeAgo: string;
  content: string;
  complaint?: string;
  avatarBg: string; // Tailwind class
}

export interface Voucher {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  category: string;
  thumbnail: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  rating: number;
  reviewsCount: number;
  soldCount: string;
  description?: string;
  highlights?: string[];
  conditions?: string[];
  location?: string;
  guideSteps?: string[];
  reviews?: Review[];
  featured?: boolean;
  bestSeller?: boolean;
  expiryDate?: string;
}

export interface MyVoucher {
  id: string;
  voucherId: string;
  code: string;
  datePurchased: string;
  expiryDate: string;
  status: "unused" | "used" | "expiring" | "expired" | "cancelled";
  dateUsed?: string;
  orderNumber: string;
  paymentMethod: string;
}

export const mockVouchers: Voucher[] = [];

export const mockMyVouchers: MyVoucher[] = [];

export interface CategoryPerformanceItem {
  id: string;
  name: string;
  soldCount: number;
  redeemedCount: number;
  rate: number; // percentage
  revenue: number;
}

export interface EfficiencyMetricItem {
  title: string;
  value: string;
  rate?: number; // 0 - 100 for progress bar
  description: string;
  badge?: string;
  badgeType?: "success" | "info" | "warning";
  icon: string;
  color: string;
}

export interface AdminDashboardTimeframeData {
  stats: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: string;
    color: string;
    description: string;
  }[];
  efficiencyMetrics: EfficiencyMetricItem[];
  categoryPerformance: CategoryPerformanceItem[];
}

export const mockAdminDashboardData: Record<"today" | "week" | "month", AdminDashboardTimeframeData> = {
  today: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "48.650.000 ₫",
        change: "+12.4%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với hôm qua",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "640",
        change: "+6.8%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công hôm nay",
      },
      {
        title: "Voucher đã quy đổi",
        value: "520 / 580",
        change: "89.7%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: "+85 mới",
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+1 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "89.7%",
        rate: 89.7,
        description: "520 voucher đã đổi trên tổng 580 voucher phát hành",
        badge: "Xuất sắc",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "96.5%",
        rate: 96.5,
        description: "640 đơn hoàn tất trên tổng 663 đơn khởi tạo",
        badge: "Rất cao",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "76.015 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+4.5%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "202.700 ₫",
        description: "Doanh số trung bình mỗi đối tác đạt được hôm nay",
        badge: "Đang tăng",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        soldCount: 380,
        redeemedCount: 345,
        rate: 90.8,
        revenue: 28400000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        soldCount: 110,
        redeemedCount: 98,
        rate: 89.1,
        revenue: 8690000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        soldCount: 52,
        redeemedCount: 46,
        rate: 88.5,
        revenue: 6240000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        soldCount: 22,
        redeemedCount: 19,
        rate: 86.4,
        revenue: 3820000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        soldCount: 16,
        redeemedCount: 12,
        rate: 75.0,
        revenue: 1500000,
      },
    ],
  },
  week: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "1.285.400.000 ₫",
        change: "+14.2%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với tuần trước",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "18.420",
        change: "+8.5%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công tuần này",
      },
      {
        title: "Voucher đã quy đổi",
        value: "14.150 / 16.000",
        change: "88.4%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: "+1.250 mới",
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+4 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "88.4%",
        rate: 88.4,
        description: "14.150 voucher đã đổi trên tổng 16.000 voucher phát hành",
        badge: "Tốt",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "95.2%",
        rate: 95.2,
        description: "18.420 đơn hoàn tất trên tổng 19.340 đơn khởi tạo",
        badge: "Ổn định",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "69.782 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+5.1%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "5.355.833 ₫",
        description: "Doanh số trung bình mỗi đối tác đóng góp tuần này",
        badge: "+11.3%",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        soldCount: 9800,
        redeemedCount: 8850,
        rate: 90.3,
        revenue: 785000000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        soldCount: 3600,
        redeemedCount: 3120,
        rate: 86.7,
        revenue: 215000000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        soldCount: 1450,
        redeemedCount: 1250,
        rate: 86.2,
        revenue: 154000000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        soldCount: 650,
        redeemedCount: 540,
        rate: 83.1,
        revenue: 95400000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        soldCount: 500,
        redeemedCount: 390,
        rate: 78.0,
        revenue: 36000000,
      },
    ],
  },
  month: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "5.420.000.000 ₫",
        change: "+18.6%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với tháng trước",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "74.800",
        change: "+12.0%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công tháng này",
      },
      {
        title: "Voucher đã quy đổi",
        value: "58.200 / 65.000",
        change: "89.5%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: "+5.800 mới",
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+18 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "89.5%",
        rate: 89.5,
        description: "58.200 voucher đã đổi trên tổng 65.000 voucher phát hành",
        badge: "Xuất sắc",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "96.1%",
        rate: 96.1,
        description: "74.800 đơn hoàn tất trên tổng 77.830 đơn khởi tạo",
        badge: "Rất cao",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "72.460 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+7.8%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "22.583.333 ₫",
        description: "Doanh số trung bình mỗi đối tác đóng góp trong tháng",
        badge: "+15.2%",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        soldCount: 41200,
        redeemedCount: 37400,
        rate: 90.8,
        revenue: 3310000000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        soldCount: 15100,
        redeemedCount: 13200,
        rate: 87.4,
        revenue: 905000000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        soldCount: 6200,
        redeemedCount: 5450,
        rate: 87.9,
        revenue: 658000000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        soldCount: 2800,
        redeemedCount: 2420,
        rate: 86.4,
        revenue: 412000000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        soldCount: 2100,
        redeemedCount: 1730,
        rate: 82.4,
        revenue: 135000000,
      },
    ],
  },
};

export function getCustomAdminDashboardData(startDate: string, endDate: string): AdminDashboardTimeframeData {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const dailyRevenue = 180000000;
  const totalRevenue = dailyRevenue * diffDays;
  const totalOrders = 2600 * diffDays;
  const totalIssued = 2280 * diffDays;
  const totalRedeemed = Math.round(totalIssued * 0.885);
  const newUsers = 175 * diffDays;

  return {
    stats: [
      {
        title: "Tổng doanh thu",
        value: new Intl.NumberFormat("vi-VN").format(totalRevenue) + " ₫",
        change: `Trong ${diffDays} ngày`,
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: `Từ ${startDate} đến ${endDate}`,
      },
      {
        title: "Đơn hàng hoàn tất",
        value: new Intl.NumberFormat("vi-VN").format(totalOrders),
        change: `TB ${Math.round(totalOrders / diffDays)}/ngày`,
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công trong khoảng",
      },
      {
        title: "Voucher đã quy đổi",
        value: `${new Intl.NumberFormat("vi-VN").format(totalRedeemed)} / ${new Intl.NumberFormat("vi-VN").format(totalIssued)}`,
        change: "88.5%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: `+${new Intl.NumberFormat("vi-VN").format(newUsers)} mới`,
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+4 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "88.5%",
        rate: 88.5,
        description: `${new Intl.NumberFormat("vi-VN").format(totalRedeemed)} đã đổi trên ${new Intl.NumberFormat("vi-VN").format(totalIssued)} voucher`,
        badge: "Tốt",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "95.6%",
        rate: 95.6,
        description: `${new Intl.NumberFormat("vi-VN").format(totalOrders)} đơn hoàn tất trong ${diffDays} ngày`,
        badge: "Ổn định",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: new Intl.NumberFormat("vi-VN").format(Math.round(totalRevenue / totalOrders)) + " ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng",
        badge: "Chuẩn",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: new Intl.NumberFormat("vi-VN").format(Math.round(totalRevenue / 240)) + " ₫",
        description: `Doanh số trung bình / đối tác trong ${diffDays} ngày`,
        badge: "Đang tăng",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        soldCount: Math.round(totalIssued * 0.6),
        redeemedCount: Math.round(totalRedeemed * 0.62),
        rate: 91.2,
        revenue: Math.round(totalRevenue * 0.61),
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        soldCount: Math.round(totalIssued * 0.22),
        redeemedCount: Math.round(totalRedeemed * 0.21),
        rate: 86.8,
        revenue: Math.round(totalRevenue * 0.17),
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        soldCount: Math.round(totalIssued * 0.1),
        redeemedCount: Math.round(totalRedeemed * 0.09),
        rate: 85.5,
        revenue: Math.round(totalRevenue * 0.12),
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        soldCount: Math.round(totalIssued * 0.05),
        redeemedCount: Math.round(totalRedeemed * 0.05),
        rate: 84.0,
        revenue: Math.round(totalRevenue * 0.07),
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        soldCount: Math.round(totalIssued * 0.03),
        redeemedCount: Math.round(totalRedeemed * 0.03),
        rate: 80.0,
        revenue: Math.round(totalRevenue * 0.03),
      },
    ],
  };
}

export const mockAdminStats = mockAdminDashboardData.week.stats;

