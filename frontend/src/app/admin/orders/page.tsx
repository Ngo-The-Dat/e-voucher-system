/**
 * =========================================================================================
 * FILE: page.tsx
 * VỊ TRÍ: frontend/src/app/admin/orders/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Màn hình Quản lý & Tra cứu Đơn hàng Toàn Sàn (UC-ADM-04: Quản lý Đơn hàng, UC-ADM-09: Tra cứu đơn hàng).
 *   - Các tính năng chính:
 *       1. Tìm kiếm Debounce 400ms đa trường (Mã đơn, Người mua, Người nhận).
 *       2. Bộ lọc đa tiêu chí: Trạng thái đơn hàng (order_status), Trạng thái thanh toán (payment_status), Khoảng ngày đặt.
 *       3. Bảng danh sách đơn hàng chi tiết: Phân biệt người mua và người nhận (Trường hợp Mua tặng - Gift Order),
 *          Tổng tiền, Số lượng voucher, Badge trạng thái đồng bộ màu sắc chuẩn thiết kế.
 *       4. Phân trang 10 đơn hàng/trang và chuyển hướng sang trang chi tiết đơn hàng `[id]/page.tsx`.
 * =========================================================================================
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import { Input } from "@/components/shared/ui/Input";
import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import Pagination from "@/components/shared/ui/Pagination";
import { adminApi, AdminOrderListItem, AdminApiError } from "@/lib/admin-api";

export default function OrdersPage() {
  // ─── 1. State Bộ lọc & Tìm kiếm ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── 2. State Dữ liệu Đơn hàng & Thống kê ─────────────────────────────────────────
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [stats, setStats] = useState({
    all: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Debounce 400ms cho ô tìm kiếm
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * ---------------------------------------------------------------------------------------
   * HÀM: loadOrders
   * MỤC ĐÍCH: Gọi API `adminApi.getOrders` với toàn bộ bộ lọc và phân trang hiện tại.
   * ---------------------------------------------------------------------------------------
   */
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getOrders({
        search: debouncedSearch.trim() || undefined,
        orderStatus: orderStatusFilter !== "ALL" ? orderStatusFilter : undefined,
        paymentStatus: paymentStatusFilter !== "ALL" ? paymentStatusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 10,
      });
      setOrders(res.orders);
      setStats(res.stats);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách đơn hàng.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, orderStatusFilter, paymentStatusFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return { date: "—", time: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ xử lý", status: "pending" };
      case "COMPLETED":
        return { label: "Hoàn thành", status: "published" };
      case "CANCELLED":
        return { label: "Đã hủy", status: "rejected" };
      default:
        return { label: status, status: "draft" };
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return { label: "Chưa thanh toán", status: "pending" };
      case "PAID":
        return { label: "Đã thanh toán", status: "published" };
      case "FAILED":
        return { label: "Thanh toán thất bại", status: "rejected" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", status: "hidden" };
      default:
        return { label: status, status: "draft" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── PHẦN 1: Tiêu đề trang ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý & Tra cứu Đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu lịch sử đơn hàng, thông tin người mua - người nhận và trạng thái đối soát tài chính
          </p>
        </div>
      </div>

      {/* ─── PHẦN 2: Bộ Lọc Nâng Cao Đa Tiêu Chí (UC-ADM-09) ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Ô Tìm kiếm từ khóa */}
          <div className="sm:col-span-2 md:col-span-1">
            <FormField label="Tìm kiếm đơn hàng">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10" />
                <Input
                  type="text"
                  placeholder="Mã đơn, người mua, người nhận..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[38px] pl-9 pr-3 border-slate-200 rounded-xl"
                />
              </div>
            </FormField>
          </div>

          {/* Lọc Trạng thái đơn hàng (order_status) */}
          <div>
            <FormField label="Trạng thái đơn hàng">
              <div className="relative">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              </div>
            </FormField>
          </div>

          {/* Lọc Trạng thái thanh toán (payment_status) */}
          <div>
            <FormField label="Trạng thái thanh toán">
              <div className="relative">
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-[38px] pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="FAILED">Thanh toán thất bại</option>
                  <option value="REFUNDED">Đã hoàn tiền</option>
                </select>
                <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              </div>
            </FormField>
          </div>

          {/* Lọc Khoảng ngày đặt hàng */}
          <div>
            <FormField label="Ngày đặt hàng">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={(val) => {
                  setStartDate(val);
                  setCurrentPage(1);
                }}
                onEndDateChange={(val) => {
                  setEndDate(val);
                  setCurrentPage(1);
                }}
                onReset={() => {
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <Icon name="error" className="text-lg text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={loadOrders} className="text-xs text-rose-700 border-rose-200 bg-white">
            Thử lại
          </Button>
        </div>
      )}

      {/* ─── PHẦN 3: Bảng Danh Sách Đơn Hàng ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ ĐƠN HÀNG</th>
                <th className="py-4 px-5">NGƯỜI MUA (BUYER)</th>
                <th className="py-4 px-5">NGƯỜI NHẬN (RECIPIENT)</th>
                <th className="py-4 px-5">TỔNG TIỀN</th>
                <th className="py-4 px-5 whitespace-nowrap">TRẠNG THÁI ĐƠN</th>
                <th className="py-4 px-5 whitespace-nowrap">THANH TOÁN</th>
                <th className="py-4 px-5 whitespace-nowrap">NGÀY ĐẶT</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {/* Skeleton loading */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                /* Empty state */
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="search_off" className="text-4xl block mb-2 text-slate-300 mx-auto" />
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                /* Dữ liệu đơn hàng */
                orders.map((order) => {
                  const { date, time } = formatDateDisplay(order.created_at);
                  const oBadge = getOrderStatusBadge(order.order_status);
                  const pBadge = getPaymentStatusBadge(order.payment_status);

                  return (
                    <tr key={order.order_id} className="hover:bg-slate-50/60 transition">
                      {/* Mã đơn hàng */}
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        ORD-{order.order_id}
                      </td>

                      {/* Người mua (Buyer) */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{order.buyer_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{order.buyer_phone || order.buyer_email}</div>
                      </td>

                      {/* Người nhận (Recipient) - Phân biệt trường hợp quà tặng */}
                      <td className="py-4 px-5">
                        {order.recipient_name ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>🎁 {order.recipient_name}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {order.recipient_phone || order.recipient_email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            Tự nhận
                          </span>
                        )}
                      </td>

                      {/* Tổng tiền & Số lượng voucher */}
                      <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                        <span className="text-[11px] text-slate-400 font-normal block">
                          ({order.total_quantity} voucher)
                        </span>
                      </td>

                      {/* Trạng thái đơn hàng */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={oBadge.status} label={oBadge.label} />
                      </td>

                      {/* Trạng thái thanh toán */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={pBadge.status} label={pBadge.label} />
                      </td>

                      {/* Ngày đặt hàng */}
                      <td className="py-4 px-5 text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{date}</div>
                        <div className="text-slate-400">{time}</div>
                      </td>

                      {/* Thao tác xem chi tiết */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.order_id}`}
                          className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-block whitespace-nowrap"
                        >
                          Xem chi tiết
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
            itemsPerPage={10}
            onPageChange={setCurrentPage}
            itemName="đơn hàng"
          />
        )}
      </div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------------------
 * SUB-COMPONENT: DateRangePicker
 * MỤC ĐÍCH: Dropdown popover chọn khoảng thời gian (Từ ngày - Đến ngày) kèm nút reset.
 * -----------------------------------------------------------------------------------------
 */
function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Xử lý đóng dropdown khi nhấp ra bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-3 bg-white border rounded-xl text-sm font-medium flex items-center justify-between transition-all gap-2 ${
          hasFilter
            ? "border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/10"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icon name="calendar_today" className={`text-base ${hasFilter ? "text-blue-600" : "text-slate-400"}`} />
          <span className={`truncate text-sm ${hasFilter ? "font-semibold text-slate-900" : "text-slate-500"}`}>
            {hasFilter ? `${startDate} đến ${endDate}` : "Tất cả thời gian"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasFilter && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
                setIsOpen(false);
              }}
              className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition"
              title="Xóa lọc ngày"
            >
              <Icon name="close" className="text-sm" />
            </span>
          )}
          <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-lg text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3.5 animate-in fade-in zoom-in-95">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Từ ngày</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full h-[32px] px-2 py-1 bg-slate-50 border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Đến ngày</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full h-[32px] px-2 py-1 bg-slate-50 border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <Button variant="ghost" type="button" onClick={onReset} className="text-xs text-slate-400 hover:text-rose-500 p-0 h-auto">
              Xóa chọn
            </Button>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg h-auto"
            >
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
