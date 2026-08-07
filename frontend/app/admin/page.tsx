"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

export default function DashboardOverview() {
  // Global Timeframe State (UC-ADM-12: Hôm nay / Tuần này / Tháng này / Tùy chọn)
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState<string>("2026-08-01");
  const [endDate, setEndDate] = useState<string>("2026-08-05");

  // Simulation State for Flow A1 (Trạng thái Chưa có dữ liệu)
  const [hasData, setHasData] = useState<boolean>(true);

  // Active Chart View
  const [chartTab, setChartTab] = useState<"voucher" | "revenue">("voucher");

  // 5 Key Metric Groups required by UC-ADM-12 & BR-ADM-06 (Người dùng, Đối tác, Voucher, Đơn hàng, Doanh thu)
  const stats = [
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
  ];

  const pendingApprovals = [
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
  ];

  // Chart data mockup
  const chartData = [
    { label: "T2", issue: 65, redeem: 50, revenue: 120, orders: 85 },
    { label: "T3", issue: 80, redeem: 70, revenue: 155, orders: 110 },
    { label: "T4", issue: 45, redeem: 38, revenue: 95, orders: 65 },
    { label: "T5", issue: 90, redeem: 82, revenue: 180, orders: 130 },
    { label: "T6", issue: 100, redeem: 95, revenue: 210, orders: 150 },
    { label: "T7", issue: 120, redeem: 110, revenue: 260, orders: 190 },
    { label: "CN", issue: 115, redeem: 105, revenue: 240, orders: 175 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header with UC-ADM-12 Global Timeframe Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>
            {/* Simulation Toggle for Alternate Flow A1 (Empty Data State) */}
            <button
              onClick={() => setHasData(!hasData)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${hasData
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
              title="Bấm để thử nghiệm luồng A1: Trạng thái Chưa có dữ liệu"
            >
              <Icon name={hasData ? "check_circle" : "warning"} className="text-sm" />
              <span>{hasData ? "Dữ liệu: Có" : "Mô phỏng Luồng A1 (Rỗng)"}</span>
            </button>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Báo cáo tổng quan người dùng, đối tác, voucher, đơn hàng & doanh thu
          </p>
        </div>

        {/* Global Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium border border-slate-200">
            <button
              onClick={() => setTimeframe("today")}
              className={`px-3 py-1.5 rounded-lg transition ${timeframe === "today"
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={`px-3 py-1.5 rounded-lg transition ${timeframe === "week"
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1.5 rounded-lg transition ${timeframe === "month"
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeframe("custom")}
              className={`px-3 py-1.5 rounded-lg transition ${timeframe === "custom"
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Tùy chọn
            </button>
          </div>

          {/* Custom Date Picker Range (Shown when timeframe === 'custom') */}
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

      {/* 5 KPI Cards Grid (UC-ADM-12: Người dùng, Đối tác, Voucher, Đơn hàng, Doanh thu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-all ${hasData
              ? "bg-white border-border shadow-sm hover:shadow-md"
              : "bg-slate-50/70 border-dashed border-slate-300 opacity-90"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <Icon name={stat.icon} className="text-lg" />
              </div>
            </div>
            <div className="mt-3 flex flex-col justify-between">
              <p
                className={`text-xl font-extrabold ${hasData ? "text-slate-900" : "text-amber-600 font-mono italic text-sm"
                  }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 font-medium leading-tight">
                {stat.description}
              </p>
              <div className="mt-2.5">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${!hasData
                    ? "bg-amber-100 text-amber-800"
                    : stat.trend === "up"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts & Operational Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Biểu đồ phân tích hiệu suất
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Hiển thị số liệu chi tiết theo khoảng thời gian đã chọn
              </p>
            </div>

            {/* Chart View Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartTab("voucher")}
                className={`px-3 py-1.5 rounded-lg transition ${chartTab === "voucher"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Voucher phát hành & Quy đổi
              </button>
              <button
                onClick={() => setChartTab("revenue")}
                className={`px-3 py-1.5 rounded-lg transition ${chartTab === "revenue"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Doanh thu & Đơn hàng
              </button>
            </div>
          </div>

          {/* Alternate Flow A1: Empty State View vs Chart Data View */}
          {!hasData ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Icon name="bar_chart" className="text-2xl" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Chưa có dữ liệu
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Không tìm thấy dữ liệu báo cáo nào trong khoảng thời gian đã chọn.
              </p>
              <button
                onClick={() => setHasData(true)}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                Khôi phục dữ liệu mẫu
              </button>
            </div>
          ) : (
            <>
              {/* Visual Bars Mockup */}
              <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-4 border-b border-slate-100 px-2">
                {chartData.map((bar, idx) => {
                  const maxVal = chartTab === "voucher" ? 130 : 300;
                  const v1 = chartTab === "voucher" ? bar.issue : bar.revenue;
                  const v2 = chartTab === "voucher" ? bar.redeem : bar.orders;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <div className="w-full max-w-[36px] flex items-end gap-1.5 h-full">
                        <div
                          style={{ height: `${(v1 / maxVal) * 100}%` }}
                          className="flex-1 bg-primary-container rounded-t-md transition-all hover:opacity-90 cursor-pointer"
                          title={`${chartTab === "voucher" ? "Phát hành" : "Doanh thu"}: ${v1}`}
                        />
                        <div
                          style={{ height: `${(v2 / maxVal) * 100}%` }}
                          className={`flex-1 rounded-t-md transition-all hover:opacity-90 cursor-pointer ${chartTab === "voucher" ? "bg-emerald-500" : "bg-purple-500"
                            }`}
                          title={`${chartTab === "voucher" ? "Quy đổi" : "Đơn hàng"}: ${v2}`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium">
                {chartTab === "voucher" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-container" />
                      <span className="text-slate-600">Voucher phát hành</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-600">
                        Đã quy đổi thực tế
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-container" />
                      <span className="text-slate-600">Doanh thu (triệu ₫)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-purple-500" />
                      <span className="text-slate-600">Số lượng đơn hàng</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Operational Widget: Pending Approvals (Yêu cầu duyệt đối tác & Voucher) */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Cần xử lý ngay
                </h2>
                <p className="text-xs text-slate-400">Hàng chờ duyệt theo ERD</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                3 công việc
              </span>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-primary px-2 py-0.5 bg-blue-100 rounded-md">
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.status}</p>
                  <div className="mt-3 text-right">
                    <Link
                      href={item.link}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Xem chi tiết hồ sơ</span>
                      <Icon name="arrow_forward" className="text-sm" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/partners/pending"
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1"
          >
            <span>Xem tất cả yêu cầu duyệt</span>
            <Icon name="chevron_right" className="text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
}
