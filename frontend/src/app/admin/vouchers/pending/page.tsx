/**
 * =========================================================================================
 * FILE: page.tsx
 * VỊ TRÍ: frontend/src/app/admin/vouchers/pending/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Hàng đợi Xét duyệt Voucher (UC-ADM-03: Xét duyệt Voucher).
 *   - Các tính năng chính:
 *       1. Hiển thị danh sách các đợt phát hành voucher do đối tác gửi duyệt.
 *       2. Tìm kiếm Debounce 400ms (theo tên voucher, tên đối tác, MST, mã yêu cầu).
 *       3. Hiển thị cảnh báo trực quan nếu giá bán >= giá gốc ngay trên từng dòng.
 *       4. Phân trang dữ liệu và chuyển hướng đến trang chi tiết duyệt voucher `pending/[id]/page.tsx`.
 * =========================================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import Pagination from "@/components/shared/ui/Pagination";
import VoucherNavTabs from "@/components/admin/VoucherNavTabs";
import {
  adminApi,
  AdminPendingVoucherItem,
  AdminApiError,
} from "@/lib/admin-api";

export default function PendingVouchersPage() {
  // ─── 1. State Dữ liệu Voucher & Trạng thái tải ────────────────────────────────────
  const [vouchers, setVouchers] = useState<AdminPendingVoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── 2. State Tìm kiếm (Debounce) & Phân trang ─────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Cơ chế Debounce 400ms cho ô tìm kiếm:
   * Giúp trì hoãn gọi API cho đến khi người dùng ngừng gõ phím 400ms, giảm tải lượng request gửi về backend.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset về trang 1 khi đổi từ khóa
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: loadPendingVouchers
   * MỤC ĐÍCH: Gọi API `adminApi.getPendingVouchers` để lấy danh sách voucher chờ duyệt.
   * ---------------------------------------------------------------------------------------
   */
  const loadPendingVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getPendingVouchers({
        search: debouncedSearch.trim() || undefined,
        page: currentPage,
        limit: 5,
      });
      setVouchers(res.vouchers);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách voucher chờ duyệt.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    loadPendingVouchers();
  }, [loadPendingVouchers]);

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── PHẦN 1: Top Navigation Tabs (Duyệt voucher / Quản lý kho voucher) ─────── */}
      <VoucherNavTabs pendingCount={totalItems} />

      {/* ─── PHẦN 2: Thanh Tìm Kiếm Đầy Đủ & Đếm Tổng Số Lượng ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
          <Input
            type="text"
            placeholder="Tìm theo tên voucher, đối tác, mã số thuế hoặc mã yêu cầu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap self-end sm:self-center">
          Tổng cộng: <span className="font-bold text-slate-900">{totalItems}</span> yêu cầu chờ duyệt
        </div>
      </div>

      {/* ─── PHẦN 3: Bảng Danh Sách các Voucher CHỜ XÉT DUYỆT ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ YÊU CẦU</th>
                <th className="py-4 px-5">CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-4 px-5">ĐỐI TÁC & CHI NHÁNH</th>
                <th className="py-4 px-5">GIÁ BÁN / GIÁ GỐC</th>
                <th className="py-4 px-5">SỐ LƯỢNG</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {/* Skeleton loading */}
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-16 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-12" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-36 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-28" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-200 rounded-lg w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                /* Empty state */
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="task_alt" className="text-4xl block mb-2 text-slate-300" />
                    {debouncedSearch
                      ? "Không tìm thấy yêu cầu duyệt voucher phù hợp với từ khóa."
                      : "Hiện tại không có voucher nào đang chờ xét duyệt."}
                  </td>
                </tr>
              ) : (
                /* Dữ liệu voucher */
                vouchers.map((item) => {
                  const originalPriceNum = Number(item.original_price) || 0;
                  const salePriceNum = Number(item.sale_price) || 0;
                  const isViolationPrice = salePriceNum >= originalPriceNum;
                  const mainBranch = item.branches && item.branches.length > 0 ? item.branches[0] : null;

                  return (
                    <tr key={item.approval_request_id} className="hover:bg-slate-50/60 transition">
                      {/* Mã yêu cầu & Mã chương trình */}
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs">
                        #{item.approval_request_id}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          VCH-{item.program_id}
                        </div>
                      </td>

                      {/* Tên voucher & Ngành hàng + Cảnh báo vi phạm giá nếu có */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.program_name}
                        </div>
                        {item.category_name && (
                          <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                            {item.category_name}
                          </span>
                        )}
                        {isViolationPrice && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-md">
                            ⚠️ Cảnh báo: Giá bán ≥ Giá gốc
                          </span>
                        )}
                      </td>

                      {/* Tên đối tác & Chi nhánh */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 text-xs">{item.partner_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {mainBranch ? (
                            <span>
                              {mainBranch.branch_name}
                              {item.branches && item.branches.length > 1 && (
                                <span className="text-blue-600 font-semibold ml-1">
                                  (+{item.branches.length - 1} chi nhánh)
                                </span>
                              )}
                            </span>
                          ) : (
                            "Toàn hệ thống"
                          )}
                        </div>
                      </td>

                      {/* Giá bán / Giá gốc */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-blue-700">{formatCurrency(salePriceNum)}</div>
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(originalPriceNum)}
                        </div>
                      </td>

                      {/* Số lượng phát hành */}
                      <td className="py-4 px-5 font-semibold text-slate-800 text-xs">
                        {item.issue_quantity.toLocaleString("vi-VN")} lượt
                      </td>

                      {/* Thao tác xem chi tiết */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/vouchers/pending/${item.approval_request_id}`}
                          className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <span>Xem chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PHẦN 4: Footer & Phân trang ────────────────────────────────────────── */}
        {!isLoading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={5}
            onPageChange={setCurrentPage}
            itemName="yêu cầu chờ duyệt"
          />
        )}
      </div>
    </div>
  );
}
