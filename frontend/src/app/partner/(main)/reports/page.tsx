"use client";

import TopAppBar from "@/components/partner/layout/TopAppBar";
import VoucherStatusBadge from "@/components/shared/ui/VoucherStatusBadge";
import Icon from "@/components/shared/ui/Icon";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useVouchers } from "@/hooks/useVouchers";
import { formatCurrency, formatDate, calcRate } from "@/lib/utils";
import { VoucherItem } from "@/lib/types/voucher";

export default function ReportsPage() {
  const { vouchers, isLoading } = useVouchers();
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);


  // Chọn voucher đầu tiên khi load xong
  useEffect(() => {
    if (vouchers.length > 0 && !selectedVoucherId) {
      setSelectedVoucherId(vouchers[0].id);
    }
  }, [vouchers, selectedVoucherId]);

  const selectedVoucher: VoucherItem | undefined =
    vouchers.find((v) => v.id === selectedVoucherId) || vouchers[0];

  // Các chỉ số tính toán cho voucher được chọn
  const revenue = selectedVoucher?.revenue ?? 0;
  const issuedQty = selectedVoucher?.issuedQuantity ?? 0;
  const soldQty = selectedVoucher?.soldCount ?? 0;
  const usedQty = selectedVoucher?.usedCount ?? 0;

  const usageRate = calcRate(usedQty, soldQty).toFixed(1);
  const efficiencyRate = calcRate(soldQty, issuedQty).toFixed(1);

  const displayVouchers = vouchers;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-full">
      <TopAppBar title="Thống kê doanh thu" />

      <main className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-none space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-1">Thống kê & Báo cáo Hiệu quả Voucher</h2>
            <p className="text-base text-on-surface-variant">
              Tổng quan doanh thu, chỉ số quy đổi và hiệu quả kinh doanh của các chương trình voucher.
            </p>
          </div>


        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-5 bg-surface-container-high rounded w-1/3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-container-high rounded" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayVouchers.length === 0 && (
          <div className="bg-surface-bright rounded-2xl border border-outline-variant p-12 text-center space-y-4 shadow-sm my-8">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant">
              <Icon name="analytics" className="text-4xl text-outline" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-on-surface">Chưa có chương trình voucher nào</h3>
              <p className="text-base text-on-surface-variant mt-1 max-w-md mx-auto">
                Hiện tại chưa có dữ liệu báo cáo thống kê do đối tác chưa tạo chương trình voucher nào.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/partner/vouchers/create"
                className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-base px-6 py-3 rounded-xl hover:bg-surface-tint transition-all shadow-md"
              >
                <Icon name="add" className="text-xl" />
                <span>Tạo voucher mới</span>
              </Link>
            </div>
          </div>
        )}

        {/* Main content */}
        {!isLoading && displayVouchers.length > 0 && (
          <div className="space-y-8">
            {/* Bảng tổng quan */}
            <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-outline-variant/40">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Tổng quan các chương trình Voucher</h3>
                  <p className="text-sm text-on-surface-variant">
                    Nhấp chọn chương trình trong bảng bên dưới để xem báo cáo phân tích chi tiết.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="py-3.5 px-4 font-semibold text-on-surface-variant whitespace-nowrap">Tên chương trình</th>
                      <th className="py-3.5 px-4 font-semibold text-on-surface-variant whitespace-nowrap">Thời gian áp dụng</th>
                      <th className="py-3.5 px-4 font-semibold text-on-surface-variant whitespace-nowrap">Trạng thái</th>
                      <th className="py-3.5 px-4 font-semibold text-on-surface-variant text-right whitespace-nowrap">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {vouchers.map((item) => {
                      const itemRevenue = item.revenue ?? 0;
                      const isSelected = selectedVoucherId === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedVoucherId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary-container/20 border-l-4 border-l-primary font-semibold"
                              : "hover:bg-surface-container-low/60"
                          }`}
                        >
                          <td className="py-4 px-4 font-bold text-on-surface">
                            {item.title}
                            <span className="block text-xs text-on-surface-variant font-normal">
                              Mã: {item.code}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant text-sm whitespace-nowrap">
                            {formatDate(item.sellStartDate)} — {formatDate(item.sellEndDate)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <VoucherStatusBadge status={item.status} withDot={false} />
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-primary text-lg whitespace-nowrap">
                            {formatCurrency(itemRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chi tiết voucher được chọn */}
            {selectedVoucher && (
              <div className="space-y-6">
                <div className="bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-outline-variant/40">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full border border-primary/20">
                        Chương trình đang xem báo cáo
                      </span>
                      <h3 className="text-2xl font-bold text-on-surface mt-2">{selectedVoucher.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        Mã: <strong>{selectedVoucher.code}</strong> | Danh mục: <strong>{selectedVoucher.categoryName}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-on-surface-variant block mb-1">Thời gian áp dụng:</span>
                      <span className="font-bold text-on-surface text-base">
                        {formatDate(selectedVoucher.sellStartDate)} — {formatDate(selectedVoucher.sellEndDate)}
                      </span>
                    </div>
                  </div>

                  {/* 5 chỉ số */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                    <div className="bg-primary-container/20 border border-primary/30 rounded-2xl p-5 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-primary">
                        <span className="text-sm font-bold">Doanh thu</span>
                        <Icon name="payments" className="text-2xl" />
                      </div>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(revenue)}</p>
                      <p className="text-xs text-on-surface-variant">Tổng doanh thu bán voucher</p>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-on-surface-variant">
                        <span className="text-sm font-bold">Số lượng phát hành</span>
                        <Icon name="confirmation_number" className="text-2xl text-outline" />
                      </div>
                      <p className="text-2xl font-bold text-on-surface">{issuedQty.toLocaleString()}</p>
                      <p className="text-xs text-on-surface-variant">Voucher đã phát hành</p>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-secondary">
                        <span className="text-sm font-bold">Số lượng bán</span>
                        <Icon name="shopping_cart" className="text-2xl" />
                      </div>
                      <p className="text-2xl font-bold text-secondary">{soldQty.toLocaleString()}</p>
                      <p className="text-xs text-on-surface-variant">Voucher bán thành công</p>
                    </div>

                    <div className="bg-tertiary-fixed-dim/20 border border-tertiary-amber/30 rounded-2xl p-5 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-tertiary-amber">
                        <span className="text-sm font-bold">Tỷ lệ sử dụng</span>
                        <Icon name="donut_large" className="text-2xl" />
                      </div>
                      <p className="text-2xl font-bold text-tertiary-amber">{usageRate}%</p>
                      <p className="text-xs text-on-surface-variant">Đã dùng: {usedQty}/{soldQty} bán</p>
                    </div>

                    <div className="bg-secondary-container/20 border border-secondary/30 rounded-2xl p-5 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-secondary">
                        <span className="text-sm font-bold">Hiệu quả (Tỷ lệ bán)</span>
                        <Icon name="trending_up" className="text-2xl" />
                      </div>
                      <p className="text-2xl font-bold text-secondary">{efficiencyRate}%</p>
                      <p className="text-xs text-on-surface-variant">Đã bán: {soldQty}/{issuedQty} phát hành</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
