"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";
import VoucherRejectModal from "@/components/admin/VoucherRejectModal";
import {
  adminApi,
  AdminPendingVoucherDetail,
} from "@/lib/admin-api";

export default function PendingVoucherDetailPage() {
  const params = useParams();
  const requestId = (params?.id as string) || "";

  const [voucher, setVoucher] = useState<AdminPendingVoucherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVoucherDetail = useCallback(async () => {
    if (!requestId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPendingVoucher(requestId);
      setVoucher(data);
      setSelectedImageIndex(0);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết voucher pending:", err);
      setError(err?.message || "Không thể tải thông tin yêu cầu duyệt voucher.");
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchVoucherDetail();
  }, [fetchVoucherDetail]);

  const originalPriceNum = Number(voucher?.original_price) || 0;
  const salePriceNum = Number(voucher?.sale_price) || 0;
  const discountRate = originalPriceNum > 0
    ? Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100)
    : 0;

  // Kiểm tra vi phạm giá
  const isInvalidOriginalPrice = originalPriceNum <= 0;
  const isInvalidSalePrice = salePriceNum <= 0;
  const isPriceNotDiscounted = originalPriceNum > 0 && salePriceNum > 0 && salePriceNum >= originalPriceNum;
  const isViolationPrice = isInvalidOriginalPrice || isInvalidSalePrice || isPriceNotDiscounted;

  // Kiểm tra vi phạm thời gian
  const isInvalidSaleDates = voucher
    ? new Date(voucher.sale_end_at).getTime() <= new Date(voucher.sale_start_at).getTime()
    : false;
  const isInvalidUseDates = voucher
    ? new Date(voucher.use_end_at).getTime() <= new Date(voucher.use_start_at).getTime()
    : false;

  // Kiểm tra số lượng
  const isInvalidQuantity = !voucher?.issue_quantity || Number(voucher.issue_quantity) <= 0;

  // Tổng hợp tất cả vi phạm
  const hasViolation = isViolationPrice || isInvalidSaleDates || isInvalidUseDates || isInvalidQuantity;

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateDisplay = (dateStr?: string | null) => {
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

  const formatDateTimeDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusDisplay = (approvalStatus?: string) => {
    switch (approvalStatus) {
      case "PENDING":
        return {
          label: "Chờ xét duyệt",
          color: "bg-amber-50 text-amber-700 border-amber-200/70",
          dot: "bg-amber-500",
        };
      case "APPROVED":
        return {
          label: "Đã phê duyệt",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
          dot: "bg-emerald-500",
        };
      case "REJECTED":
        return {
          label: "Đã từ chối",
          color: "bg-rose-50 text-rose-700 border-rose-200/70",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: approvalStatus || "Chờ duyệt",
          color: "bg-slate-50 text-slate-700 border-slate-200/70",
          dot: "bg-slate-500",
        };
    }
  };

  // Duyệt voucher
  const handleApprove = async () => {
    if (!requestId || !voucher) return;
    if (hasViolation) {
      toast.error("Voucher vi phạm quy tắc nghiệp vụ. Không thể phê duyệt!");
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.approveVoucher(requestId);
      setVoucher((prev) => (prev ? { ...prev, approval_status: "APPROVED", display_status: "PUBLISHED" } : null));
      toast.success(`Đã phê duyệt thành công voucher [${voucher.program_name}] và mở bán công khai.`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi phê duyệt voucher.");
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối voucher
  const handleConfirmReject = async () => {
    if (!requestId || !voucher) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối duyệt voucher!");
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.rejectVoucher(requestId, rejectReason.trim());
      setVoucher((prev) => (prev ? { ...prev, approval_status: "REJECTED", admin_feedback: rejectReason.trim() } : null));
      setIsRejectModalOpen(false);
      setRejectReason("");
      toast.success(`Đã từ chối duyệt voucher [${voucher.program_name}] và lưu lý do phản hồi.`);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi từ chối duyệt voucher.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chi tiết yêu cầu duyệt voucher...</p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-4xl text-rose-500 mb-2 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy yêu cầu duyệt</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {error || "Yêu cầu duyệt voucher không tồn tại hoặc đã bị xóa."}
        </p>
        <Link
          href="/admin/vouchers/pending"
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại danh sách chờ duyệt
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(voucher.approval_status);
  const images = voucher.images || [];
  const activeImage = images.length > 0 ? images[Math.min(selectedImageIndex, images.length - 1)] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 flex-wrap">
            <Link href="/admin/vouchers/pending" className="hover:text-blue-600 transition">
              VOUCHER
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/vouchers/pending" className="hover:text-blue-600 transition">
              DUYỆT VOUCHER
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">YÊU CẦU #{voucher.approval_request_id}</span>
          </div>
          <div className="space-y-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug break-words">
                {voucher.program_name}
              </h1>
            </div>
            <div>
              <span
                className={`px-3 py-1 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border ${statusInfo.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-nowrap self-start lg:self-center overflow-x-auto max-w-full pb-1 lg:pb-0">
          <Link
            href="/admin/vouchers/pending"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Icon name="arrow_back" className="text-sm" />
            <span>Quay lại</span>
          </Link>
          {voucher.approval_status === "PENDING" && (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={actionLoading}
                className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0 text-xs px-3.5 py-2"
              >
                <Icon name="close" className="text-sm mr-1" />
                <span>Từ chối duyệt</span>
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading || hasViolation}
                className={`transition font-semibold whitespace-nowrap shrink-0 text-xs px-4 py-2 ${
                  hasViolation
                    ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed hover:bg-slate-200 opacity-60"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
                title={
                  hasViolation
                    ? "Voucher vi phạm quy tắc nghiệp vụ, không thể duyệt."
                    : "Phê duyệt và mở bán voucher trên sàn"
                }
              >
                <Icon name="check" className="text-base mr-1.5" />
                <span>{actionLoading ? "Đang xử lý..." : "Phê duyệt công bố bán"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner cảnh báo phát hiện vi phạm quy tắc */}
      {hasViolation && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2 shadow-xs">
          <div className="font-bold flex items-center gap-2 text-rose-900 text-sm">
            <Icon name="error" className="text-rose-600 text-lg" />
            <span>Phát hiện Vi phạm Quy tắc Xét duyệt Voucher</span>
          </div>
          <ul className="text-xs text-rose-800 space-y-1.5 list-disc list-inside">
            {isInvalidOriginalPrice && (
              <li>
                <strong>Giá gốc niêm yết không hợp lệ:</strong> Giá gốc ({formatCurrency(originalPriceNum)}) phải lớn hơn 0 ₫.
              </li>
            )}
            {isInvalidSalePrice && (
              <li>
                <strong>Giá bán ưu đãi không hợp lệ:</strong> Giá bán ({formatCurrency(salePriceNum)}) phải lớn hơn 0 ₫.
              </li>
            )}
            {isPriceNotDiscounted && (
              <li>
                <strong>Quy tắc giá bán ưu đãi:</strong> Giá bán ({formatCurrency(salePriceNum)}) lớn hơn hoặc bằng giá gốc ({formatCurrency(originalPriceNum)}). Theo quy định của sàn, giá bán ưu đãi phải nhỏ hơn giá gốc.
              </li>
            )}
            {isInvalidSaleDates && (
              <li>
                <strong>Thời gian mở bán không hợp lệ:</strong> Ngày kết thúc mở bán ({formatDateDisplay(voucher.sale_end_at)}) phải sau ngày bắt đầu ({formatDateDisplay(voucher.sale_start_at)}).
              </li>
            )}
            {isInvalidUseDates && (
              <li>
                <strong>Thời hạn sử dụng không hợp lệ:</strong> Ngày hết hạn sử dụng ({formatDateDisplay(voucher.use_end_at)}) phải sau ngày bắt đầu ({formatDateDisplay(voucher.use_start_at)}).
              </li>
            )}
            {isInvalidQuantity && (
              <li>
                <strong>Số lượng phát hành không hợp lệ:</strong> Tổng số lượng phát hành phải lớn hơn 0.
              </li>
            )}
          </ul>
          <p className="text-[11px] text-rose-700 italic pt-1 border-t border-rose-200/60">
            * Voucher có vi phạm quy tắc nên nút &ldquo;Phê duyệt công bố bán&rdquo; đã bị vô hiệu hóa. Quản trị viên vui lòng từ chối hoặc yêu cầu đối tác chỉnh sửa.
          </p>
        </div>
      )}

      {/* Main Grid Layout (2 Cols Left + 1 Col Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Voucher Details & Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bộ sưu tập hình ảnh Voucher */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon name="image" className="text-blue-600" />
                Bộ sưu tập hình ảnh Voucher
                {images.length > 0 && (
                  <span className="text-xs text-slate-500 font-normal">({images.length} ảnh)</span>
                )}
              </h2>
              {activeImage && (
                <a
                  href={activeImage.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Xem ảnh gốc</span>
                  <Icon name="open_in_new" className="text-xs" />
                </a>
              )}
            </div>

            {images.length > 0 && activeImage ? (
              <div className="space-y-3">
                {/* Ảnh chính được chọn xem */}
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/80 shadow-xs flex items-center justify-center">
                  <img
                    src={activeImage.image_url}
                    alt={`${voucher.program_name} - Ảnh ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain bg-slate-950/5"
                  />
                  {activeImage.is_primary && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
                      <Icon name="star" className="text-xs" />
                      <span>Ảnh đại diện (Primary)</span>
                    </div>
                  )}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/70 backdrop-blur-xs text-white text-xs font-medium rounded-lg">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Dải ảnh thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5">
                    {images.map((img, idx) => {
                      const isSelected = idx === selectedImageIndex;
                      return (
                        <button
                          key={img.image_id || idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-500/30 scale-95 shadow-sm"
                              : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img.image_url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {img.is_primary && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5 text-[9px] shadow-xs">
                              <Icon name="star" className="text-[10px] block" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
                <Icon name="image_not_supported" className="text-4xl text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">Chưa có hình ảnh nào được tải lên cho voucher này</p>
              </div>
            )}
          </div>

          {/* Thông tin chi tiết Chương trình Voucher */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="confirmation_number" className="text-blue-600" />
              Thông tin chương trình Voucher
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã chương trình
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  VCH-{voucher.program_id}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Mã yêu cầu xét duyệt
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  #{voucher.approval_request_id}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Tên chương trình Voucher
                </span>
                <span className="font-black text-slate-900 text-base leading-snug">
                  {voucher.program_name}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Danh mục ngành hàng
                </span>
                <span className="font-bold text-blue-600 text-sm">
                  {voucher.category_name || "Chưa phân loại"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Thời gian gửi yêu cầu duyệt
                </span>
                <span className="font-semibold text-slate-800 text-sm font-mono">
                  {formatDateTimeDisplay(voucher.submitted_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Cấu trúc Giá & Số lượng */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="payments" className="text-blue-600" />
              Cấu trúc Giá & Số lượng phát hành
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-slate-500 font-medium block mb-1">Giá gốc (Niêm yết)</span>
                <span className="text-lg font-bold text-slate-700">
                  {formatCurrency(originalPriceNum)}
                </span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                <span className="text-xs text-emerald-800 font-semibold block mb-1">
                  Giá bán ưu đãi {discountRate > 0 && `(Giảm ${discountRate}%)`}
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {formatCurrency(salePriceNum)}
                </span>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80">
                <span className="text-xs text-blue-800 font-semibold block mb-1">Số lượng phát hành</span>
                <span className="text-lg font-black text-blue-800">
                  {voucher.issue_quantity.toLocaleString("vi-VN")}{" "}
                  <span className="text-xs font-normal text-blue-600">lượt</span>
                </span>
              </div>
            </div>
          </div>

          {/* Thời gian mở bán & Thời gian sử dụng */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="event" className="text-blue-600" />
              Thời gian áp dụng
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Thời gian mở bán trên sàn
                </span>
                <div className="font-bold text-slate-800 text-sm">
                  {formatDateDisplay(voucher.sale_start_at)} &rarr; {formatDateDisplay(voucher.sale_end_at)}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Thời hạn sử dụng voucher
                </span>
                <div className="font-bold text-slate-800 text-sm">
                  {formatDateDisplay(voucher.use_start_at)} &rarr; {formatDateDisplay(voucher.use_end_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Lịch sử phản hồi từ Admin nếu có */}
          {voucher.admin_feedback && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
              <div className="font-bold text-rose-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="feedback" className="text-sm" />
                Lý do phản hồi từ chối trước đó:
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                {voucher.admin_feedback}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Partner Info & Branch List & Validation Checklist */}
        <div className="space-y-6">
          {/* Thông tin Đối tác phát hành */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="storefront" className="text-blue-600" />
              Doanh nghiệp đối tác
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Tên doanh nghiệp
                </span>
                <span className="font-bold text-slate-900 text-sm">{voucher.partner_name}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Mã số thuế
                </span>
                <span className="font-bold text-slate-800 font-mono text-sm">{voucher.tax_code}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Người đại diện
                </span>
                <span className="font-semibold text-slate-800">{voucher.partner_representative}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Email & SĐT liên hệ
                </span>
                <span className="font-medium text-slate-700 block">{voucher.partner_email}</span>
                {voucher.partner_phone && (
                  <span className="font-mono text-slate-600 text-[11px]">{voucher.partner_phone}</span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={`/admin/partners/manage/${voucher.partner_id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Xem hồ sơ đối tác đầy đủ</span>
                  <Icon name="arrow_forward" className="text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Chi nhánh áp dụng */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="location_on" className="text-blue-600" />
              Chi nhánh áp dụng ({voucher.branches?.length || 0})
            </h2>

            {voucher.branches && voucher.branches.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {voucher.branches.map((b) => (
                  <div
                    key={b.branch_id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{b.branch_name}</span>
                      {b.region && (
                        <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded text-[10px] font-semibold">
                          {b.region}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{b.address}</p>
                    {b.phone && <p className="text-slate-400 font-mono text-[10px]">SĐT: {b.phone}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Áp dụng toàn bộ hệ thống đối tác
              </div>
            )}
          </div>

          {/* Checklist Kiểm tra Nghiệp vụ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3 text-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="fact_check" className="text-blue-600" />
              Kiểm tra quy tắc tự động
            </h2>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Icon
                  name={!isInvalidOriginalPrice && !isInvalidSalePrice ? "check_circle" : "cancel"}
                  className={`text-base shrink-0 ${!isInvalidOriginalPrice && !isInvalidSalePrice ? "text-emerald-600" : "text-rose-600"}`}
                />
                <span className={!isInvalidOriginalPrice && !isInvalidSalePrice ? "text-slate-700" : "text-rose-700 font-semibold"}>
                  Giá niêm yết và giá bán &gt; 0 ₫
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  name={!isPriceNotDiscounted ? "check_circle" : "cancel"}
                  className={`text-base shrink-0 ${!isPriceNotDiscounted ? "text-emerald-600" : "text-rose-600"}`}
                />
                <span className={!isPriceNotDiscounted ? "text-slate-700" : "text-rose-700 font-semibold"}>
                  Giá bán nhỏ hơn giá gốc
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  name={!isInvalidSaleDates ? "check_circle" : "cancel"}
                  className={`text-base shrink-0 ${!isInvalidSaleDates ? "text-emerald-600" : "text-rose-600"}`}
                />
                <span className={!isInvalidSaleDates ? "text-slate-700" : "text-rose-700 font-semibold"}>
                  Thời gian mở bán hợp lệ
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  name={!isInvalidUseDates ? "check_circle" : "cancel"}
                  className={`text-base shrink-0 ${!isInvalidUseDates ? "text-emerald-600" : "text-rose-600"}`}
                />
                <span className={!isInvalidUseDates ? "text-slate-700" : "text-rose-700 font-semibold"}>
                  Thời gian sử dụng hợp lệ
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  name={!isInvalidQuantity ? "check_circle" : "cancel"}
                  className={`text-base shrink-0 ${!isInvalidQuantity ? "text-emerald-600" : "text-rose-600"}`}
                />
                <span className={!isInvalidQuantity ? "text-slate-700" : "text-rose-700 font-semibold"}>
                  Số lượng phát hành &gt; 0
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  name={images.length > 0 ? "check_circle" : "info"}
                  className={`text-base shrink-0 ${images.length > 0 ? "text-emerald-600" : "text-amber-500"}`}
                />
                <span className="text-slate-700">
                  {images.length > 0 ? `Có ${images.length} hình ảnh đính kèm` : "Chưa có hình ảnh đính kèm"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Từ chối duyệt Voucher */}
      <VoucherRejectModal
        isOpen={isRejectModalOpen}
        voucher={voucher}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={actionLoading}
      />
    </div>
  );
}
