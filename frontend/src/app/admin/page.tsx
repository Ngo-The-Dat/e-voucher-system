"use client";

import { useState } from "react";
import Icon from "@/components/shared/ui/Icon";
import KpiCard from "@/components/shared/ui/KpiCard";
import DashboardChart from "@/components/admin/DashboardChart";
import PendingApprovalsWidget from "@/components/admin/PendingApprovalsWidget";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Button } from "@/components/shared/ui/Button";

export default function DashboardOverview() {
  // Global Timeframe State
  type Timeframe = "today" | "week" | "month" | "custom";
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [startDate, setStartDate] = useState<string>("2026-08-01");
  const [endDate, setEndDate] = useState<string>("2026-08-05");

  const { isLoading, hasData, setHasData, stats, pendingApprovals, chartData } = useAdminDashboard();

  return (
    <div className="space-y-8">
      {/* Page Header with Global Timeframe Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>
            <Button
              variant={hasData ? "secondary" : "outline"}
              size="sm"
              onClick={() => setHasData(!hasData)}
              className={hasData ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"}
              title="Bấm để thử nghiệm luồng A1: Trạng thái Chưa có dữ liệu"
            >
              <Icon name={hasData ? "check_circle" : "warning"} className="w-4 h-4 mr-1.5 fill-current" />
              <span>{hasData ? "Dữ liệu: Có" : "Mô phỏng Luồng A1 (Rỗng)"}</span>
            </Button>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Báo cáo tổng quan người dùng, đối tác, voucher, đơn hàng & doanh thu
          </p>
        </div>

        {/* Global Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium border border-slate-200">
            {["today", "week", "month", "custom"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-3 py-1.5 rounded-lg transition ${timeframe === tf
                  ? "bg-white text-primary font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {tf === "today" ? "Hôm nay" : tf === "week" ? "Tuần này" : tf === "month" ? "Tháng này" : "Tùy chọn"}
              </button>
            ))}
          </div>

          {/* Custom Date Picker */}
          {timeframe === "custom" && (
            <div className="flex items-center gap-2 text-xs bg-white p-1 border border-slate-200 rounded-xl shadow-sm animate-in fade-in duration-150">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-primary"
              />
              <span className="text-slate-400">&rarr;</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5 KPI Cards Grid using shared KpiCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const bgClass = stat.color.split(" ")[0];
          const textClass = stat.color.split(" ")[1];
          return (
            <KpiCard
              key={i}
              title={stat.title}
              value={stat.value}
              change={hasData ? stat.change : undefined}
              comparisonText={stat.description}
              isPositive={stat.trend === "up"}
              icon={stat.icon}
              iconBgClass={bgClass}
              iconTextClass={textClass}
            />
          );
        })}
      </div>

      {/* Analytics Charts & Operational Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardChart hasData={hasData} setHasData={setHasData} chartData={chartData} />
        <PendingApprovalsWidget pendingApprovals={pendingApprovals} />
      </div>
    </div>
  );
}


