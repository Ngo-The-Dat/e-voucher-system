"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { customerOrderApi, customerPaymentApi, CustomerOrder } from "@/lib/customer-api";
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
  RotateCcw,
  QrCode,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import PaymentSimulatorModal, { PaymentSimulatorOrder } from "@/components/customer/checkout/PaymentSimulatorModal";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Trạng thái tự động xử lý khi PayPal redirect về
  const [paypalCaptureStatus, setPaypalCaptureStatus] = useState<{
    status: "processing" | "success" | "error" | null;
    message?: string;
  }>({ status: null });

  // Payment simulator modal state
  const [selectedPayOrder, setSelectedPayOrder] = useState<PaymentSimulatorOrder | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Filter States
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "paid" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");

  const loadOrders = async () => {
    try {
      const res = await customerOrderApi.getOrders({ page: 1, limit: 50 });
      if (res && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn("Không kết nối được API đơn hàng backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    loadOrders();

    // Auto-polling and live tick every 1s for accurate 5-minute countdowns
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    const pollInterval = setInterval(() => {
      loadOrders();
    }, 3000);

    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        loadOrders();
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    // Tự động kiểm tra và capture nếu được PayPal hoặc Stripe redirect về
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const orderIdStr = urlParams.get("order_id");
      const isPaypalSuccess = urlParams.get("paypal_success") === "true";
      const isStripeSuccess = urlParams.get("stripe_success") === "true";
      const sessionId = urlParams.get("session_id");
      let pendingZaloPay: { orderId?: number; appTransId?: string } | null = null;
      try {
        const storedPayment = window.localStorage.getItem("pending_zalopay_payment");
        if (storedPayment) pendingZaloPay = JSON.parse(storedPayment);
      } catch {
        window.localStorage.removeItem("pending_zalopay_payment");
      }

      // 1. Xử lý khi Stripe redirect về
      if (isStripeSuccess && orderIdStr) {
        const orderId = parseInt(orderIdStr, 10);
        setPaypalCaptureStatus({
          status: "processing",
          message: "Đang tự động xác thực giao dịch Stripe và phát hành mã Voucher...",
        });

        window.history.replaceState({}, document.title, window.location.pathname);

        if (orderId && !isNaN(orderId)) {
          customerPaymentApi
            .captureStripeOrder(orderId, sessionId || undefined)
            .then(() => {
              setPaypalCaptureStatus({
                status: "success",
                message: `Thanh toán Stripe cho đơn hàng #${orderId} thành công! Các mã E-Voucher đã được phát hành vào kho của bạn.`,
              });
              loadOrders();
            })
            .catch((err) => {
              console.warn("Lỗi auto capture Stripe redirect:", err);
              setPaypalCaptureStatus({
                status: "error",
                message: err.message || "Không thể hoàn tất thanh toán tự động qua Stripe.",
              });
              loadOrders();
            });
        }
      }
      // 2. Xử lý khi PayPal redirect về
      else if (token && (orderIdStr || isPaypalSuccess)) {
        const orderId = orderIdStr ? parseInt(orderIdStr, 10) : undefined;
        
        setPaypalCaptureStatus({
          status: "processing",
          message: "Đang tự động khớp lệnh thanh toán PayPal và phát hành mã Voucher...",
        });

        // Xóa query params khỏi URL để không bị re-trigger khi F5
        window.history.replaceState({}, document.title, window.location.pathname);

        if (orderId && !isNaN(orderId)) {
          customerPaymentApi
            .capturePayPalOrder(orderId, token)
            .then(() => {
              setPaypalCaptureStatus({
                status: "success",
                message: `Thanh toán PayPal cho đơn hàng #${orderId} thành công! Các mã E-Voucher đã được phát hành vào kho của bạn.`,
              });
              loadOrders();
            })
            .catch((err) => {
              console.warn("Lỗi auto capture PayPal redirect:", err);
              setPaypalCaptureStatus({
                status: "error",
                message: err.message || "Không thể hoàn tất thanh toán tự động qua PayPal.",
              });
              loadOrders();
            });
        }
      }
      // 3. Xử lý khi ZaloPay redirect về (nhận diện qua apptransid, status, zalopay_redirect)
      const appTransId = urlParams.get("apptransid") || pendingZaloPay?.appTransId || null;
      const isZaloPayRedirect =
        urlParams.get("zalopay_redirect") === "true" ||
        Boolean(appTransId) ||
        (urlParams.has("status") && urlParams.has("checksum")) ||
        Boolean(pendingZaloPay);

      if (isZaloPayRedirect) {
        const zaloStatus = urlParams.get("status");
        const zaloAmount = urlParams.get("amount");
        const zaloChecksum = urlParams.get("checksum");
        const statusNum = zaloStatus !== null ? parseInt(zaloStatus, 10) : 1;

        let orderId: number | null = null;
        if (orderIdStr) {
          orderId = parseInt(orderIdStr, 10);
        } else if (pendingZaloPay?.orderId) {
          orderId = Number(pendingZaloPay.orderId);
        } else if (appTransId) {
          const parts = appTransId.split("_");
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            orderId = parseInt(parts[1], 10);
          }
        }

        window.history.replaceState({}, document.title, window.location.pathname);

        if (orderId && !isNaN(orderId)) {
          if (statusNum === 1 || statusNum === 0) {
            setPaypalCaptureStatus({
              status: "processing",
              message: "Đang tự động xác thực giao dịch ZaloPay Sandbox và phát hành mã Voucher...",
            });

            customerPaymentApi
              .captureZaloPayOrder(orderId, {
                status: statusNum,
                apptransid: appTransId,
                amount: zaloAmount,
                checksum: zaloChecksum,
              })
              .then(() => {
                window.localStorage.removeItem("pending_zalopay_payment");
                setPaypalCaptureStatus({
                  status: "success",
                  message: `Thanh toán ZaloPay cho đơn hàng #${orderId} thành công! Các mã E-Voucher đã được phát hành vào kho của bạn.`,
                });
                loadOrders();
              })
              .catch((err) => {
                console.warn("Lỗi auto capture ZaloPay redirect:", err);
                setPaypalCaptureStatus({
                  status: "error",
                  message: err.message || "Không thể hoàn tất thanh toán tự động qua ZaloPay.",
                });
                loadOrders();
              });
          } else {
            setPaypalCaptureStatus({
              status: "error",
              message: `Giao dịch ZaloPay #${orderId} không thành công hoặc đã bị hủy.`,
            });
            loadOrders();
          }
        }
      }
    }

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, []);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleOpenPayment = (order: CustomerOrder) => {
    setSelectedPayOrder({
      orderId: order.order_id,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      elapsedSeconds: order.elapsed_seconds,
      items: order.items?.map((item) => ({
        program_name: item.program_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    setIsPayModalOpen(true);
  };

  const handleResetFilters = () => {
    setStatusTab("all");
    setSearchTerm("");
    setPaymentMethodFilter("all");
    setTimeRangeFilter("all");
  };

  // Helper tính toán trạng thái đơn hàng & thời gian đếm ngược chính xác
  const getOrderState = (order: CustomerOrder) => {
    const isPaid = order.payment_status === "PAID" || order.order_status === "COMPLETED";
    const isCancelled = order.order_status === "CANCELLED" || order.payment_status === "FAILED";

    let elapsedSecs = 0;
    if (typeof order.elapsed_seconds === "number" && !isNaN(order.elapsed_seconds)) {
      elapsedSecs = order.elapsed_seconds;
    } else {
      const createdMs = new Date(order.created_at).getTime();
      if (!isNaN(createdMs)) {
        elapsedSecs = Math.max(0, Math.floor((currentTime - createdMs) / 1000));
      }
    }

    const remainingSecs = Math.max(0, 300 - elapsedSecs);
    const isExpired = !isPaid && !isCancelled && remainingSecs <= 0;
    const isPendingActive = !isPaid && !isCancelled && !isExpired;
    const isFailedOrExpired = isCancelled || isExpired;

    const minutesLeft = Math.floor(remainingSecs / 60);
    const secondsLeft = remainingSecs % 60;
    const formattedRemaining = `${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;

    return {
      isPaid,
      isCancelled,
      isExpired,
      isPendingActive,
      isFailedOrExpired,
      remainingSecs,
      formattedRemaining,
    };
  };

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const isPaid = order.payment_status === "PAID" || order.order_status === "COMPLETED";
      const state = getOrderState(order);

      // 1. Status tab filter
      if (statusTab === "pending" && !state.isPendingActive) return false;
      if (statusTab === "paid" && !state.isPaid) return false;
      if (statusTab === "failed" && !state.isFailedOrExpired) return false;

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
        if (paymentMethodFilter === "STRIPE" && !method.includes("STRIPE") && !method.includes("CARD") && !method.includes("VISA")) return false;
        if (paymentMethodFilter === "PAYPAL" && !method.includes("PAYPAL")) return false;
        if (paymentMethodFilter === "VNPAY" && !method.includes("VN")) return false;
        if (paymentMethodFilter === "ZALOPAY" && !method.includes("ZALO")) return false;
        if (paymentMethodFilter === "CARD" && !method.includes("CREDIT") && !method.includes("CARD") && !method.includes("VISA") && !method.includes("STRIPE")) return false;
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
  }, [orders, statusTab, searchTerm, paymentMethodFilter, timeRangeFilter, currentTime]);

  const pendingCount = useMemo(
    () => orders.filter((o) => getOrderState(o).isPendingActive).length,
    [orders, currentTime]
  );
  const paidCount = useMemo(
    () => orders.filter((o) => getOrderState(o).isPaid).length,
    [orders, currentTime]
  );
  const failedCount = useMemo(
    () => orders.filter((o) => getOrderState(o).isFailedOrExpired).length,
    [orders, currentTime]
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

      {/* PayPal Auto-Capture Status Alert Banner */}
      {paypalCaptureStatus.status && (
        <div
          className={`p-4 rounded-xl mb-6 border flex items-center justify-between gap-3 animate-fade-in ${
            paypalCaptureStatus.status === "processing"
              ? "bg-primary/10 border-primary/30 text-primary"
              : paypalCaptureStatus.status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <div className="flex items-center gap-3">
            {paypalCaptureStatus.status === "processing" ? (
              <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
            ) : paypalCaptureStatus.status === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{paypalCaptureStatus.message}</p>
          </div>
          {paypalCaptureStatus.status !== "processing" && (
            <button
              type="button"
              onClick={() => setPaypalCaptureStatus({ status: null })}
              className="text-xs font-bold px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-surface rounded-xl border border-outline-variant p-4 md:p-6 mb-8 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-outline-variant/60 no-scrollbar gap-2 pb-2">
          {[
            { id: "all", label: "Tất cả đơn hàng", count: orders.length },
            { id: "pending", label: "Chờ thanh toán", count: pendingCount },
            { id: "paid", label: "Đã thanh toán", count: paidCount },
            { id: "failed", label: "Đã hủy / Thất bại", count: failedCount }
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
              <option value="ZALOPAY">Ví ZaloPay</option>
              <option value="STRIPE">Thẻ Quốc tế (Stripe)</option>
              <option value="PAYPAL">Ví PayPal</option>
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
            const state = getOrderState(order);

            return (
              <div
                key={order.order_id}
                className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden transition-all"
              >
                {/* Order Header Bar */}
                <div className="bg-surface-container-low p-4 md:p-6 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      state.isPaid
                        ? "bg-secondary/10 text-secondary"
                        : state.isPendingActive
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          Đơn hàng #{order.order_id}
                        </span>
                        {state.isExpired ? (
                          <span className="bg-error-container/40 text-error px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Hết hạn thanh toán (Quá 5 phút)
                          </span>
                        ) : state.isCancelled ? (
                          <span className="bg-error-container/40 text-error px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Đã hủy
                          </span>
                        ) : state.isPaid ? (
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hoàn thành
                          </span>
                        ) : state.isPendingActive ? (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-3 py-1 rounded-full font-label-sm text-label-sm font-bold inline-flex items-center gap-1 border border-amber-300/40">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            Chờ thanh toán (Còn {state.formattedRemaining})
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

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4">
                    {/* Continue payment button for pending orders within 5-minute window */}
                    {state.isPendingActive && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(order)}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Tiếp tục thanh toán</span>
                      </button>
                    )}

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
                          {state.isExpired
                            ? "HẾT HẠN THANH TOÁN"
                            : state.isCancelled
                            ? "ĐÃ HỦY ĐƠN"
                            : state.isPaid
                            ? "ĐÃ THANH TOÁN"
                            : state.isPendingActive
                            ? "CHỜ THANH TOÁN"
                            : "THANH TOÁN THẤT BÀI"}
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
                          <span className="font-bold text-on-surface">Tổng tiền:</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary">
                            {order.total_amount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>

                      {/* Action Links based on Status */}
                      <div className="flex justify-end gap-3 flex-wrap">
                        {state.isPaid && (
                          <Link
                            href="/my-vouchers"
                            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold hover:opacity-95 transition-all shadow-sm inline-flex items-center gap-2"
                          >
                            <Ticket className="w-4 h-4" />
                            Xem danh sách mã voucher đã cấp
                          </Link>
                        )}
                        {state.isPendingActive && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(order)}
                            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold hover:opacity-95 transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                            Tiếp tục quét mã thanh toán
                          </button>
                        )}
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

      {/* Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        order={selectedPayOrder}
        onPaymentSuccess={() => {
          loadOrders();
        }}
      />
    </main>
  );
}
