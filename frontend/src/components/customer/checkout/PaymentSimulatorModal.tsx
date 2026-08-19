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
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { customerOrderApi } from "@/lib/customer-api";

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

  // Tính toán thời gian đếm ngược thực tế (300s - elapsedSeconds)
  useEffect(() => {
    if (!isOpen || !order) return;

    setIsSuccess(false);
    setIsProcessing(false);

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
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleSimulatePayment = async () => {
    if (!order || isExpired || isProcessing) return;

    try {
      setIsProcessing(true);
      const res = await customerOrderApi.payOrder(order.orderId, order.paymentMethod);

      if (res && res.success) {
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
      alert(err.message || "Lỗi khi xử lý thanh toán. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  };

  const handlePayLater = () => {
    onClose();
    router.push("/orders");
  };

  if (!isOpen || !order) return null;

  const paymentMethodName =
    order.paymentMethod === "MOMO"
      ? "Ví điện tử MoMo"
      : order.paymentMethod === "CARD"
      ? "Thẻ Quốc tế / ATM"
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
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">
                Thanh Toán Đơn Hàng #{order.orderId}
              </h2>
              <p className="text-xs text-on-surface-variant">Mô phỏng quét mã QR thanh toán</p>
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
                Đơn hàng #{order.orderId} đã được thanh toán hoàn tất. Các mã E-Voucher đã được phát hành vào kho của bạn.
              </p>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang chuyển hướng đến Kho Voucher...
              </div>
            </div>
          ) : (
            <>
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

              {/* QR Code & Transfer Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Container (Span 5) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-outline-variant shadow-md">
                  {/* Bank Banner Badge */}
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs font-bold text-gray-700">
                    <span className="text-blue-600 flex items-center gap-1 font-extrabold">
                      <Building2 className="w-3.5 h-3.5" /> VietQR Pro
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                      Napas 247
                    </span>
                  </div>

                  {/* QR Image Graphic with Logo */}
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

                {/* Transfer Info Details (Span 7) */}
                <div className="md:col-span-7 space-y-3 font-body-md text-sm">
                  {/* Số tiền */}
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

                  {/* Ngân hàng thụ hưởng */}
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

              {/* Notice note */}
              <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-surface-container-high/40 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>
                  Hệ thống kiểm tra thanh toán tự động. Sau khi chuyển khoản xong, bấm nút <strong>Xác nhận đã thanh toán</strong> để nhận ngay mã E-Voucher. Bạn cũng có thể quay lại thanh toán trong vòng 5 phút tại trang <strong>Đơn hàng của tôi</strong>.
                </span>
              </div>
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Thanh toán sau (Quay lại Đơn hàng)
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isExpired || isProcessing}
              className={`w-full sm:w-auto px-7 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isExpired
                  ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
                  : "bg-primary text-on-primary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý thanh toán...
                </>
              ) : isExpired ? (
                <>
                  <AlertTriangle className="w-4 h-4" /> Đơn hàng đã quá hạn 5 phút
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận đã thanh toán
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
