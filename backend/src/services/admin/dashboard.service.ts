import pool from '../../config/db.js';

export interface DashboardParams {
  timeframe?: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface KpiStatItem {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  description: string;
}

export interface EfficiencyMetricItem {
  title: string;
  value: string;
  rate?: number; // 0 - 100
  description: string;
  badge?: string;
  badgeType?: 'success' | 'info' | 'warning';
  icon: string;
  color: string;
}

export interface CategoryPerformanceItem {
  id: string;
  name: string;
  soldCount: number;
  redeemedCount: number;
  rate: number; // percentage
  revenue: number;
}

export interface DashboardOverviewResponse {
  stats: KpiStatItem[];
  efficiencyMetrics: EfficiencyMetricItem[];
  categoryPerformance: CategoryPerformanceItem[];
}

function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

function getDateRange(params: DashboardParams): {
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date;
  prevEnd: Date;
  timeframe: 'today' | 'week' | 'month' | 'custom';
} {
  const now = new Date();
  const timeframe = params.timeframe || 'week';

  let currentStart: Date;
  let currentEnd: Date;
  let prevStart: Date;
  let prevEnd: Date;

  if (timeframe === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (timeframe === 'month') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (timeframe === 'custom' && params.startDate && params.endDate) {
    currentStart = new Date(params.startDate + 'T00:00:00');
    currentEnd = new Date(params.endDate + 'T23:59:59.999');
    const diffMs = currentEnd.getTime() - currentStart.getTime();
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - diffMs);
  } else {
    // default: 'week' (Monday to Sunday or last 7 days)
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);
    currentEnd.setHours(23, 59, 59, 999);

    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 7);
  }

  return { currentStart, currentEnd, prevStart, prevEnd, timeframe };
}

function calculateChange(current: number, previous: number): { change: string; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    if (current === 0) return { change: '0%', trend: 'neutral' };
    return { change: '+100%', trend: 'up' };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded > 0) {
    return { change: `+${rounded}%`, trend: 'up' };
  } else if (rounded < 0) {
    return { change: `${rounded}%`, trend: 'down' };
  }
  return { change: '0%', trend: 'neutral' };
}

export async function getDashboardOverview(params: DashboardParams): Promise<DashboardOverviewResponse> {
  const { currentStart, currentEnd, prevStart, prevEnd, timeframe } = getDateRange(params);

  // 1. Tổng doanh thu & Tổng đơn hàng (trong kỳ hiện tại vs kỳ trước)
  const revenueOrdersRes = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN created_at >= $1 AND created_at <= $2 AND payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) AS current_rev,
       COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at <= $4 AND payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) AS prev_rev,
       COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2 AND (order_status = 'COMPLETED' OR payment_status = 'PAID')) AS current_completed_orders,
       COUNT(*) FILTER (WHERE created_at >= $3 AND created_at <= $4 AND (order_status = 'COMPLETED' OR payment_status = 'PAID')) AS prev_completed_orders,
       COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) AS current_total_orders
     FROM orders`,
    [currentStart, currentEnd, prevStart, prevEnd]
  );
  const rowRev = revenueOrdersRes.rows[0] || {};
  const currentRev = parseFloat(rowRev.current_rev || '0');
  const prevRev = parseFloat(rowRev.prev_rev || '0');
  const revChange = calculateChange(currentRev, prevRev);

  const currentCompletedOrders = parseInt(rowRev.current_completed_orders || '0', 10);
  const prevCompletedOrders = parseInt(rowRev.prev_completed_orders || '0', 10);
  const ordersChange = calculateChange(currentCompletedOrders, prevCompletedOrders);
  const currentTotalOrders = parseInt(rowRev.current_total_orders || '0', 10);

  // 2. Voucher đã quy đổi / phát hành
  const vouchersRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE issued_at >= $1 AND issued_at <= $2) AS current_issued,
       COUNT(*) FILTER (WHERE usage_status = 'USED' AND used_at >= $1 AND used_at <= $2) AS current_redeemed
     FROM issued_vouchers`,
    [currentStart, currentEnd]
  );
  const rowVouchers = vouchersRes.rows[0] || {};
  const currentIssued = parseInt(rowVouchers.current_issued || '0', 10);
  const currentRedeemed = parseInt(rowVouchers.current_redeemed || '0', 10);
  const redeemRateNum = currentIssued > 0 ? Math.round((currentRedeemed / currentIssued) * 1000) / 10 : 0;
  const redeemRate = currentIssued > 0 ? `${redeemRateNum.toFixed(1)}%` : '0%';

  // 3. Khách hàng
  const customersRes = await pool.query(
    `SELECT
       COUNT(*) AS total_customers,
       COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) AS new_customers
     FROM users
     WHERE role = 'CUSTOMER'`,
    [currentStart, currentEnd]
  );
  const rowCustomers = customersRes.rows[0] || {};
  const totalCustomers = parseInt(rowCustomers.total_customers || '0', 10);
  const newCustomers = parseInt(rowCustomers.new_customers || '0', 10);

  // 4. Đối tác hoạt động
  const partnersRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE approval_status = 'APPROVED') AS active_partners,
       COUNT(*) FILTER (WHERE approval_status = 'PENDING' AND registered_at >= $1 AND registered_at <= $2) AS new_pending_partners,
       COUNT(*) FILTER (WHERE approval_status = 'PENDING') AS total_pending_partners
     FROM partners`,
    [currentStart, currentEnd]
  );
  const rowPartners = partnersRes.rows[0] || {};
  const activePartners = parseInt(rowPartners.active_partners || '0', 10);
  const pendingPartners = parseInt(rowPartners.new_pending_partners || '0', 10) || parseInt(rowPartners.total_pending_partners || '0', 10);

  // Mô tả kỳ so sánh
  let comparisonPeriod = 'kỳ trước';
  if (timeframe === 'today') comparisonPeriod = 'hôm qua';
  else if (timeframe === 'week') comparisonPeriod = 'tuần trước';
  else if (timeframe === 'month') comparisonPeriod = 'tháng trước';
  else if (timeframe === 'custom' && params.startDate && params.endDate) {
    comparisonPeriod = `khoảng trước (${params.startDate} - ${params.endDate})`;
  }

  // 5 Thẻ KPI
  const stats: KpiStatItem[] = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrencyVND(currentRev),
      change: revChange.change,
      trend: revChange.trend,
      icon: 'payments',
      color: 'bg-blue-50 text-blue-600',
      description: `So với ${comparisonPeriod}`,
    },
    {
      title: 'Đơn hàng hoàn tất',
      value: formatNumber(currentCompletedOrders),
      change: ordersChange.change,
      trend: ordersChange.trend,
      icon: 'shopping_bag',
      color: 'bg-emerald-50 text-emerald-600',
      description: `Đơn thành công trong ${timeframe === 'today' ? 'ngày' : 'kỳ'}`,
    },
    {
      title: 'Voucher đã quy đổi',
      value: `${formatNumber(currentRedeemed)} / ${formatNumber(currentIssued)}`,
      change: redeemRate,
      trend: 'neutral',
      icon: 'confirmation_number',
      color: 'bg-amber-50 text-amber-600',
      description: 'Tỷ lệ quy đổi voucher',
    },
    {
      title: 'Khách hàng',
      value: formatNumber(totalCustomers),
      change: `+${formatNumber(newCustomers)} mới`,
      trend: newCustomers > 0 ? 'up' : 'neutral',
      icon: 'group',
      color: 'bg-purple-50 text-purple-600',
      description: 'Tổng tài khoản người dùng',
    },
    {
      title: 'Đối tác hoạt động',
      value: `${formatNumber(activePartners)} đối tác`,
      change: `+${formatNumber(pendingPartners)} chờ duyệt`,
      trend: pendingPartners > 0 ? 'up' : 'neutral',
      icon: 'store',
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Thương hiệu & điểm bán',
    },
  ];

  // 4 Chỉ số hiệu quả vận hành (Operational Efficiency Metrics)
  const orderCompletionRate = currentTotalOrders > 0
    ? Math.round((currentCompletedOrders / currentTotalOrders) * 1000) / 10
    : 0;

  const aov = currentCompletedOrders > 0 ? Math.round(currentRev / currentCompletedOrders) : 0;
  const prevAov = prevCompletedOrders > 0 ? Math.round(prevRev / prevCompletedOrders) : 0;
  const aovChange = calculateChange(aov, prevAov);

  const revPerPartner = activePartners > 0 ? Math.round(currentRev / activePartners) : 0;
  const prevRevPerPartner = activePartners > 0 ? Math.round(prevRev / activePartners) : 0;
  const revPerPartnerChange = calculateChange(revPerPartner, prevRevPerPartner);

  const redeemBadge = currentIssued === 0 ? 'Chưa phát hành' : redeemRateNum >= 85 ? 'Xuất sắc' : redeemRateNum >= 70 ? 'Tốt' : 'Trung bình';
  const redeemBadgeType: 'success' | 'info' | 'warning' = currentIssued === 0 ? 'info' : redeemRateNum >= 70 ? 'success' : 'info';

  const orderCompletionBadge = currentTotalOrders === 0 ? 'Chưa có đơn' : orderCompletionRate >= 95 ? 'Rất cao' : orderCompletionRate >= 80 ? 'Ổn định' : 'Cần cải thiện';
  const orderCompletionBadgeType: 'success' | 'info' | 'warning' = currentTotalOrders === 0 ? 'info' : orderCompletionRate >= 80 ? 'success' : 'warning';

  const efficiencyMetrics: EfficiencyMetricItem[] = [
    {
      title: 'Tỷ lệ quy đổi Voucher',
      value: `${redeemRateNum.toFixed(1)}%`,
      rate: redeemRateNum,
      description: `${formatNumber(currentRedeemed)} voucher đã đổi trên tổng ${formatNumber(currentIssued)} voucher phát hành`,
      badge: redeemBadge,
      badgeType: redeemBadgeType,
      icon: 'verified',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Tỷ lệ hoàn tất đơn hàng',
      value: `${orderCompletionRate.toFixed(1)}%`,
      rate: orderCompletionRate,
      description: `${formatNumber(currentCompletedOrders)} đơn hoàn tất trên tổng ${formatNumber(currentTotalOrders)} đơn khởi tạo`,
      badge: orderCompletionBadge,
      badgeType: orderCompletionBadgeType,
      icon: 'task_alt',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Giá trị đơn TB (AOV)',
      value: formatCurrencyVND(aov),
      description: 'Doanh thu trung bình trên mỗi đơn hàng thành công',
      badge: aovChange.change,
      badgeType: aovChange.trend === 'up' ? 'success' : aovChange.trend === 'down' ? 'warning' : 'info',
      icon: 'receipt_long',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Doanh thu TB / Đối tác',
      value: formatCurrencyVND(revPerPartner),
      description: `Doanh số trung bình mỗi đối tác đóng góp trong ${timeframe === 'today' ? 'ngày' : 'kỳ'}`,
      badge: revPerPartnerChange.change,
      badgeType: revPerPartnerChange.trend === 'up' ? 'success' : revPerPartnerChange.trend === 'down' ? 'warning' : 'info',
      icon: 'storefront',
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  // 3. Hiệu quả theo danh mục ngành hàng (Category Performance Breakdown)
  const categoryRes = await pool.query(
    `SELECT
       c.category_id,
       c.category_name,
       COALESCE(v_stats.sold_count, 0) AS sold_count,
       COALESCE(v_stats.redeemed_count, 0) AS redeemed_count,
       COALESCE(rev_stats.revenue, 0) AS revenue
     FROM categories c
     LEFT JOIN (
       SELECT
         vp.category_id,
         COUNT(iv.issued_voucher_id) FILTER (WHERE iv.issued_at >= $1 AND iv.issued_at <= $2) AS sold_count,
         COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'USED' AND iv.used_at >= $1 AND iv.used_at <= $2) AS redeemed_count
       FROM issued_vouchers iv
       JOIN voucher_programs vp ON iv.program_id = vp.program_id
       WHERE (iv.issued_at >= $1 AND iv.issued_at <= $2)
          OR (iv.usage_status = 'USED' AND iv.used_at >= $1 AND iv.used_at <= $2)
       GROUP BY vp.category_id
     ) v_stats ON c.category_id = v_stats.category_id
     LEFT JOIN (
       SELECT
         vp.category_id,
         SUM(oi.unit_price * oi.quantity) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       JOIN voucher_programs vp ON oi.program_id = vp.program_id
       WHERE (o.order_status = 'COMPLETED' OR o.payment_status = 'PAID')
         AND o.created_at >= $1 AND o.created_at <= $2
       GROUP BY vp.category_id
     ) rev_stats ON c.category_id = rev_stats.category_id
     WHERE c.status = 'ACTIVE'
     ORDER BY revenue DESC, sold_count DESC`,
    [currentStart, currentEnd]
  );

  const categoryPerformance: CategoryPerformanceItem[] = categoryRes.rows.map((row) => {
    const sold = parseInt(row.sold_count || '0', 10);
    const redeemed = parseInt(row.redeemed_count || '0', 10);
    const rate = sold > 0 ? Math.round((redeemed / sold) * 1000) / 10 : 0;

    return {
      id: `cat-${row.category_id}`,
      name: row.category_name || 'Khác',
      soldCount: sold,
      redeemedCount: redeemed,
      rate,
      revenue: parseFloat(row.revenue || '0'),
    };
  });

  return {
    stats,
    efficiencyMetrics,
    categoryPerformance,
  };
}
