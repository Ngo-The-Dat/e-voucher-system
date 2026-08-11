"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";
import VoucherNavTabs from "../_components/VoucherNavTabs";
import VoucherStatusModal from "../_components/VoucherStatusModal";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal Dialog Box State (thay thế cho alert / confirm)
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    voucher: AdminManagedVoucherItem | null;
    targetStatus: "PUBLISHED" | "HIDDEN" | "ENDED";
  } | null>(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

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

  // Auto clear notification message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  // Mở Dialog Box xác nhận đổi trạng thái
  const handleOpenStatusModal = (
    voucher: AdminManagedVoucherItem,
    targetStatus: "PUBLISHED" | "HIDDEN" | "ENDED"
  ) => {
    setModalErrorMessage(null);
    setStatusDialog({
      isOpen: true,
      voucher,
      targetStatus,
    });
  };

  // Thực hiện đổi trạng thái khi xác nhận trong Dialog Box
  const handleConfirmStatusChange = async () => {
    if (!statusDialog || !statusDialog.voucher) return;
    const { voucher, targetStatus } = statusDialog;

    const statusTextMap: Record<string, string> = {
      PUBLISHED: "Đang bán",
      HIDDEN: "Tạm ngưng",
      ENDED: "Ngừng bán",
    };

    try {
      setIsStatusSubmitting(true);
      setModalErrorMessage(null);
      await adminApi.updateVoucherStatus(voucher.program_id, targetStatus);
      setSuccessMessage(
        `Đã cập nhật trạng thái voucher [${voucher.program_name}] thành: ${statusTextMap[targetStatus]}.`
      );
      setStatusDialog(null);
      await loadManagedVouchers();
    } catch (err: any) {
      setModalErrorMessage(err.message || "Lỗi khi cập nhật trạng thái voucher.");
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <VoucherNavTabs pendingCount={pendingCount} />

      {/* Thông báo thành công / lỗi */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="check_circle" className="text-emerald-600 text-lg" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-rose-600 text-lg" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            onClick={loadManagedVouchers}
            className="text-xs h-auto py-1 px-3 bg-white"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Filter Header & Status Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Search Input & Quick Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
            <Input
              type="text"
              placeholder="Nhập tên chương trình, mã voucher hoặc đối tác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
            />
          </div>

          {/* Quick Count Stats */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              Đang bán: {stats.published}
            </span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              Tạm ngưng: {stats.hidden}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl">
              Ngừng bán: {stats.ended}
            </span>
          </div>
        </div>

        {/* Filter Tabs by Display Status */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[
            { key: "ALL", label: "Tất cả voucher", count: stats.all },
            { key: "PUBLISHED", label: "Đang bán", count: stats.published },
            { key: "HIDDEN", label: "Tạm ngưng", count: stats.hidden },
            { key: "ENDED", label: "Ngừng bán", count: stats.ended },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={statusTab === tab.key ? "default" : "outline"}
              onClick={() => {
                setStatusTab(tab.key as StatusTab);
                setCurrentPage(1);
              }}
              className={`text-xs h-auto py-1.5 px-3.5 ${
                statusTab === tab.key ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full ml-2 ${
                  statusTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Bảng Danh Sách Quản Lý Voucher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ CHƯƠNG TRÌNH</th>
                <th className="py-4 px-5">TÊN CHƯƠNG TRÌNH VOUCHER</th>
                <th className="py-4 px-5">ĐỐI TÁC</th>
                <th className="py-4 px-5">GIÁ BÁN</th>
                <th className="py-4 px-5">SỐ LƯỢNG CÒN</th>
                <th className="py-4 px-5">HẠN BÁN</th>
                <th className="py-4 px-5">TRẠNG THÁI HIỂN THỊ</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-48 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-36" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-200 rounded-lg w-28 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="inventory_2" className="text-4xl block mb-2 text-slate-300" />
                    {debouncedSearch
                      ? "Không tìm thấy voucher nào phù hợp với từ khóa tìm kiếm."
                      : "Không có voucher nào trong danh mục này."}
                  </td>
                </tr>
              ) : (
                vouchers.map((item) => {
                  const stockNum = Number(item.stock) || 0;
                  const isStockOut = stockNum <= 0;
                  const isExpired = new Date(item.sale_end_at).getTime() < Date.now();
                  const isRuleTriggered = isStockOut || isExpired;

                  const originalPriceNum = Number(item.original_price) || 0;
                  const salePriceNum = Number(item.sale_price) || 0;

                  return (
                    <tr key={item.program_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs">
                        VCH-{item.program_id}
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.program_name}
                        </div>
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
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Tạm ngưng */}
                          {item.display_status === "PUBLISHED" && (
                            <Button
                              variant="outline"
                              onClick={() => handleOpenStatusModal(item, "HIDDEN")}
                              className="px-3 py-1.5 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 text-xs h-auto"
                              title="Tạm ngưng hiển thị bán trên sàn"
                            >
                              Tạm ngưng
                            </Button>
                          )}

                          {/* Nút Khôi phục về Đang bán */}
                          {item.display_status !== "PUBLISHED" && (
                            <Button
                              disabled={isRuleTriggered}
                              onClick={() => handleOpenStatusModal(item, "PUBLISHED")}
                              className={`px-3 py-1.5 text-xs h-auto ${
                                isRuleTriggered
                                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                              }`}
                              title={
                                isRuleTriggered
                                  ? "Đã hết số lượng phát hành hoặc quá hạn bán, không thể khôi phục!"
                                  : "Khôi phục trạng thái Đang bán"
                              }
                            >
                              Khôi phục
                            </Button>
                          )}

                          {/* Nút Ngừng bán */}
                          {item.display_status !== "ENDED" && (
                            <Button
                              variant="outline"
                              onClick={() => handleOpenStatusModal(item, "ENDED")}
                              className="px-3 py-1.5 bg-slate-100 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs h-auto"
                              title="Ngừng bán chương trình voucher này"
                            >
                              Ngừng bán
                            </Button>
                          )}
                        </div>
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

      {/* Dialog Box xác nhận đổi trạng thái voucher */}
      <VoucherStatusModal
        isOpen={Boolean(statusDialog?.isOpen)}
        voucher={statusDialog?.voucher ?? null}
        targetStatus={statusDialog?.targetStatus ?? null}
        onClose={() => {
          setStatusDialog(null);
          setModalErrorMessage(null);
        }}
        onConfirm={handleConfirmStatusChange}
        isSubmitting={isStatusSubmitting}
        errorMessage={modalErrorMessage}
      />
    </div>
  );
}
