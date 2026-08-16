"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { customerOrderApi, CustomerVoucherItem, getStoredCustomerUser } from "@/lib/customer-api";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Store,
  MapPin,
  Copy,
  Check,
  Star,
  HelpCircle,
  CheckSquare,
  FileText
} from "lucide-react";

import ReviewModal from "@/components/customer/ReviewModal";

export default function MyVoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { myVouchers, vouchers, markAsUsed, addReview, refreshMyVouchers } = useApp();

  const [copied, setCopied] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [apiVoucher, setApiVoucher] = useState<CustomerVoucherItem | null>(null);

  useEffect(() => {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) return;

    let isMounted = true;

    const fetchVoucher = async () => {
      try {
        const data = await customerOrderApi.getMyVoucherById(numericId);
        if (!isMounted || !data) return;

        setApiVoucher((prev) => {
          if (prev && prev.usage_status !== data.usage_status) {
            if (refreshMyVouchers) refreshMyVouchers();
          }
          return data;
        });
      } catch (err) {
        console.warn("Không lấy được voucher từ API backend:", err);
      }
    };

    // Initial fetch
    fetchVoucher();

    // Auto-polling every 2.5 seconds while unused
    const interval = setInterval(() => {
      if (apiVoucher && apiVoucher.usage_status !== "UNUSED") {
        clearInterval(interval);
        return;
      }
      fetchVoucher();
    }, 2500);

    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        fetchVoucher();
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, [id, apiVoucher?.usage_status, refreshMyVouchers]);

  // Find the purchased voucher from context as fallback
  const fallbackMyVoucher = myVouchers.find((mv) => mv.id === id);
  const fallbackVoucher = fallbackMyVoucher ? vouchers.find((v) => v.id === fallbackMyVoucher.voucherId) : undefined;

  // Normalized display object
  const displayVoucher = apiVoucher
    ? {
        id: String(apiVoucher.issued_voucher_id),
        code: apiVoucher.voucher_code,
        status:
          apiVoucher.usage_status === "USED"
            ? "used"
            : apiVoucher.usage_status === "CANCELLED"
            ? "cancelled"
            : apiVoucher.usage_status === "EXPIRED"
            ? "expired"
            : "unused",
        title: apiVoucher.program_name,
        brand: apiVoucher.business_name || "Thương hiệu đối tác",
        brandLogo: apiVoucher.partner_logo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        category: apiVoucher.category_name || "Ưu đãi",
        datePurchased: apiVoucher.purchase_date ? new Date(apiVoucher.purchase_date).toLocaleDateString("vi-VN") : "Hôm nay",
        expiryDate: apiVoucher.expires_at ? new Date(apiVoucher.expires_at).toLocaleDateString("vi-VN") : "31/12/2026",
        orderNumber: apiVoucher.order_id ? `ORD-${apiVoucher.order_id}` : "ORD-SYSTEM",
        paymentMethod: apiVoucher.payment_method || "Ví VNPay",
        paymentStatus: apiVoucher.payment_status || "PAID",
        price: apiVoucher.sale_price || 0,
        originalPrice: apiVoucher.original_price || 0,
        description: apiVoucher.description || apiVoucher.program_name,
        termsConditions: apiVoucher.terms_conditions,
        branches: apiVoucher.applicable_branches && apiVoucher.applicable_branches.length > 0 ? apiVoucher.applicable_branches : ["Áp dụng toàn hệ thống chi nhánh đối tác."],
        addresses: apiVoucher.applicable_addresses && apiVoucher.applicable_addresses.length > 0 ? apiVoucher.applicable_addresses : ["Xem chi tiết tại điểm bán."]
      }
    : fallbackMyVoucher && fallbackVoucher
    ? {
        id: fallbackMyVoucher.id,
        code: fallbackMyVoucher.code,
        status: fallbackMyVoucher.status,
        title: fallbackVoucher.title,
        brand: fallbackVoucher.brand,
        brandLogo: fallbackVoucher.brandLogo,
        category: fallbackVoucher.category,
        datePurchased: fallbackMyVoucher.datePurchased,
        expiryDate: fallbackMyVoucher.expiryDate,
        orderNumber: fallbackMyVoucher.orderNumber,
        paymentMethod: fallbackMyVoucher.paymentMethod,
        paymentStatus: "PAID",
        price: fallbackVoucher.price,
        originalPrice: fallbackVoucher.originalPrice || fallbackVoucher.price,
        description: fallbackVoucher.description || fallbackVoucher.title,
        termsConditions: fallbackVoucher.conditions?.join("\n"),
        branches: [fallbackVoucher.location || "Áp dụng toàn quốc."],
        addresses: [fallbackVoucher.location || "Xem tại chi nhánh."]
      }
    : null;

  if (!displayVoucher) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-outline mb-4" />
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
          Không tìm thấy voucher đã mua
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          Voucher này không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link
          href="/my-vouchers"
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold"
        >
          Quay lại danh sách
        </Link>
      </main>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayVoucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsUsed = () => {
    if (displayVoucher.status === "unused") {
      markAsUsed(displayVoucher.id);
    }
  };

  return (
    <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-8 md:py-12 flex flex-col gap-8">
      {/* Back Navigation */}
      <div>
        <Link
          href="/my-vouchers"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md group cursor-pointer inline-flex font-bold"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách voucher</span>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Details (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden">
            {/* Brand Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

            {/* Brand Logo */}
            <div className="w-full md:w-32 h-32 md:h-auto rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-lowest border border-outline-variant flex items-center justify-center p-4 shadow-sm">
              <Image
                width={128}
                height={128}
                className="w-full h-full object-contain"
                src={displayVoucher.brandLogo}
                alt={displayVoucher.brand}
              />
            </div>

            {/* Details Content */}
            <div className="flex flex-col flex-grow justify-center z-10">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  {displayVoucher.category}
                </span>

                {displayVoucher.status === "unused" && (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Chưa sử dụng
                  </span>
                )}
                {displayVoucher.status === "used" && (
                  <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã sử dụng
                  </span>
                )}
                {displayVoucher.status === "expired" && (
                  <span className="bg-surface-dim text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <XCircle className="w-4 h-4" />
                    Đã hết hạn
                  </span>
                )}
                {displayVoucher.status === "cancelled" && (
                  <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <XCircle className="w-4 h-4" />
                    Đã hủy
                  </span>
                )}
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
                {displayVoucher.title}
              </h1>
              <p className="font-title-md text-title-md text-on-surface-variant font-semibold mb-4">
                Thương hiệu: {displayVoucher.brand}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-auto border-t border-outline-variant/30 pt-4">
                <div>
                  <p className="font-label-sm text-label-sm text-text-muted mb-1 uppercase tracking-wider font-bold">
                    Ngày mua
                  </p>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {displayVoucher.datePurchased}
                  </p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-text-muted mb-1 uppercase tracking-wider font-bold">
                    Hạn sử dụng
                  </p>
                  <p className="font-body-md text-body-md font-bold text-error flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {displayVoucher.expiryDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Sub-grid details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conditions */}
            <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
              <h3 className="font-title-md text-title-md font-bold flex items-center gap-2 mb-4 border-b border-outline-variant pb-2 text-on-surface">
                <CheckSquare className="w-5 h-5 text-primary" />
                Điều kiện sử dụng
              </h3>
              <ul className="font-body-md text-body-md space-y-3 text-on-surface-variant">
                {(displayVoucher.termsConditions ? displayVoucher.termsConditions.split("\n") : [
                  "Áp dụng cho mọi chi nhánh.",
                  "Không có giá trị quy đổi thành tiền mặt."
                ]).map((cond, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guide */}
            <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
              <h3 className="font-title-md text-title-md font-bold flex items-center gap-2 mb-4 border-b border-outline-variant pb-2 text-on-surface">
                <BookOpen className="w-5 h-5 text-primary" />
                Hướng dẫn sử dụng
              </h3>
              <ol className="font-body-md text-body-md space-y-4 text-on-surface-variant relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-outline-variant">
                {[
                  "Đến cửa hàng thuộc danh sách chi nhánh áp dụng.",
                  "Xuất trình mã QR Code hoặc mã Voucher Code cho nhân viên thu ngân.",
                  "Nhân viên quét mã và áp dụng ưu đãi cho hóa đơn của bạn."
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 ring-4 ring-surface">
                      {idx + 1}
                    </div>
                    <div>{step}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Digital Receipt Card (Biên lai đơn hàng - BR-CUS-07) */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6 relative overflow-hidden">
            {/* Payment Stamp */}
            <div className="absolute top-4 right-4 rotate-12 border-2 border-primary/30 text-primary px-4 py-1 rounded font-bold uppercase tracking-widest text-xs select-none">
              {displayVoucher.paymentStatus === "PAID" ? "Đã Thanh Toán" : "Thanh Toán Thất Bại"}
            </div>

            <h3 className="font-title-md text-title-md font-bold flex items-center gap-2 mb-4 text-on-surface">
              <FileText className="w-5 h-5 text-primary" />
              Biên lai thanh toán &amp; Chi nhánh áp dụng
            </h3>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h4 className="font-label-md text-label-md font-bold mb-2 text-on-surface">
                  Chi nhánh áp dụng:
                </h4>
                <ul className="font-body-md text-body-md space-y-2 text-on-surface-variant">
                  {displayVoucher.branches.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-px bg-outline-variant hidden md:block" />
              <div className="flex-1">
                <h4 className="font-label-md text-label-md font-bold mb-2 text-on-surface">
                  Thông tin hóa đơn biên lai:
                </h4>
                <div className="space-y-1 font-body-md text-body-md text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Mã đơn hàng:</span>
                    <span className="font-medium text-on-surface">{displayVoucher.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày thanh toán:</span>
                    <span className="font-medium text-on-surface">
                      {displayVoucher.datePurchased}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương thức thanh toán:</span>
                    <span className="font-medium text-on-surface">{displayVoucher.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant/40 pt-2 mt-2 font-bold">
                    <span>Giá mua voucher:</span>
                    <span className="text-primary">{displayVoucher.price.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Code Copy (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* QR Card */}
          <div className="bg-surface rounded-xl shadow-md border border-outline-variant p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative z-10 w-full flex flex-col items-center">
              <h2 className="font-title-md text-title-md font-bold text-on-surface mb-6">
                Đưa mã này cho nhân viên
              </h2>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-outline-variant mb-6 inline-block relative">
                <QRCodeSVG
                  value={displayVoucher.code}
                  size={192}
                  level="H"
                  className={`${
                    displayVoucher.status === "used" || displayVoucher.status === "expired" || displayVoucher.status === "cancelled"
                      ? "opacity-20 blur-[1px]"
                      : ""
                  }`}
                />
                {(displayVoucher.status === "used" || displayVoucher.status === "expired" || displayVoucher.status === "cancelled") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-inverse-surface/90 text-surface-bright px-4 py-2 rounded-lg font-bold text-sm shadow-md uppercase tracking-wider">
                      {displayVoucher.status === "used"
                        ? "Đã sử dụng"
                        : displayVoucher.status === "cancelled"
                        ? "Đã hủy"
                        : "Đã hết hạn"}
                    </span>
                  </div>
                )}
              </div>

              {/* Code Box */}
              <div className="w-full mb-6">
                <p className="font-label-sm text-label-sm text-text-muted mb-2 uppercase tracking-wider font-bold">
                  Mã Voucher
                </p>
                <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-lg p-3">
                  <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-widest font-mono select-all">
                    {displayVoucher.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container cursor-pointer flex items-center justify-center"
                    title="Copy mã"
                  >
                    {copied ? <Check className="w-5 h-5 text-secondary" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {copied && <p className="text-xs text-secondary mt-1">Đã copy mã voucher!</p>}
              </div>

              <div className="w-full h-px bg-outline-variant border-dashed mb-6" />

              {/* Action buttons */}
              <div className="w-full flex flex-col gap-3">
                {displayVoucher.status === "unused" ? (
                  <button
                    onClick={handleMarkAsUsed}
                    className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg font-bold shadow-sm hover:opacity-95 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Đánh dấu đã sử dụng
                  </button>
                ) : (
                  <div className="w-full bg-surface-variant/40 text-on-surface-variant py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 select-none border border-outline-variant">
                    <CheckCircle2 className="w-5 h-5" />
                    Voucher đã hoàn tất
                  </div>
                )}

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full bg-surface-container-low text-primary border border-primary font-label-md text-label-md py-3 px-4 rounded-lg font-bold shadow-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Star className="w-5 h-5" />
                  Đánh giá ngay
                </button>
              </div>
            </div>
          </div>

          {/* Support Banner */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-start gap-3 shadow-sm">
            <HelpCircle className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
            <div>
              <p className="font-label-md text-label-md font-bold">Cần hỗ trợ?</p>
              <p className="font-body-md text-body-md text-sm text-on-surface-variant mt-1">
                Liên hệ trung tâm CSKH nếu bạn gặp vấn đề khi sử dụng voucher.
              </p>
              <a
                href="tel:19006868"
                className="font-label-sm text-label-sm text-primary font-bold mt-2 inline-block hover:underline"
              >
                Gọi 1900 6868
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Review & Feedback Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        voucherTitle={displayVoucher.title}
        voucherCode={displayVoucher.code}
        onSubmit={(rating, reviewContent, complaintContent) => {
          const user = getStoredCustomerUser();
          addReview(
            displayVoucher.id,
            user?.full_name || "Khách hàng",
            rating,
            reviewContent,
            complaintContent
          );
        }}
      />
    </main>
  );
}
