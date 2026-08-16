"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle2, AlertCircle, MessageSquarePlus } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, reviewContent: string, complaintContent: string) => void;
  voucherTitle?: string;
  voucherCode?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  voucherTitle,
  voucherCode
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState<string>("");
  const [hasComplaint, setHasComplaint] = useState<boolean>(false);
  const [complaintContent, setComplaintContent] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      rating,
      reviewContent.trim(),
      hasComplaint ? complaintContent.trim() : ""
    );
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setReviewContent("");
    setHasComplaint(false);
    setComplaintContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <h3 className="font-title-md text-title-md font-bold text-on-surface">
              Phiếu ghi nhận ý kiến khách hàng
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center text-center gap-4 animate-scaleUp">
            <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-secondary" />
            </div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Cảm ơn ý kiến đóng góp của bạn!
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Phiếu đánh giá và phản hồi dịch vụ của bạn đã được hệ thống ghi nhận thành công.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:opacity-95 transition-all cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            {/* Voucher Info Summary */}
            {(voucherTitle || voucherCode) && (
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant">
                {voucherTitle && (
                  <p className="font-label-md text-label-md font-bold text-on-surface line-clamp-1">
                    {voucherTitle}
                  </p>
                )}
                {voucherCode && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                    Mã voucher: <span className="font-mono font-semibold text-primary">{voucherCode}</span>
                  </p>
                )}
              </div>
            )}

            {/* 1. Star Rating Section */}
            <div>
              <label className="block font-label-md text-label-md font-bold text-on-surface mb-2">
                1. Đánh giá chất lượng dịch vụ (từ 1 đến 5 sao)
              </label>
              <div className="flex items-center justify-center gap-2 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                          : "text-outline-variant"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-2 font-medium">
                {rating === 5 && "⭐ 5/5 - Rất hài lòng"}
                {rating === 4 && "⭐ 4/5 - Hài lòng"}
                {rating === 3 && "⭐ 3/5 - Bình thường"}
                {rating === 2 && "⭐ 2/5 - Không hài lòng"}
                {rating === 1 && "⭐ 1/5 - Rất thất vọng"}
              </p>
            </div>

            {/* 2. Optional Review Content Textbox */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-label-md text-label-md font-bold text-on-surface">
                  2. Nhận xét / Ý kiến phản hồi
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant italic">
                  (Không bắt buộc)
                </span>
              </div>
              <textarea
                rows={3}
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Chia sẻ nhận xét hoặc trải nghiệm sử dụng voucher của bạn..."
                className="w-full bg-surface-lowest border border-outline-variant rounded-xl p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>

            {/* 3. Complaint Checkbox & Dynamic Complaint Textbox */}
            <div className="pt-2 border-t border-outline-variant/60">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasComplaint}
                  onChange={(e) => setHasComplaint(e.target.checked)}
                  className="w-5 h-5 accent-error rounded cursor-pointer"
                />
                <span className="font-label-md text-label-md font-bold text-error group-hover:underline flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Tôi có phản ánh / khiếu nại về dịch vụ
                </span>
              </label>

              {hasComplaint && (
                <div className="mt-3 animate-fadeIn space-y-1.5">
                  <label className="block font-label-md text-label-md font-bold text-on-surface">
                    Nội dung khiếu nại / phản ánh chi tiết
                  </label>
                  <textarea
                    rows={3}
                    required={hasComplaint}
                    value={complaintContent}
                    onChange={(e) => setComplaintContent(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải khi sử dụng voucher..."
                    className="w-full bg-error-container/20 border border-error/40 rounded-xl p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-error focus:ring-1 focus:ring-error shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface-variant font-label-md text-label-md font-bold rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                Gửi phiếu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
