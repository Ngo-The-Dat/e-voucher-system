"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Clock,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  CreditCard,
  Building2,
  RefreshCw,
  Globe,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { customerOrderApi, customerPaymentApi } from "@/lib/customer-api";
import notify from "@/lib/notify";

export interface PaymentSimulatorOrder {
  orderId: number;
  totalAmount: number;
  paymentMethod?: string;
  createdAt?: string;
  elapsedSeconds?: number;
  items?: Array<{
    program_name: string;
    quantity: number;
    unit_price?: number;
  }>;
}

interface PaymentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PaymentSimulatorOrder | null;
  onPaymentSuccess?: (vouchers: any[]) => void;
}

export default function PaymentSimulatorModal({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
}: PaymentSimulatorModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);

  // PayPal specific state
  const [paypalDetails, setPaypalDetails] = useState<{
    paypalOrderId: string;
    amountUsd: number;
    exchangeRate: number;
    rateSource?: string;
    approveUrl?: string;
  } | null>(null);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Stripe specific state
  const [stripeDetails, setStripeDetails] = useState<{
    sessionId: string;
    checkoutUrl: string;
    amountVnd: number;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // ZaloPay card sandbox state
  const [zaloPayDetails, setZaloPayDetails] = useState<{
    appTransId: string;
    amountVnd: number;
    orderUrl: string;
  } | null>(null);
  const [zaloPayLoading, setZaloPayLoading] = useState(false);

  // VNPay specific state
  const [vnpayDetails, setVnpayDetails] = useState<{
    payUrl: string;
    amountVnd: number;
  } | null>(null);
  const [vnpayLoading, setVnpayLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPayPal = useMemo(() => {
    return (order?.paymentMethod || "").toUpperCase().includes("PAYPAL");
  }, [order?.paymentMethod]);

  const isStripe = useMemo(() => {
    const m = (order?.paymentMethod || "").toUpperCase();
    return m.includes("STRIPE") || m.includes("CARD") || m.includes("VISA") || m.includes("MASTER");
  }, [order?.paymentMethod]);

  const isZaloPay = useMemo(() => {
    const m = (order?.paymentMethod || "").toUpperCase();
    return m.includes("ZALO") || m.includes("ZALOPAY");
  }, [order?.paymentMethod]);

  const isVNPay = useMemo(() => {
    return (order?.paymentMethod || "").toUpperCase().includes("VNPAY");
  }, [order?.paymentMethod]);

  // Khởi tạo PayPal Order khi modal mở cho đơn PayPal
  useEffect(() => {
    if (!isOpen || !order || !isPayPal) {
      setPaypalDetails(null);
      return;
    }

    setPaypalDetails(null);
    setPaypalLoading(true);
    setErrorMessage(null);

    customerPaymentApi
      .createPayPalOrder(order.orderId)
      .then((res) => {
        if (res.success && res.payment) {
          setPaypalDetails({
            paypalOrderId: res.payment.paypal_order_id,
            amountUsd: res.payment.amount_usd,
            exchangeRate: res.payment.exchange_rate,
            rateSource: res.payment.rate_source,
            approveUrl: res.payment.approve_url,
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi khi khởi tạo đơn hàng PayPal:", err);
        setErrorMessage(err.message || "Không thể kết nối cổng PayPal Sandbox.");
      })
      .finally(() => {
        setPaypalLoading(false);
      });
  }, [isOpen, order?.orderId, isPayPal]);

  // Khởi tạo Stripe Checkout Session khi modal mở cho đơn Stripe
  useEffect(() => {
    if (!isOpen || !order || !isStripe) {
      setStripeDetails(null);
      return;
    }

    setStripeDetails(null);
    setStripeLoading(true);
    setErrorMessage(null);

    customerPaymentApi
      .createStripeSession(order.orderId)
      .then((res) => {
        if (res.success && res.payment) {
          setStripeDetails({
            sessionId: res.payment.session_id,
            checkoutUrl: res.payment.checkout_url,
            amountVnd: res.payment.amount_vnd,
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi khi khởi tạo đơn hàng Stripe:", err);
        setErrorMessage(err.message || "Không thể kết nối cổng Stripe Sandbox.");
      })
      .finally(() => {
        setStripeLoading(false);
      });
  }, [isOpen, order?.orderId, isStripe]);

  // Khởi tạo ZaloPay Payment Session khi modal mở cho đơn ZaloPay
  useEffect(() => {
    if (!isOpen || !order || !isZaloPay) {
      setZaloPayDetails(null);
      return;
    }

    setZaloPayDetails(null);
    setZaloPayLoading(true);
    setErrorMessage(null);

    customerPaymentApi
      .createZaloPayPayment(order.orderId)
      .then((res) => {
        if (res.success && res.payment) {
          setZaloPayDetails({
            appTransId: res.payment.app_trans_id,
            amountVnd: res.payment.amount_vnd,
            orderUrl: res.payment.order_url,
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi khi khởi tạo đơn hàng ZaloPay:", err);
        setErrorMessage(err.message || "Không thể kết nối cổng ZaloPay Sandbox.");
      })
      .finally(() => {
        setZaloPayLoading(false);
      });
  }, [isOpen, order?.orderId, isZaloPay]);

  // Khởi tạo VNPay Payment Session khi modal mở cho đơn VNPay
  useEffect(() => {
    if (!isOpen || !order || !isVNPay) {
      setVnpayDetails(null);
      return;
    }

    setVnpayDetails(null);
    setVnpayLoading(true);
    setErrorMessage(null);

    customerPaymentApi
      .createVNPayPayment(order.orderId)
      .then((res) => {
        if (res.success && res.payment) {
          setVnpayDetails({
            payUrl: res.payment.pay_url,
            amountVnd: res.payment.amount_vnd,
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi khi khởi tạo đơn hàng VNPay:", err);
        setErrorMessage(err.message || "Không thể kết nối cổng VNPay Sandbox.");
      })
      .finally(() => {
        setVnpayLoading(false);
      });
  }, [isOpen, order?.orderId, isVNPay]);

  // Tính toán thời gian đếm ngược 5 phút
  useEffect(() => {
    if (!isOpen || !order) return;

    setIsSuccess(false);
    setIsProcessing(false);
    setErrorMessage(null);

    let initialRemaining = 300;
    if (typeof order.elapsedSeconds === "number" && !isNaN(order.elapsedSeconds)) {
      initialRemaining = Math.max(0, 300 - order.elapsedSeconds);
    } else if (order.createdAt) {
      const createdMs = new Date(order.createdAt).getTime();
      if (!isNaN(createdMs)) {
        const diffSecs = Math.floor((Date.now() - createdMs) / 1000);
        if (diffSecs >= 0 && diffSecs <= 300) {
          initialRemaining = 300 - diffSecs;
        } else if (diffSecs > 300) {
          initialRemaining = 0;
        }
      }
    }

    setTimeLeftSeconds(initialRemaining);

    const startTime = Date.now();
    const startSecs = initialRemaining;

    const timer = setInterval(() => {
      const elapsedSinceOpened = Math.floor((Date.now() - startTime) / 1000);
      const currentRemaining = Math.max(0, startSecs - elapsedSinceOpened);
      setTimeLeftSeconds(currentRemaining);
      if (currentRemaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, order]);

  // Format mm:ss
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  const isExpired = timeLeftSeconds <= 0;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    notify.success(`Đã sao chép ${fieldName} vào bộ nhớ tạm!`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Điều hướng người dùng sang trang PayPal Sandbox
  const handleProceedToPayPal = () => {
    if (!paypalDetails?.approveUrl) {
      setErrorMessage("Chưa nhận được đường dẫn thanh toán từ PayPal. Vui lòng thử lại.");
      return;
    }
    window.location.href = paypalDetails.approveUrl;
  };

  // Điều hướng người dùng sang trang Stripe Checkout
  const handleProceedToStripe = () => {
    if (!stripeDetails?.checkoutUrl) {
      setErrorMessage("Chưa nhận được đường dẫn thanh toán từ Stripe. Vui lòng thử lại.");
      return;
    }
    window.location.href = stripeDetails.checkoutUrl;
  };

  // Điều hướng người dùng sang Cổng thanh toán ZaloPay Sandbox
  const handleProceedToZaloPay = () => {
    if (!order || !zaloPayDetails?.orderUrl) {
      setErrorMessage("Chưa nhận được đường dẫn thanh toán từ ZaloPay. Vui lòng thử lại.");
      return;
    }
    window.localStorage.setItem(
      "pending_zalopay_payment",
      JSON.stringify({ orderId: order.orderId, appTransId: zaloPayDetails.appTransId })
    );
    window.location.href = zaloPayDetails.orderUrl;
  };

  // Điều hướng người dùng sang Cổng thanh toán VNPay Sandbox
  const handleProceedToVNPay = () => {
    if (!vnpayDetails?.payUrl) {
      setErrorMessage("Chưa nhận được đường dẫn thanh toán từ VNPay. Vui lòng thử lại.");
      return;
    }
    window.location.href = vnpayDetails.payUrl;
  };

  // Xử lý xác nhận thanh toán (Dành cho phương thức QR / Chuyển khoản thông thường hoặc Giả lập Dev Test)
  const handleSimulatePayment = async () => {
    if (!order || isExpired || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await customerOrderApi.payOrder(order.orderId, order.paymentMethod);

      if (res && res.success) {
        window.localStorage.removeItem("pending_zalopay_payment");
        setIsSuccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess(res.order?.vouchers || []);
        }
        setTimeout(() => {
          onClose();
          router.push("/my-vouchers");
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi xử lý thanh toán. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  };

  const handlePayLater = () => {
    window.localStorage.removeItem("pending_zalopay_payment");
    onClose();
    router.push("/orders");
  };

  if (!isOpen || !order) return null;

  const paymentMethodName = isPayPal
    ? "Ví điện tử PayPal"
    : isStripe
    ? "Thẻ Visa / Mastercard (Stripe)"
    : isZaloPay
    ? "Ví điện tử ZaloPay"
    : "Cổng thanh toán VNPay";

  const transferContent = `ORD${order.orderId}`;
  const bankAccountNo = "888866669999";
  const bankName = "Ngân hàng TMCP Quân Đội (MBBank)";
  const accountHolder = "CONG TY CP E-VOUCHER SYSTEM";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          handlePayLater();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden bg-surface rounded-2xl shadow-2xl border border-outline-variant/40 transform transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isPayPal
                  ? "bg-[#003087]/10 text-[#003087] dark:text-[#0070BA] font-black"
                  : isStripe
                  ? "bg-[#635BFF]/10 text-[#635BFF]"
                  : isZaloPay
                  ? "bg-[#0068FF]/10 text-[#0068FF]"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isPayPal ? (
                <DollarSign className="w-5 h-5 font-bold" />
              ) : isStripe ? (
                <CreditCard className="w-5 h-5" />
              ) : isZaloPay ? (
                <span className="font-extrabold text-sm tracking-tight">Zalo</span>
              ) : (
                <QrCode className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
                Thanh Toán Đơn Hàng #{order.orderId}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isPayPal
                  ? "Cổng thanh toán quốc tế PayPal (Sandbox)"
                  : isStripe
                  ? "Cổng thanh toán thẻ Stripe Checkout (Sandbox)"
                  : isZaloPay
                  ? "Cổng thanh toán ví điện tử ZaloPay (Sandbox)"
                  : "Mô phỏng quét mã QR thanh toán"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePayLater}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Đóng / Thanh toán sau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Success Overlay View */}
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-on-surface">Thanh Toán Thành Công!</h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                Đơn hàng #{order.orderId} đã được hoàn tất. Các mã E-Voucher đã được phát hành vào kho của bạn.
              </p>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang chuyển hướng đến Kho Voucher...
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error flex items-start gap-3 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Thông báo lỗi:</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* 5-Minute Timer Countdown Box */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isExpired
                    ? "bg-error-container/20 border-error/40 text-error"
                    : timeLeftSeconds < 60
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-primary/5 border-primary/20 text-primary"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {isExpired ? "Thời gian thanh toán đã kết thúc" : "Thời hạn thanh toán còn lại"}
                    </p>
                    <p className="text-xs opacity-80">
                      {isExpired
                        ? "Đơn hàng đã hết hạn. Vui lòng đặt đơn hàng mới."
                        : "Vui lòng hoàn tất trong vòng 5 phút."}
                    </p>
                  </div>
                </div>

                <div
                  className={`text-xl font-mono font-extrabold px-3 py-1 rounded-lg border ${
                    isExpired
                      ? "bg-error text-on-error border-error"
                      : "bg-surface text-on-surface border-outline-variant shadow-sm"
                  }`}
                >
                  {formattedTime}
                </div>
              </div>

              {/* Giao diện PayPal Sandbox Flow */}
              {isPayPal ? (
                <div className="space-y-4">
                  {paypalLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0070BA]" />
                      <span className="text-sm font-medium">Đang kết nối cổng PayPal & lấy tỷ giá thời gian thực...</span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 via-sky-50/30 to-surface border border-outline-variant/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="text-[#003087] dark:text-[#0070BA] font-black text-2xl tracking-tight">
                            <i>Pay</i><span className="text-[#0070BA]"><i>Pal</i></span>
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-[#003087] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                            Sandbox Checkout
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                          <Globe className="w-3.5 h-3.5 text-secondary" />
                          <span>USD Currency</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-surface rounded-xl border border-outline-variant/40 shadow-sm">
                          <span className="text-xs text-on-surface-variant font-medium block">Số tiền gốc (VND)</span>
                          <span className="text-lg font-bold text-on-surface">
                            {order.totalAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>

                        <div className="p-3.5 bg-[#FFC439]/15 rounded-xl border border-[#FFC439]/40 shadow-sm">
                          <span className="text-xs text-[#003087] dark:text-amber-300 font-medium block">Số tiền thanh toán (USD)</span>
                          <span className="text-2xl font-black text-[#003087] dark:text-[#FFC439]">
                            ${paypalDetails ? paypalDetails.amountUsd.toFixed(2) : "0.00"} USD
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-on-surface-variant pt-1">
                        <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                          <span>Tỷ giá quy đổi:</span>
                          <span className="font-semibold text-on-surface">
                            1 USD = {paypalDetails ? paypalDetails.exchangeRate.toLocaleString("vi-VN") : "25,400"} đ
                          </span>
                        </div>

                        {paypalDetails?.paypalOrderId && (
                          <div className="flex justify-between items-center py-1">
                            <span>Mã PayPal Order:</span>
                            <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                              <span className="text-xs">{paypalDetails.paypalOrderId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(paypalDetails.paypalOrderId, "token")}
                                className="p-1 hover:bg-primary/10 rounded cursor-pointer"
                                title="Sao chép mã đơn"
                              >
                                {copiedField === "token" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-on-surface-variant space-y-1">
                        <p className="font-bold text-[#003087] dark:text-blue-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> Luồng thanh toán PayPal Sandbox:
                        </p>
                        <p>
                          Bấm nút <strong>"Tiến hành Thanh toán qua PayPal"</strong> bên dưới để chuyển hướng đến trang web PayPal, đăng nhập bằng tài khoản Sandbox Personal (Buyer) để hoàn tất.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : isStripe ? (
                /* Giao diện Stripe Checkout Sandbox Flow */
                <div className="space-y-4">
                  {stripeLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#635BFF]" />
                      <span className="text-sm font-medium">Đang tạo phiên Stripe Checkout bảo mật...</span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-surface border border-outline-variant/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="text-[#635BFF] font-black text-2xl tracking-tight">
                            stripe
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-[#635BFF] dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                            Sandbox Checkout
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                          <span>Visa / Mastercard / JCB</span>
                        </div>
                      </div>

                      <div className="p-4 bg-surface rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs text-on-surface-variant font-medium block">Tổng tiền thanh toán</span>
                          <span className="text-2xl font-black text-[#635BFF]">
                            {order.totalAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold border border-emerald-200">
                          VND Tiền tệ
                        </span>
                      </div>

                      {stripeDetails?.sessionId && (
                        <div className="flex justify-between items-center py-1 text-xs text-on-surface-variant">
                          <span>Stripe Session ID:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                            <span className="text-[11px] truncate max-w-[200px]">{stripeDetails.sessionId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(stripeDetails.sessionId, "session")}
                              className="p-1 hover:bg-primary/10 rounded cursor-pointer"
                              title="Sao chép Session ID"
                            >
                              {copiedField === "session" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs text-on-surface-variant space-y-1.5">
                        <p className="font-bold text-[#635BFF] dark:text-purple-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> Thẻ Test Stripe Sandbox:
                        </p>
                        <div className="p-2 rounded bg-surface border border-outline-variant/40 space-y-1 font-mono text-[11px]">
                          <p>• Số thẻ: <strong className="text-primary font-bold">4242 4242 4242 4242</strong></p>
                          <p>• Hạn dùng: <span className="font-semibold">Tháng/Năm bất kỳ ở tương lai (VD: 12/28)</span></p>
                          <p>• CVC: <span className="font-semibold">123</span> &nbsp;|&nbsp; ZIP: <span className="font-semibold">70000</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : isZaloPay ? (
                /* Giao diện thẻ ZaloPay Sandbox */
                <div className="space-y-4">
                  {zaloPayLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0068FF]" />
                      <span className="text-sm font-medium">
                        Đang kết nối cổng ZaloPay Sandbox...
                      </span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-surface border border-outline-variant/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="text-[#0068FF] font-black text-2xl tracking-tight">
                            ZaloPay
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-[#0068FF] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                            Cổng thanh toán thẻ sandbox
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold border border-emerald-200">
                          VND
                        </span>
                      </div>

                      {/* Header Price Info */}
                      <div className="p-3 bg-surface rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs text-on-surface-variant font-medium block">Số tiền cần thanh toán</span>
                          <span className="text-2xl font-black text-[#0068FF]">
                            {order.totalAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        {zaloPayDetails?.appTransId && (
                          <div className="text-right">
                            <span className="text-[11px] text-on-surface-variant block">Mã GD ZaloPay</span>
                            <span className="font-mono text-xs font-bold text-primary truncate max-w-[150px] block">
                              {zaloPayDetails.appTransId}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                          <div className="p-3.5 bg-surface rounded-xl border border-blue-200/80 shadow-sm space-y-2 text-xs">
                            <p className="font-bold text-[#0068FF] flex items-center justify-between border-b pb-2 border-outline-variant/20">
                              <span>💳 Thông tin Thẻ ATM Test (Dùng trên Cổng ZaloPay):</span>
                              <span className="text-[11px] text-on-surface-variant font-normal">Napas 247</span>
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                              <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-on-surface-variant block font-sans">Số thẻ test:</span>
                                  <strong className="text-primary text-xs">9704540000000062</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy("9704540000000062", "zp_card_no")}
                                  className="p-1 hover:bg-[#0068FF]/10 rounded cursor-pointer"
                                  title="Sao chép số thẻ"
                                >
                                  {copiedField === "zp_card_no" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0068FF]" />}
                                </button>
                              </div>

                              <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-on-surface-variant block font-sans">Tên chủ thẻ:</span>
                                  <strong className="text-on-surface text-xs">NGUYEN VAN A</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy("NGUYEN VAN A", "zp_card_name")}
                                  className="p-1 hover:bg-[#0068FF]/10 rounded cursor-pointer"
                                  title="Sao chép tên chủ thẻ"
                                >
                                  {copiedField === "zp_card_name" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0068FF]" />}
                                </button>
                              </div>

                              <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-on-surface-variant block font-sans">Ngày phát hành:</span>
                                  <strong className="text-on-surface text-xs">10/18</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy("10/18", "zp_card_date")}
                                  className="p-1 hover:bg-[#0068FF]/10 rounded cursor-pointer"
                                  title="Sao chép ngày"
                                >
                                  {copiedField === "zp_card_date" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0068FF]" />}
                                </button>
                              </div>

                              <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] text-on-surface-variant block font-sans">Mã OTP:</span>
                                  <strong className="text-emerald-600 text-xs">111111</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy("111111", "zp_card_otp")}
                                  className="p-1 hover:bg-[#0068FF]/10 rounded cursor-pointer"
                                  title="Sao chép OTP"
                                >
                                  {copiedField === "zp_card_otp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0068FF]" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-on-surface-variant space-y-1">
                            <p className="font-bold text-[#0068FF] dark:text-blue-300 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" /> Cách thực hiện:
                            </p>
                            <p className="text-[11px]">
                              Bấm nút <strong>"Mở Cổng Thanh Toán ZaloPay"</strong> bên dưới. Bạn có thể chọn Thẻ ATM nội địa (NCB, Vietcombank...) và điền thông tin test ở trên.
                            </p>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              ) : isVNPay ? (
                /* Giao diện VNPay Sandbox Flow */
                <div className="space-y-4">
                  {vnpayLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-sm font-medium">Đang kết nối cổng thanh toán VNPay...</span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 via-sky-50/30 to-surface border border-outline-variant/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-black text-2xl tracking-tight">
                            VNPAY
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                            Sandbox Checkout
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold border border-emerald-200">
                          VND
                        </span>
                      </div>

                      <div className="p-4 bg-surface rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs text-on-surface-variant font-medium block">Tổng tiền thanh toán</span>
                          <span className="text-2xl font-black text-blue-700">
                            {order.totalAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-on-surface-variant space-y-1.5">
                        <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> Thẻ Test VNPay Sandbox (Ngân hàng NCB):
                        </p>
                        <div className="p-2 rounded bg-surface border border-outline-variant/40 space-y-1 font-mono text-[11px]">
                          <p>• Số thẻ: <strong className="text-primary font-bold">9704198526191432198</strong></p>
                          <p>• Tên chủ thẻ: <span className="font-semibold">NGUYEN VAN A</span></p>
                          <p>• Ngày phát hành: <span className="font-semibold">10/18</span></p>
                          <p>• Mật khẩu OTP: <span className="font-semibold">123456</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* QR Code & Transfer Details Grid cho phương thức truyền thống */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-outline-variant shadow-md">
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs font-bold text-gray-700">
                      <span className="text-blue-600 flex items-center gap-1 font-extrabold">
                        <Building2 className="w-3.5 h-3.5" /> VietQR Pro
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                        Napas 247
                      </span>
                    </div>

                    <div className="relative w-44 h-44 bg-gray-50 rounded-xl overflow-hidden p-2 flex items-center justify-center border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=247PAYMENT-ORD${order.orderId}-AMOUNT${order.totalAmount}`}
                        alt="Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-2.5 text-center font-medium">
                      Quét mã bằng ứng dụng Ngân hàng hoặc Ví {paymentMethodName}
                    </p>
                  </div>

                  <div className="md:col-span-7 space-y-3 font-body-md text-sm">
                    <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/60">
                      <span className="text-xs text-on-surface-variant font-medium">Số tiền thanh toán:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-2xl font-black text-primary">
                          {order.totalAmount.toLocaleString("vi-VN")} đ
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(order.totalAmount), "amount")}
                          className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          {copiedField === "amount" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === "amount" ? "Đã chép" : "Sao chép"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-outline-variant/30">
                        <span className="text-on-surface-variant">Ngân hàng:</span>
                        <span className="font-semibold text-on-surface text-right">{bankName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-outline-variant/30">
                        <span className="text-on-surface-variant">Chủ tài khoản:</span>
                        <span className="font-semibold text-on-surface text-right">{accountHolder}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-outline-variant/30">
                        <span className="text-on-surface-variant">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-on-surface">{bankAccountNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankAccountNo, "acc")}
                            className="text-primary hover:text-primary-hover cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === "acc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-on-surface-variant">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(transferContent, "msg")}
                            className="text-primary hover:text-primary-hover cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedField === "msg" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Summary Accordion / Preview */}
              {order.items && order.items.length > 0 && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs">
                  <p className="font-bold text-on-surface mb-2">Voucher trong đơn hàng ({order.items.length}):</p>
                  <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-on-surface-variant">
                        <span className="truncate pr-2">• {item.program_name}</span>
                        <span className="font-semibold shrink-0">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer actions */}
        {!isSuccess && (
          <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePayLater}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Thanh toán sau
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
              {isPayPal ? (
                /* Nút thanh toán cho PayPal Sandbox */
                <button
                  type="button"
                  onClick={handleProceedToPayPal}
                  disabled={isExpired || paypalLoading || !paypalDetails?.approveUrl}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isExpired || !paypalDetails?.approveUrl
                      ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                      : "bg-[#FFC439] hover:bg-[#f4b628] text-[#003087] hover:shadow-lg active:scale-98"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Tiến hành Thanh toán qua PayPal</span>
                </button>
              ) : isStripe ? (
                /* Nút thanh toán cho Stripe Checkout Sandbox */
                <button
                  type="button"
                  onClick={handleProceedToStripe}
                  disabled={isExpired || stripeLoading || !stripeDetails?.checkoutUrl}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isExpired || !stripeDetails?.checkoutUrl
                      ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                      : "bg-[#635BFF] hover:bg-[#5851DF] text-white hover:shadow-lg active:scale-98"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tiến hành Thanh toán qua Stripe</span>
                </button>
              ) : isZaloPay ? (
                /* Nút thanh toán cho ZaloPay Sandbox */
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isExpired || isProcessing}
                    className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-[#0068FF]/30 text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="Giả lập thanh toán thành công tức thì không cần mở cổng ZaloPay"
                  >
                    {isProcessing ? "Đang xử lý..." : "⚡ Giả lập thanh toán (Dev Test)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToZaloPay}
                    disabled={isExpired || zaloPayLoading || !zaloPayDetails?.orderUrl}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isExpired || !zaloPayDetails?.orderUrl
                        ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                        : "bg-[#0068FF] hover:bg-[#0050CC] text-white hover:shadow-lg active:scale-98"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở Cổng Thanh Toán ZaloPay</span>
                  </button>
                </div>
              ) : isVNPay ? (
                /* Nút thanh toán cho VNPay Sandbox */
                <button
                  type="button"
                  onClick={handleProceedToVNPay}
                  disabled={isExpired || vnpayLoading || !vnpayDetails?.payUrl}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isExpired || !vnpayDetails?.payUrl
                      ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-98"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Tiến hành Thanh toán qua VNPay</span>
                </button>
              ) : (
                /* Nút xác nhận cho các phương thức quét mã QR khác */
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isExpired || isProcessing}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isExpired
                      ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                      : "bg-primary text-on-primary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : isExpired ? (
                    <>
                      <AlertTriangle className="w-4 h-4" /> Hết hạn 5 phút
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Xác nhận đã thanh toán
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
