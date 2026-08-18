/**
 * =========================================================================================
 * FILE: page.tsx
 * VỊ TRÍ: frontend/src/app/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Dashboard Quản trị Tổng quan Toàn Sàn (UC-ADM-06: Thống kê tổng quan, UC-ADM-07: Báo cáo hiệu suất).
 *   - Các tính năng chính:
 *       1. Bộ chọn khoảng thời gian toàn cục (Global Timeframe Filter):
 *          - Hôm nay (today), Tuần này (week), Tháng này (month), hoặc Tùy chọn ngày (custom date picker).
 *       2. 5 Thẻ chỉ số KPI cốt lõi (Lưới KpiCard):
 *          - Tổng doanh thu, Đơn hàng hoàn tất, Voucher đã quy đổi (Redeem Rate), Tổng số khách hàng, Đối tác đang hoạt động.
 *       3. Khối Chỉ số Hiệu quả Vận hành (Operational Efficiency Metrics):
 *          - Tỷ lệ quy đổi voucher, Tỷ lệ hoàn tất đơn hàng, Giá trị đơn hàng trung bình (AOV), Doanh thu TB / Đối tác.
 *       4. Bảng Phân tích Hiệu quả theo Danh mục Ngành hàng (Category Performance Breakdown):
 *          - Thống kê chi tiết doanh thu, số lượng bán, số lượng quy đổi và thanh tiến độ % quy đổi cho từng nhóm ngành.
 * =========================================================================================
 */

"use client";

import { useState } from "react";
import Icon from "@/components/shared/ui/Icon";
import KpiCard from "@/components/shared/ui/KpiCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Button } from "@/components/shared/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardOverview() {
  // ─── 1. State Khoảng thời gian toàn cục (Global Timeframe) ─────────────────────────
  type Timeframe = "today" | "week" | "month" | "custom";
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  // Khởi tạo ngày mặc định cho bộ lọc tùy chọn (7 ngày gần nhất)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const handleResetDates = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
  };

  const isInvalidDateRange = Boolean(timeframe === "custom" && startDate && endDate && startDate > endDate);

  // ─── 2. Custom Hook Tải Dữ liệu Dashboard ──────────────────────────────────────────
  const {
    isLoading,
    error,
    stats,
    efficiencyMetrics,
    categoryPerformance,
    refetch,
  } = useAdminDashboard({
    timeframe,
    startDate,
    endDate,
  });

  return (
    <div className="space-y-8">
      {/* ─── PHẦN 1: Tiêu đề Dashboard & Bộ Chọn Khoảng Thời Gian ─────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard Quản trị
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Báo cáo tổng quan người dùng, đối tác, voucher, đơn hàng & doanh thu
          </p>
        </div>

        {/* Bộ nút chọn nhanh thời gian & Ô chọn ngày tùy chọn */}
        <div className="flex flex-col items-start xl:items-end gap-2 self-start xl:self-auto">
          {/* Nút bấm chuyển đổi: Hôm nay / Tuần này / Tháng này / Tùy chọn */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium border border-slate-200">
            {(["today", "week", "month", "custom"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-medium ${timeframe === tf
                    ? "bg-white text-primary font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {tf === "today"
                  ? "Hôm nay"
                  : tf === "week"
                    ? "Tuần này"
                    : tf === "month"
                      ? "Tháng này"
                      : "Tùy chọn"}
              </button>
            ))}
          </div>

          {/* Ô Chọn ngày bắt đầu - ngày kết thúc khi ở chế độ Tùy chọn */}
          {timeframe === "custom" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 hover:border-slate-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 rounded-xl shadow-sm transition-all animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Từ</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:text-primary transition-colors"
                />
              </div>
              <span className="text-slate-300 font-light">&rarr;</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đến</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:text-primary transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── PHẦN 2: Skeleton Loading ────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 h-28 flex flex-col justify-between"
              >
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-7 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 h-64" />
        </div>
      )}

      {/* ─── PHẦN 3: Trạng thái Lỗi hoặc Khoảng thời gian không hợp lệ ─────────────── */}
      {!isLoading && error && (
        <div className="bg-white border-2 border-dashed border-amber-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Icon name="warning" className="text-3xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isInvalidDateRange ? "Khoảng thời gian không hợp lệ" : "Không thể tải dữ liệu"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {error}
            </p>
          </div>
          {isInvalidDateRange ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDates}
              className="mt-2 text-primary border-primary/30 hover:bg-primary/5"
            >
              <Icon name="refresh" className="w-4 h-4 mr-1.5" />
              <span>Đặt lại 7 ngày gần nhất</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 text-primary border-primary/30 hover:bg-primary/5"
            >
              <Icon name="refresh" className="w-4 h-4 mr-1.5" />
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      )}

      {/* ─── PHẦN 4: Nội Dung Chính Của Dashboard ─────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Khối 1: Lưới 5 Thẻ KPI cốt lõi */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {stats.map((stat, i) => {
                const bgClass = stat.color.split(" ")[0];
                const textClass = stat.color.split(" ")[1];
                return (
                  <KpiCard
                    key={i}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    comparisonText={stat.description}
                    isPositive={stat.trend === "up"}
                    icon={stat.icon}
                    iconBgClass={bgClass}
                    iconTextClass={textClass}
                  />
                );
              })}
            </div>
          </div>

          {/* Khối 2: 4 Chỉ số Hiệu quả Vận hành (Operational Efficiency Metrics) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="analytics" className="text-primary text-xl" />
                  <span>Chỉ số Hiệu quả Vận hành</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đo lường tỷ lệ chuyển đổi, hiệu suất đơn hàng và doanh số trung bình trong kỳ
                </p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full self-start sm:self-auto">
                {timeframe === "today"
                  ? "Hôm nay"
                  : timeframe === "week"
                    ? "Tuần này"
                    : timeframe === "month"
                      ? "Tháng này"
                      : `Từ ${formatDate(startDate)} đến ${formatDate(endDate)}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {efficiencyMetrics.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">
                        {item.title}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}
                      >
                        <Icon name={item.icon} className="text-base" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 tracking-tight">
                        {item.value}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeType === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến độ % quy đổi nếu có */}
                  {item.rate !== undefined && (
                    <div className="mt-3 space-y-1.5">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, item.rate)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {item.rate === undefined && (
                    <p className="text-[11px] text-slate-500 mt-3 leading-tight">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Khối 3: Bảng Phân tích Hiệu quả theo Danh mục Ngành hàng */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Icon name="category" className="text-primary text-xl" />
                  <span>Hiệu quả theo Danh mục Ngành hàng</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết số lượng phát hành, quy đổi và tỷ lệ doanh thu theo từng nhóm ngành
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                    <th className="py-3 px-4 font-bold">Danh mục</th>
                    <th className="py-3 px-4 font-bold text-right">
                      Số lượng bán
                    </th>
                    <th className="py-3 px-4 font-bold text-right">
                      Đã quy đổi
                    </th>
                    <th className="py-3 px-4 font-bold text-center">
                      Tỷ lệ quy đổi
                    </th>
                    <th className="py-3 px-4 font-bold text-right">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryPerformance.map((cat, idx) => (
                    <tr
                      key={cat.id || idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {cat.soldCount.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {cat.redeemedCount.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, cat.rate)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {cat.rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-primary text-base">
                        {formatCurrency(cat.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
