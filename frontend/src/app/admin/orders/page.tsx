"use client";

import Icon from "@/components/admin/Icon";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MOCK_ORDERS, OrderData } from "./data";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [orders] = useState<OrderData[]>(MOCK_ORDERS);

  // Bộ lọc Tra cứu Đơn hàng (UC-ADM-09) - Giữ nguyên các bộ lọc chính
  const filteredOrders = orders.filter((item) => {
    // Search query match (Khách hàng / Mã đơn)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.orderId.toLowerCase().includes(q) ||
        item.buyerName.toLowerCase().includes(q) ||
        item.buyerEmail.toLowerCase().includes(q) ||
        item.buyerPhone.toLowerCase().includes(q) ||
        (item.recipientName && item.recipientName.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    // Filter Order Status
    if (orderStatusFilter !== "ALL" && item.orderStatus !== orderStatusFilter) {
      return false;
    }
    // Filter Payment Status
    if (paymentStatusFilter !== "ALL" && item.paymentStatus !== paymentStatusFilter) {
      return false;
    }
    // Filter Date Range
    if (startDate || endDate) {
      const [day, month, year] = item.orderDate.split("/");
      const oDate = `${year}-${month}-${day}`;
      if (startDate && oDate < startDate) return false;
      if (endDate && oDate > endDate) return false;
    }
    return true;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " ₫";
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ xử lý", class: "bg-amber-50 text-amber-700 border-amber-200" };
      case "CONFIRMED":
        return { label: "Đã xác nhận", class: "bg-blue-50 text-blue-700 border-blue-200" };
      case "COMPLETED":
        return { label: "Hoàn thành", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "CANCELLED":
        return { label: "Đã hủy", class: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return { label: "Chưa thanh toán", class: "bg-amber-50 text-amber-700 border-amber-200" };
      case "PAID":
        return { label: "Đã thanh toán", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "FAILED":
        return { label: "Thanh toán thất bại", class: "bg-rose-50 text-rose-700 border-rose-200" };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", class: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý & Tra cứu Đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu lịch sử đơn hàng, thông tin người mua - người nhận và trạng thái đối soát tài chính
          </p>
        </div>
      </div>

      {/* Tra cứu & Bộ lọc Nâng cao (UC-ADM-09) - Giữ nguyên bộ lọc */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Ô Tìm kiếm */}
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Tìm kiếm đơn hàng
            </label>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Mã đơn, người mua, người nhận..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[38px] pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Lọc Trạng thái đơn hàng */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Trạng thái đơn hàng
            </label>
            <div className="relative">
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[38px] pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                <option value="ALL">Tất cả trạng thái đơn</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
              <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            </div>
          </div>

          {/* Lọc Trạng thái thanh toán */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Trạng thái thanh toán
            </label>
            <div className="relative">
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[38px] pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                <option value="ALL">Tất cả thanh toán</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="FAILED">Thanh toán thất bại</option>
                <option value="REFUNDED">Đã hoàn tiền</option>
              </select>
              <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            </div>
          </div>

          {/* Lọc ngày đặt hàng */}
          <div>
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
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Đơn Hàng */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-4 px-5">MÃ ĐƠN HÀNG</th>
                <th className="py-4 px-5">NGƯỜI MUA (BUYER)</th>
                <th className="py-4 px-5">NGƯỜI NHẬN (RECIPIENT)</th>
                <th className="py-4 px-5">TỔNG TIỀN</th>
                <th className="py-4 px-5">TRẠNG THÁI ĐƠN</th>
                <th className="py-4 px-5">THANH TOÁN</th>
                <th className="py-4 px-5">NGÀY ĐẶT</th>
                <th className="py-4 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length === 0 ? (
                /* Thông báo rỗng (Luồng A1) */
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <Icon name="search_off" className="text-4xl block mb-2 text-slate-300" />
                    Không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const oBadge = getOrderStatusBadge(order.orderStatus);
                  const pBadge = getPaymentStatusBadge(order.paymentStatus);

                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 text-xs">
                        {order.orderId}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{order.buyerName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{order.buyerPhone}</div>
                      </td>
                      <td className="py-4 px-5">
                        {order.isGift && order.recipientName ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>🎁 {order.recipientName}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {order.recipientPhone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            Tự nhận
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 font-semibold text-xs rounded-full border inline-flex items-center gap-1.5 ${oBadge.class}`}
                        >
                          {oBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 font-semibold text-xs rounded-full border inline-flex items-center gap-1.5 ${pBadge.class}`}
                        >
                          {pBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">{order.orderDate}</div>
                        <div className="text-slate-400">{order.orderTime}</div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {/* Dẫn sang trang Chi tiết Đơn hàng riêng biệt (/orders/[id]) */}
                        <Link
                          href={`/admin/orders/${order.orderId}`}
                          className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition shadow-2xs inline-block"
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

        {/* Footer & Phân trang */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-bold text-slate-900">1</span> đến{" "}
            <span className="font-bold text-slate-900">{filteredOrders.length}</span> trong{" "}
            <span className="font-bold text-slate-900">{orders.length}</span> đơn hàng
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 transition"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition ${
                currentPage === 1
                  ? "border border-blue-500 bg-blue-50/50 text-blue-600"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component Bộ chọn Ngày (DateRangePicker)
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
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-500">Ngày đặt hàng</label>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition"
          >
            Xóa
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-3 bg-white border rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all gap-2 shadow-2xs ${
          hasFilter
            ? "border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/10"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icon name="calendar_today" className={`text-lg ${hasFilter ? "text-blue-600" : "text-slate-400"}`} />
          <span className={`truncate ${hasFilter ? "font-semibold text-slate-900" : "text-slate-400"}`}>
            {hasFilter ? `${startDate} đến ${endDate}` : "Tất cả thời gian"}
          </span>
        </div>
        <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-lg text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <button type="button" onClick={onReset} className="text-xs text-slate-400 hover:text-rose-500">
              Xóa chọn
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
