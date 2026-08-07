"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import KpiCard from "@/components/ui/KpiCard";
import VoucherStatusBadge from "@/components/ui/VoucherStatusBadge";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useVouchers } from "@/hooks/useVouchers";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { vouchers, isLoading } = useVouchers();

  // Tính toán chỉ số KPI từ danh sách voucher thực tế
  const totalCount = vouchers.length;
  const pendingCount = vouchers.filter((v) => v.status === "pending").length;
  const approvedCount = vouchers.filter((v) => v.status === "approved").length;
  const totalRevenue = vouchers.reduce(
    (sum, v) => sum + (v.soldCount || 0) * v.sellingPrice,
    0
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-full">
      <TopAppBar title="Tổng quan" />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-none space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">
            Xin chào, Đối tác Highlands Coffee
          </h1>
          <p className="text-base text-on-surface-variant">
            Đây là tổng quan thông tin kinh doanh và trạng thái voucher của bạn.
          </p>
        </div>

        {/* 4 Thẻ KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Tổng số chương trình"
            value={totalCount.toString()}
            icon="confirmation_number"
            iconBgClass="bg-surface-container-high"
            iconTextClass="text-on-surface-variant"
          />
          <KpiCard
            title="Đang chờ duyệt"
            value={pendingCount.toString()}
            icon="hourglass_top"
            iconBgClass="bg-tertiary-fixed-dim/40"
            iconTextClass="text-tertiary-amber"
          />
          <KpiCard
            title="Đã duyệt"
            value={approvedCount.toString()}
            icon="check_circle"
            iconBgClass="bg-secondary-container/40"
            iconTextClass="text-secondary"
          />
          <KpiCard
            title="Tổng doanh thu"
            value={formatCurrency(totalRevenue)}
            icon="payments"
            iconBgClass="bg-primary-container/40"
            iconTextClass="text-primary"
          />
        </div>

        {/* Danh sách Voucher gần đây */}
        <div className="bg-surface-bright border border-outline-variant rounded-2xl shadow-sm overflow-hidden w-full">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Voucher gần đây</h3>
              <p className="text-sm text-on-surface-variant">
                Các chương trình voucher mới cập nhật trong hệ thống.
              </p>
            </div>
            <Link
              href="/partner/vouchers"
              className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <Icon name="arrow_forward" className="text-base" />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant animate-pulse">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="py-4 px-6">
                          <div className="h-4 bg-surface-container-high rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">
                      Tên chương trình
                    </th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">
                      Mã chương trình
                    </th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">
                      Danh mục
                    </th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="py-4 px-6 font-semibold text-on-surface-variant text-right whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {vouchers.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-on-surface">
                        {item.title}
                      </td>
                      <td className="py-4 px-6 font-semibold text-primary">
                        {item.code}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-surface-container-high rounded-full text-sm font-semibold border border-outline-variant text-on-surface inline-block whitespace-nowrap">
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <VoucherStatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link
                          href={`/vouchers/${item.id}`}
                          className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl text-sm transition-colors border border-outline-variant inline-flex items-center gap-1.5"
                        >
                          <Icon name="visibility" className="text-base text-primary" />
                          <span>Xem chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
