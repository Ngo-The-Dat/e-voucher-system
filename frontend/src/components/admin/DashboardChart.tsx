/**
 * =========================================================================================
 * FILE: DashboardChart.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Biểu đồ Cột Phân tích Hiệu suất Toàn sàn trên màn hình Dashboard (UC-ADM-06, UC-ADM-07).
 *   - Các tính năng kỹ thuật chính:
 *       1. Hỗ trợ 2 Tab Chuyển đổi Dữ liệu trực quan:
 *          - Tab 1: Voucher phát hành & Đã quy đổi (Issue vs Redeem).
 *          - Tab 2: Doanh thu sàn & Số lượng đơn hàng (Revenue vs Orders).
 *       2. Tính toán tỷ lệ chiều cao thanh cột động `(value / maxValue) * 100%` bằng CSS Inline Styles.
 *       3. Trạng thái Fallback Empty State khi chưa có dữ liệu trong khoảng thời gian đã chọn.
 * =========================================================================================
 */

"use client";

import { useState } from "react";
import Icon from "@/components/shared/ui/Icon";

interface DashboardChartProps {
  hasData: boolean;                    // Cờ kiểm tra có dữ liệu hay không
  setHasData: (val: boolean) => void;  // Hàm cập nhật trạng thái dữ liệu
  chartData: any[];                    // Mảng dữ liệu các mốc thời gian (label, issue, redeem, revenue, orders)
}

export default function DashboardChart({ hasData, setHasData, chartData }: DashboardChartProps) {
  type ChartTab = "voucher" | "revenue";
  // State lưu tab biểu đồ đang được chọn
  const [chartTab, setChartTab] = useState<ChartTab>("voucher");


  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Biểu đồ phân tích hiệu suất
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Hiển thị số liệu chi tiết theo khoảng thời gian đã chọn
          </p>
        </div>

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

      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
            <Icon name="bar_chart" className="text-2xl fill-current" />
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
  );
}
