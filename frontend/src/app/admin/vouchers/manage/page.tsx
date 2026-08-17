"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";
import VoucherNavTabs from "@/components/admin/VoucherNavTabs";
import {
  adminApi,
  AdminManagedVoucherItem,
  AdminApiError,
} from "@/lib/admin-api";

type StatusTab = "ALL" | "PUBLISHED" | "HIDDEN" | "ENDED";

export default function ManageVouchersPage() {
  const [vouchers, setVouchers] = useState<AdminManagedVoucherItem[]>([]);
  const [stats, setStats] = useState({
    all: 0,
    published: 0,
    hidden: 0,
    ended: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load vouchers from API
  const loadManagedVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getManagedVouchers({
        search: debouncedSearch.trim() || undefined,
        status: statusTab !== "ALL" ? statusTab : undefined,
        page: currentPage,
        limit: 5,
      });
      setVouchers(res.vouchers);
      setStats(res.stats);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách voucher quản lý.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusTab, currentPage]);

  // Load pending count for NavTabs badge
  const loadPendingCount = useCallback(async () => {
    try {
      const res = await adminApi.getPendingVouchers({ limit: 1 });
      setPendingCount(res.pagination.total);
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    loadManagedVouchers();
  }, [loadManagedVouchers]);

  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <VoucherNavTabs pendingCount={pendingCount} />

      {/* Filter / Search Bar & Status Select */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
            <Input
              type="text"
              placeholder="Tìm theo tên voucher, đối tác, mã số thuế hoặc mã chương trình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] pl-10 pr-4 border-slate-200 rounded-xl"
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="relative w-full sm:w-auto min-w-[200px] shrink-0">
            <select
              value={statusTab}
              onChange={(e) => {
                setStatusTab(e.target.value as StatusTab);
                setCurrentPage(1);
              }}
              className="w-full h-[40px] pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition shadow-2xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang bán</option>
              <option value="HIDDEN">Tạm ngưng</option>
              <option value="ENDED">Ngừng bán</option>
            </select>
            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap self-end sm:self-center">
          Tổng cộng: <span className="font-bold text-slate-900">{totalItems}</span> voucher
        </div>
      </div>

      {/* Bảng Danh Sách VOUCHER ĐÃ QUẢN LÝ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ CHƯƠNG TRÌNH</th>
                <th className="py-4 px-5">CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-4 px-5">ĐỐI TÁC & CHI NHÁNH</th>
                <th className="py-4 px-5">GIÁ BÁN / GIÁ GỐC</th>
                <th className="py-4 px-5">TỒN KHO / PHÁT HÀNH</th>
                <th className="py-4 px-5">THỜI HẠN BÁN</th>
                <th className="py-4 px-5">TRẠNG THÁI</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-16 mb-1" />
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
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-200 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-200 rounded-lg w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="inventory_2" className="text-4xl block mb-2 text-slate-300" />
                    {debouncedSearch
                      ? "Không tìm thấy chương trình voucher phù hợp với từ khóa."
                      : "Chưa có chương trình voucher nào trong mục này."}
                  </td>
                </tr>
              ) : (
                vouchers.map((item) => {
                  const originalPriceNum = Number(item.original_price) || 0;
                  const salePriceNum = Number(item.sale_price) || 0;
                  const stockNum = Number(item.stock) || 0;
                  const isExpired = new Date(item.sale_end_at).getTime() < Date.now();
                  const isStockOut = stockNum <= 0;
                  const isRuleTriggered = (isExpired || isStockOut) && item.display_status === "PUBLISHED";

                  return (
                    <tr key={item.program_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs">
                        VCH-{item.program_id}
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <Link
                          href={`/admin/vouchers/manage/${item.program_id}`}
                          className="font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition"
                        >
                          {item.program_name}
                        </Link>
                        {item.category_name && (
                          <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                            {item.category_name}
                          </span>
                        )}
                        {isRuleTriggered && (
                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-md">
                            ⚠️ {isStockOut ? "Hết số lượng" : "Hết hạn bán"} (Đề xuất Ngừng bán)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 text-xs">{item.partner_name}</div>
                        {item.branch_name && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {item.branch_name}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-emerald-700">{formatCurrency(salePriceNum)}</div>
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(originalPriceNum)}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`font-bold text-xs ${
                            isStockOut
                              ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                              : "text-slate-800"
                          }`}
                        >
                          {stockNum.toLocaleString("vi-VN")} / {item.issue_quantity.toLocaleString("vi-VN")}
                        </span>
                        {item.sold_count > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Đã bán: {item.sold_count}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-700">
                        <div className={`font-semibold ${isExpired ? "text-rose-600" : ""}`}>
                          {formatDate(item.sale_end_at)}
                        </div>
                        <div className="text-[11px] text-slate-400">Từ {formatDate(item.sale_start_at)}</div>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge
                          status={
                            item.display_status === "PUBLISHED"
                              ? "active"
                              : item.display_status === "HIDDEN"
                              ? "pending"
                              : "ended"
                          }
                          label={
                            item.display_status === "PUBLISHED"
                              ? "Đang bán"
                              : item.display_status === "HIDDEN"
                              ? "Tạm ngưng"
                              : "Ngừng bán"
                          }
                        />
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/vouchers/manage/${item.program_id}`}
                          className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <span>Xem chi tiết</span>
                          <Icon name="arrow_forward" className="text-xs" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Phân trang */}
        {!isLoading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={5}
            onPageChange={setCurrentPage}
            itemName="chương trình voucher"
          />
        )}
      </div>
    </div>
  );
}
