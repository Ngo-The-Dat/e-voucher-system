"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import VoucherStatusModal from "@/components/admin/VoucherStatusModal";
import {
  adminApi,
  AdminManagedVoucherDetail,
  AdminApiError,
} from "@/lib/admin-api";

export default function ManagedVoucherDetailPage() {
  const params = useParams();
  const programId = (params?.id as string) || "";

  const [voucher, setVoucher] = useState<AdminManagedVoucherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Status Change Dialog State
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    targetStatus: "PUBLISHED" | "HIDDEN" | "ENDED";
  } | null>(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  const fetchVoucherDetail = useCallback(async () => {
    if (!programId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getManagedVoucher(programId);
      setVoucher(data);
      setSelectedImageIndex(0);
    } catch (err: any) {
      console.error("Lỗi tải chi tiết voucher managed:", err);
      setError(err?.message || "Không thể tải thông tin chương trình voucher.");
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchVoucherDetail();
  }, [fetchVoucherDetail]);

  const originalPriceNum = Number(voucher?.original_price) || 0;
  const salePriceNum = Number(voucher?.sale_price) || 0;
  const discountRate = originalPriceNum > 0
    ? Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100)
    : 0;

  const stockNum = Number(voucher?.stock) || 0;
  const soldCountNum = Number(voucher?.sold_count) || 0;
  const issueQuantityNum = Number(voucher?.issue_quantity) || 0;
  const soldPercent = issueQuantityNum > 0
    ? Math.min(100, Math.round((soldCountNum / issueQuantityNum) * 100))
    : 0;

  // Kiểm tra vi phạm giá
  const isInvalidOriginalPrice = originalPriceNum <= 0;
  const isInvalidSalePrice = salePriceNum <= 0;
  const isPriceNotDiscounted = originalPriceNum > 0 && salePriceNum > 0 && salePriceNum >= originalPriceNum;
  const isViolationPrice = isInvalidOriginalPrice || isInvalidSalePrice || isPriceNotDiscounted;

  // Kiểm tra vi phạm thời gian
  const isExpiredSaleEnd = voucher
    ? new Date(voucher.sale_end_at).getTime() < Date.now()
    : false;
  const isExpiredUseEnd = voucher
    ? new Date(voucher.use_end_at).getTime() < Date.now()
    : false;
  const isInvalidSaleDates = voucher
    ? new Date(voucher.sale_end_at).getTime() <= new Date(voucher.sale_start_at).getTime()
    : false;
  const isInvalidUseDates = voucher
    ? new Date(voucher.use_end_at).getTime() <= new Date(voucher.use_start_at).getTime()
    : false;
  const isViolationDate = isExpiredSaleEnd || isExpiredUseEnd || isInvalidSaleDates || isInvalidUseDates;

  // Kiểm tra tồn kho & số lượng
  const isInvalidQuantity = !voucher?.issue_quantity || Number(voucher.issue_quantity) <= 0;
  const isStockOut = stockNum <= 0;
  const isViolationStock = isStockOut || isInvalidQuantity;

  // Tổng hợp tất cả vi phạm
  const hasViolation = isViolationPrice || isViolationDate || isViolationStock;

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

  const getStatusDisplay = (displayStatus?: string) => {
    switch (displayStatus) {
      case "PUBLISHED":
        return {
          label: "Đang bán công khai",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
          dot: "bg-emerald-500",
        };
      case "HIDDEN":
        return {
          label: "Tạm ngưng hiển thị",
          color: "bg-amber-50 text-amber-700 border-amber-200/70",
          dot: "bg-amber-500",
        };
      case "ENDED":
        return {
          label: "Ngừng bán vĩnh viễn",
          color: "bg-rose-50 text-rose-700 border-rose-200/70",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: displayStatus || "Không xác định",
          color: "bg-slate-50 text-slate-700 border-slate-200/70",
          dot: "bg-slate-500",
        };
    }
  };

  const handleOpenStatusModal = (targetStatus: "PUBLISHED" | "HIDDEN" | "ENDED") => {
    setModalErrorMessage(null);
    setStatusDialog({
      isOpen: true,
      targetStatus,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!voucher || !statusDialog) return;

    try {
      setIsStatusSubmitting(true);
      setModalErrorMessage(null);
      await adminApi.updateVoucherStatus(voucher.program_id, statusDialog.targetStatus);
      toast.success(
        statusDialog.targetStatus === "PUBLISHED"
          ? `Đã khôi phục mở bán voucher [${voucher.program_name}].`
          : statusDialog.targetStatus === "HIDDEN"
          ? `Đã tạm ngưng hiển thị voucher [${voucher.program_name}].`
          : `Đã ngừng bán chương trình voucher [${voucher.program_name}].`
      );
      setStatusDialog(null);
      await fetchVoucherDetail();
    } catch (err: any) {
      const msg = err?.message || "Lỗi khi cập nhật trạng thái voucher.";
      setModalErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chi tiết chương trình voucher...</p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Icon name="error" className="text-4xl text-rose-500 mb-2 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy voucher</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {error || "Chương trình voucher không tồn tại hoặc đã bị xóa."}
        </p>
        <Link
          href="/admin/vouchers/manage"
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại danh sách quản lý
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(voucher.display_status);
  const images = voucher.images || [];
  const activeImage = images.length > 0 ? images[Math.min(selectedImageIndex, images.length - 1)] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 flex-wrap">
            <Link href="/admin/vouchers/manage" className="hover:text-blue-600 transition">
              VOUCHER
            </Link>
            <span>&rsaquo;</span>
            <Link href="/admin/vouchers/manage" className="hover:text-blue-600 transition">
              QUẢN LÝ VOUCHER
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-600">VCH-{voucher.program_id}</span>
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
            href="/admin/vouchers/manage"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Icon name="arrow_back" className="text-sm" />
            <span>Quay lại</span>
          </Link>

          {/* Nút Tạm ngưng */}
          {voucher.display_status === "PUBLISHED" && (
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenStatusModal("HIDDEN")}
              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 whitespace-nowrap shrink-0 text-xs px-3.5 py-2"
            >
              <Icon name="pause_circle" className="text-sm mr-1" />
              <span>Tạm ngưng bán</span>
            </Button>
          )}

          {/* Nút Khôi phục về Đang bán: CHỈ hiển thị khi đang Tạm ngưng (HIDDEN) VÀ KHÔNG có bất kỳ vi phạm nào */}
          {voucher.display_status === "HIDDEN" && !hasViolation && (
            <Button
              type="button"
              onClick={() => handleOpenStatusModal("PUBLISHED")}
              className="transition font-semibold whitespace-nowrap shrink-0 text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              title="Khôi phục trạng thái Đang bán trên sàn"
            >
              <Icon name="play_circle" className="text-base mr-1.5" />
              <span>Khôi phục mở bán</span>
            </Button>
          )}

          {/* Nút Ngừng bán vĩnh viễn (Chỉ hiển thị khi chưa Ngừng bán) */}
          {voucher.display_status !== "ENDED" && (
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenStatusModal("ENDED")}
              className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0 text-xs px-3.5 py-2"
            >
              <Icon name="cancel" className="text-sm mr-1" />
              <span>Ngừng bán</span>
            </Button>
          )}
        </div>
      </div>

      {/* Banner cảnh báo phát hiện vi phạm quy tắc */}
      {hasViolation && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2 shadow-xs">
          <div className="font-bold flex items-center gap-2 text-rose-900 text-sm">
            <Icon name="error" className="text-rose-600 text-lg" />
            <span>Phát hiện Vi phạm Quy tắc Hoạt động &amp; Bán Voucher</span>
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
            {isExpiredSaleEnd && !isInvalidSaleDates && (
              <li>
                <strong>Thời gian mở bán đã hết hạn:</strong> Thời hạn mở bán trên sàn đã kết thúc vào ngày {formatDateDisplay(voucher.sale_end_at)}.
              </li>
            )}
            {isInvalidUseDates && (
              <li>
                <strong>Thời hạn sử dụng không hợp lệ:</strong> Ngày hết hạn sử dụng ({formatDateDisplay(voucher.use_end_at)}) phải sau ngày bắt đầu ({formatDateDisplay(voucher.use_start_at)}).
              </li>
            )}
            {isExpiredUseEnd && !isInvalidUseDates && (
              <li>
                <strong>Thời hạn sử dụng voucher đã hết hạn:</strong> Voucher đã hết hạn sử dụng từ ngày {formatDateDisplay(voucher.use_end_at)}.
              </li>
            )}
            {isStockOut && (
              <li>
                <strong>Hết số lượng phát hành:</strong> Toàn bộ số lượng phát hành ({issueQuantityNum.toLocaleString("vi-VN")} lượt) đã được bán hết (Tồn kho: 0).
              </li>
            )}
            {isInvalidQuantity && (
              <li>
                <strong>Số lượng phát hành không hợp lệ:</strong> Tổng số lượng phát hành phải lớn hơn 0.
              </li>
            )}
          </ul>
          {voucher.display_status === "HIDDEN" && (
            <p className="text-[11px] text-rose-700 italic pt-1 border-t border-rose-200/60">
              * Do vi phạm quy tắc trên, nút &ldquo;Khôi phục mở bán&rdquo; đã bị ẩn để đảm bảo tính hợp lệ của hệ thống.
            </p>
          )}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gallery & Program Specs */}
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

          {/* Thông tin chương trình Voucher */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="confirmation_number" className="text-blue-600" />
              Thông tin chi tiết chương trình
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
                  Danh mục ngành hàng
                </span>
                <span className="font-bold text-blue-600 text-sm">
                  {voucher.category_name || "Chưa phân loại"}
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
            </div>
          </div>

          {/* Cấu trúc Giá & Thống kê Tồn kho / Bán hàng */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Icon name="payments" className="text-blue-600" />
              Giá bán & Thống kê phát hành
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-slate-500 font-medium block mb-1">Giá niêm yết (Gốc)</span>
                <span className="text-lg font-bold text-slate-700">
                  {formatCurrency(originalPriceNum)}
                </span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                <span className="text-xs text-emerald-800 font-semibold block mb-1">
                  Giá bán sàn {discountRate > 0 && `(Giảm ${discountRate}%)`}
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {formatCurrency(salePriceNum)}
                </span>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80">
                <span className="text-xs text-blue-800 font-semibold block mb-1">Tổng phát hành</span>
                <span className="text-lg font-black text-blue-800">
                  {issueQuantityNum.toLocaleString("vi-VN")}{" "}
                  <span className="text-xs font-normal text-blue-600">lượt</span>
                </span>
              </div>
            </div>

            {/* Tiến độ bán hàng & Tồn kho */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tiến độ tiêu thụ: {soldPercent}% ({soldCountNum.toLocaleString("vi-VN")} đã bán)</span>
                <span className={stockNum <= 0 ? "text-rose-600" : "text-slate-800"}>
                  Tồn kho còn lại: {stockNum.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    soldPercent >= 100 ? "bg-rose-500" : soldPercent >= 70 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
              {voucher.used_count !== undefined && voucher.used_count > 0 && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <Icon name="check_circle" className="text-emerald-600 text-sm" />
                  <span>Đã có <strong>{voucher.used_count}</strong> voucher được khách hàng sử dụng thành công tại điểm bán.</span>
                </div>
              )}
            </div>
          </div>

          {/* Thời gian áp dụng */}
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
                <div className={`font-bold text-sm ${isExpiredSaleEnd ? "text-rose-600" : "text-slate-800"}`}>
                  {formatDateDisplay(voucher.sale_start_at)} &rarr; {formatDateDisplay(voucher.sale_end_at)}
                </div>
                {isExpiredSaleEnd && (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    (Đã hết thời hạn mở bán)
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">
                  Thời hạn sử dụng voucher
                </span>
                <div className={`font-bold text-sm ${isExpiredUseEnd ? "text-rose-600" : "text-slate-800"}`}>
                  {formatDateDisplay(voucher.use_start_at)} &rarr; {formatDateDisplay(voucher.use_end_at)}
                </div>
                {isExpiredUseEnd && (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    (Đã hết thời hạn sử dụng)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Partner & Branches */}
        <div className="space-y-6">
          {/* Thông tin Đối tác */}
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

              {voucher.partner_representative && (
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Người đại diện
                  </span>
                  <span className="font-semibold text-slate-800">{voucher.partner_representative}</span>
                </div>
              )}

              {(voucher.partner_email || voucher.partner_phone) && (
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Liên hệ
                  </span>
                  {voucher.partner_email && (
                    <span className="font-medium text-slate-700 block">{voucher.partner_email}</span>
                  )}
                  {voucher.partner_phone && (
                    <span className="font-mono text-slate-600 text-[11px]">{voucher.partner_phone}</span>
                  )}
                </div>
              )}

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
              Chi nhánh áp dụng ({voucher.branches?.length || (voucher.branch_name ? 1 : 0)})
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
            ) : voucher.branch_name ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                <span className="font-bold text-slate-900">{voucher.branch_name}</span>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Áp dụng toàn bộ hệ thống đối tác
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Dialog Box xác nhận đổi trạng thái */}
      <VoucherStatusModal
        isOpen={Boolean(statusDialog?.isOpen)}
        voucher={voucher}
        targetStatus={statusDialog?.targetStatus ?? null}
        onClose={() => {
          setStatusDialog(null);
          setModalErrorMessage(null);
        }}
        onConfirm={handleConfirmStatusChange}
        isSubmitting={isStatusSubmitting}
        errorMessage={modalErrorMessage}
      />
    </div>
  );
}
