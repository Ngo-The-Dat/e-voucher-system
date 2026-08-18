"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { customerOrderApi, CustomerOrder } from "@/lib/customer-api";
import {
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Ticket,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Search,
  Filter,
  RotateCcw
} from "lucide-react";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Filter States
  const [statusTab, setStatusTab] = useState<"all" | "paid" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await customerOrderApi.getOrders({ page: 1, limit: 50 });
        if (res && res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.warn("Không kết nối được API đơn hàng backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleResetFilters = () => {
    setStatusTab("all");
    setSearchTerm("");
    setPaymentMethodFilter("all");
    setTimeRangeFilter("all");
  };

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const isPaid = order.payment_status === "PAID" || order.order_status === "COMPLETED";

      // 1. Status tab filter
      if (statusTab === "paid" && !isPaid) return false;
      if (statusTab === "failed" && isPaid) return false;

      // 2. Search term (by Order ID, or Item Program Name)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchId = String(order.order_id).includes(query) || `ord-${order.order_id}`.includes(query);
        const matchItem = order.items?.some((item) => item.program_name.toLowerCase().includes(query));
        if (!matchId && !matchItem) return false;
      }

      // 3. Payment method filter
      if (paymentMethodFilter !== "all") {
        const method = (order.payment_method || "").toUpperCase();
        if (paymentMethodFilter === "VNPAY" && !method.includes("VN")) return false;
        if (paymentMethodFilter === "MOMO" && !method.includes("MOMO")) return false;
        if (paymentMethodFilter === "CARD" && !method.includes("CREDIT") && !method.includes("CARD") && !method.includes("VISA")) return false;
      }

      // 4. Time range filter
      if (timeRangeFilter !== "all") {
        const orderDate = new Date(order.created_at).getTime();
        const now = Date.now();
        const daysDiff = (now - orderDate) / (1000 * 3600 * 24);

        if (timeRangeFilter === "30" && daysDiff > 30) return false;
        if (timeRangeFilter === "90" && daysDiff > 90) return false;
        if (timeRangeFilter === "year") {
          const currentYear = new Date().getFullYear();
          const orderYear = new Date(order.created_at).getFullYear();
          if (orderYear !== currentYear) return false;
        }
      }

      return true;
    });
  }, [orders, statusTab, searchTerm, paymentMethodFilter, timeRangeFilter]);

  const paidCount = useMemo(
    () => orders.filter((o) => o.payment_status === "PAID" || o.order_status === "COMPLETED").length,
    [orders]
  );
  const failedCount = useMemo(
    () => orders.filter((o) => o.payment_status === "FAILED" || o.order_status === "CANCELLED").length,
    [orders]
  );

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
        <Link href="/" className="font-label-md text-label-md text-text-muted hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4 text-text-muted" />
        <span className="font-label-md text-label-md font-semibold text-on-surface">Lịch sử đơn hàng</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-text-main">Lịch sử đơn hàng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Xem lại danh sách đơn hàng đã mua, tìm kiếm và kiểm tra biên lai thanh toán.
          </p>
        </div>
        <Link
          href="/my-vouchers"
          className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2.5 rounded-lg font-label-md text-label-md font-bold hover:opacity-90 transition-all self-start md:self-auto"
        >
          <Ticket className="w-4 h-4" />
          Kho Voucher của tôi
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-surface rounded-xl border border-outline-variant p-4 md:p-6 mb-8 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-outline-variant/60 no-scrollbar gap-2 pb-2">
          {[
            { id: "all", label: "Tất cả đơn hàng", count: orders.length },
            { id: "paid", label: "Đã thanh toán", count: paidCount },
            { id: "failed", label: "Thanh toán thất bại", count: failedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors flex items-center gap-2 font-bold cursor-pointer ${
                statusTab === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                statusTab === tab.id ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface-variant"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Selectors Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
          {/* Search Box (Span 5) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã đơn hàng (#10) hoặc tên voucher..."
              className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface shadow-sm"
            />
          </div>

          {/* Payment Method Selector (Span 3) */}
          <div className="lg:col-span-3">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface shadow-sm cursor-pointer"
            >
              <option value="all">Tất cả phương thức thanh toán</option>
              <option value="VNPAY">Ví VNPay</option>
              <option value="MOMO">Ví MoMo</option>
              <option value="CARD">Thẻ ATM / Visa / Mastercard</option>
            </select>
          </div>

          {/* Time Range Selector (Span 3) */}
          <div className="lg:col-span-3">
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface shadow-sm cursor-pointer"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="30">30 ngày gần đây</option>
              <option value="90">90 ngày gần đây</option>
              <option value="year">Trong năm nay ({new Date().getFullYear()})</option>
            </select>
          </div>

          {/* Reset Filters Button (Span 1) */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
              className="p-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer flex items-center justify-center w-full lg:w-auto"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Summary indicator */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/30">
          <span>
            Hiển thị <strong className="text-on-surface font-bold">{filteredOrders.length}</strong> / {orders.length} đơn hàng
          </span>
          {(statusTab !== "all" || searchTerm || paymentMethodFilter !== "all" || timeRangeFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-outline-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-body-md text-body-md text-on-surface-variant">Đang tải lịch sử đơn hàng...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.order_id;
            const isPaid = order.payment_status === "PAID" || order.order_status === "COMPLETED";

            return (
              <div
                key={order.order_id}
                className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden transition-all"
              >
                {/* Order Header Bar */}
                <div className="bg-surface-container-low p-4 md:p-6 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          Đơn hàng #{order.order_id}
                        </span>
                        {order.order_status === "CANCELLED" ? (
                          <span className="bg-error-container/40 text-error px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Đã hủy
                          </span>
                        ) : isPaid ? (
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Thanh toán thất bại
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-muted" />
                        Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-bold">
                        Tổng tiền
                      </p>
                      <p className="font-headline-sm text-headline-sm font-bold text-primary">
                        {order.total_amount.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpand(order.order_id)}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-container-high border border-outline-variant text-on-surface-variant transition-colors cursor-pointer"
                      title={isExpanded ? "Thu gọn" : "Xem chi tiết & biên lai"}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Order Summary Line items (Always visible) */}
                <div className="p-4 md:p-6 flex flex-col gap-4">
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <Ticket className="w-5 h-5 text-primary shrink-0" />
                          <div>
                            <p className="font-title-md text-title-md font-semibold text-on-surface">
                              {item.program_name}
                            </p>
                            <p className="font-body-md text-body-md text-xs text-on-surface-variant">
                              Số lượng: <span className="font-bold">{item.quantity}</span> x {item.unit_price.toLocaleString("vi-VN")} đ
                            </p>
                          </div>
                        </div>
                        <p className="font-label-md text-label-md font-bold text-on-surface self-end sm:self-auto">
                          {(item.quantity * item.unit_price).toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Expandable Digital Receipt & Voucher details */}
                  {isExpanded && (
                    <div className="mt-4 pt-6 border-t border-outline-variant space-y-6 animate-fadeIn">
                      {/* Receipt Card */}
                      <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant relative overflow-hidden">
                        {/* Receipt Stamp */}
                        <div className="absolute top-4 right-4 rotate-12 border-2 border-primary/30 text-primary px-4 py-1 rounded font-bold uppercase tracking-widest text-xs select-none">
                          {order.order_status === "CANCELLED" ? "ĐÃ HỦY ĐƠN" : isPaid ? "Đã Thanh Toán" : "Thanh Toán Thất Bại"}
                        </div>

                        <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-primary" />
                          Biên lai thanh toán
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body-md text-body-md text-on-surface-variant">
                          <div>
                            <p className="text-xs text-text-muted font-bold">MÃ ĐƠN HÀNG</p>
                            <p className="font-semibold text-on-surface">ORD-{order.order_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted font-bold">PHƯƠNG THỨC THANH TOÁN</p>
                            <p className="font-semibold text-on-surface flex items-center gap-1 mt-0.5">
                              <CreditCard className="w-4 h-4 text-primary" />
                              {order.payment_method || "VNPay"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted font-bold">NGƯỜI MUA</p>
                            <p className="font-semibold text-on-surface">{order.buyer_name || "Khách hàng"}</p>
                          </div>
                          {order.recipient_name && (
                            <div>
                              <p className="text-xs text-text-muted font-bold">NGƯỜI NHẬN VOUCHER</p>
                              <p className="font-semibold text-on-surface">{order.recipient_name}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                          <span className="font-bold text-on-surface">Tổng tiền đã thanh toán:</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary">
                            {order.total_amount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>

                      {/* Link to My Vouchers */}
                      <div className="flex justify-end">
                        <Link
                          href="/my-vouchers"
                          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold hover:opacity-95 transition-all shadow-sm inline-flex items-center gap-2"
                        >
                          <Ticket className="w-4 h-4" />
                          Xem danh sách mã voucher đã cấp
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-outline-variant border-dashed">
          <ShoppingBag className="w-16 h-16 text-surface-variant mb-4" />
          <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
            Không tìm thấy đơn hàng phù hợp
          </h3>
          <p className="font-body-md text-body-md text-text-muted text-center max-w-md mb-6 px-4">
            Không có đơn hàng nào khớp với từ khóa hoặc bộ lọc bạn chọn. Thử đặt lại bộ lọc để xem đầy đủ danh sách.
          </p>
          <button
            onClick={handleResetFilters}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md font-semibold hover:opacity-95 transition-all shadow-sm cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </main>
  );
}
