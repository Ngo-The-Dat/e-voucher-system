"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

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
  CheckSquare
} from "lucide-react";

import ReviewModal from "@/components/customer/ReviewModal";

export default function MyVoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { myVouchers, vouchers, markAsUsed, addReview } = useApp();

  const [copied, setCopied] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);


  // Find the purchased voucher
  const myVoucher = myVouchers.find((mv) => mv.id === id);

  if (!myVoucher) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-outline mb-4" />
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
          Không tìm thấy đơn hàng voucher
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          Voucher đã mua này không tồn tại hoặc tài khoản không có quyền truy cập.
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

  // Find the associated original voucher details
  const voucher = vouchers.find((v) => v.id === myVoucher.voucherId);

  if (!voucher) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-outline mb-4" />
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
          Dữ liệu gốc bị lỗi
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          Voucher gốc liên kết với mã này không còn tồn tại.
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
    navigator.clipboard.writeText(myVoucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsUsed = () => {
    if (myVoucher.status === "unused" || myVoucher.status === "expiring") {
      markAsUsed(myVoucher.id);
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

      {/* Warning Banner for expiring items */}
      {(myVoucher.status === "expiring" || myVoucher.status === "unused") && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg flex items-start md:items-center gap-4 shadow-sm border border-error/20">
          <Clock className="w-5 h-5 text-error shrink-0" />
          <div className="flex-grow">
            <p className="font-label-md text-label-md font-bold text-error">Voucher sắp hết hạn!</p>
            <p className="font-body-md text-body-md text-sm mt-1">
              Vui lòng sử dụng voucher này trước ngày {myVoucher.expiryDate} để tránh mất quyền lợi.
            </p>
          </div>
        </div>
      )}

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
                src={voucher.brandLogo}
                alt={voucher.brand}
              />
            </div>

            {/* Details Content */}
            <div className="flex flex-col flex-grow justify-center z-10">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  {voucher.category}
                </span>

                {myVoucher.status === "unused" && (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Chưa sử dụng
                  </span>
                )}
                {myVoucher.status === "used" && (
                  <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã sử dụng
                  </span>
                )}
                {myVoucher.status === "expiring" && (
                  <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <Clock className="w-4 h-4" />
                    Sắp hết hạn
                  </span>
                )}
                {myVoucher.status === "expired" && (
                  <span className="bg-surface-dim text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
                    <XCircle className="w-4 h-4" />
                    Đã hết hạn
                  </span>
                )}
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">
                {voucher.title}
              </h1>
              <p className="font-title-md text-title-md text-on-surface-variant font-semibold mb-4">
                Thương hiệu: {voucher.brand}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-auto border-t border-outline-variant/30 pt-4">
                <div>
                  <p className="font-label-sm text-label-sm text-text-muted mb-1 uppercase tracking-wider font-bold">
                    Ngày mua
                  </p>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {myVoucher.datePurchased}
                  </p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-text-muted mb-1 uppercase tracking-wider font-bold">
                    Hạn sử dụng
                  </p>
                  <p className="font-body-md text-body-md font-bold text-error flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {myVoucher.expiryDate}
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
                {(voucher.conditions || [
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
                {(voucher.guideSteps || [
                  "Đến cửa hàng.",
                  "Đưa mã QR cho nhân viên thu ngân.",
                  "Áp dụng ưu đãi."
                ]).map((step, idx) => {
                  const parts = step.split(":");
                  const stepText = parts.length > 1 ? parts[1] : parts[0];

                  return (
                    <li key={idx} className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 ring-4 ring-surface">
                        {idx + 1}
                      </div>
                      <div>{stepText.trim()}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Location & Order details */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
            <h3 className="font-title-md text-title-md font-bold flex items-center gap-2 mb-4 text-on-surface">
              <Store className="w-5 h-5 text-primary" />
              Địa điểm áp dụng &amp; Thông tin đơn hàng
            </h3>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h4 className="font-label-md text-label-md font-bold mb-2 text-on-surface">
                  Chi nhánh áp dụng:
                </h4>
                <ul className="font-body-md text-body-md space-y-2 text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 shrink-0" />
                    <span>{voucher.location || "Áp dụng toàn quốc."}</span>
                  </li>
                </ul>
              </div>
              <div className="w-px bg-outline-variant hidden md:block" />
              <div className="flex-1">
                <h4 className="font-label-md text-label-md font-bold mb-2 text-on-surface">
                  Thông tin thanh toán:
                </h4>
                <div className="space-y-1 font-body-md text-body-md text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Mã đơn hàng:</span>
                    <span className="font-medium text-on-surface">{myVoucher.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày thanh toán:</span>
                    <span className="font-medium text-on-surface">
                      {myVoucher.datePurchased}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương thức:</span>
                    <span className="font-medium text-on-surface">{myVoucher.paymentMethod}</span>
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
                  value={myVoucher.code}
                  size={192}
                  level="H"
                  className={`${
                    myVoucher.status === "used" || myVoucher.status === "expired"
                      ? "opacity-20 blur-[1px]"
                      : ""
                  }`}
                />
                {(myVoucher.status === "used" || myVoucher.status === "expired") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-inverse-surface/90 text-surface-bright px-4 py-2 rounded-lg font-bold text-sm shadow-md uppercase tracking-wider">
                      {myVoucher.status === "used" ? "Đã sử dụng" : "Đã hết hạn"}
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
                    {myVoucher.code}
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
                {(myVoucher.status === "unused" || myVoucher.status === "expiring") ? (
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
        voucherTitle={voucher.title}
        voucherCode={myVoucher.code}
        onSubmit={(rating, reviewContent, complaintContent) => {
          addReview(
            voucher.id,
            "Khách hàng",
            rating,
            reviewContent,
            complaintContent
          );
        }}
      />
    </main>
  );
}
