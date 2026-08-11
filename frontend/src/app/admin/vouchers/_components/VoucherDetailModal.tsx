"use client";

import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";
import { AdminPendingVoucherItem } from "@/lib/admin-api";

interface VoucherDetailModalProps {
  voucher: AdminPendingVoucherItem | null;
  onClose: () => void;
  onApprove: (voucher: AdminPendingVoucherItem) => void;
  onOpenReject: (voucher: AdminPendingVoucherItem) => void;
  isSubmitting?: boolean;
}

export default function VoucherDetailModal({
  voucher,
  onClose,
  onApprove,
  onOpenReject,
  isSubmitting = false,
}: VoucherDetailModalProps) {
  if (!voucher) return null;

  const originalPriceNum = Number(voucher.original_price) || 0;
  const salePriceNum = Number(voucher.sale_price) || 0;
  const discountRate = originalPriceNum > 0
    ? Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100)
    : 0;

  const isViolationPrice = salePriceNum >= originalPriceNum;
  const isInvalidSaleDates = new Date(voucher.sale_end_at).getTime() <= new Date(voucher.sale_start_at).getTime();
  const isInvalidUseDates = new Date(voucher.use_end_at).getTime() <= new Date(voucher.use_start_at).getTime();
  const isInvalidQuantity = !voucher.issue_quantity || Number(voucher.issue_quantity) <= 0;
  const hasViolation = isViolationPrice || isInvalidSaleDates || isInvalidUseDates || isInvalidQuantity;

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatDateString = (dateStr: string) => {
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

  const formatDateTimeString = (dateStr: string) => {
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Chi tiết Yêu cầu Duyệt Voucher</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Mã yêu cầu: #{voucher.approval_request_id} • Mã chương trình: #{voucher.program_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Cảnh báo vi phạm quy tắc */}
          {isViolationPrice && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <Icon name="warning" className="text-lg" />
                Cảnh báo Quy tắc Giá bán
              </div>
              <p className="text-xs">
                Giá bán ({formatCurrency(salePriceNum)}) lớn hơn hoặc bằng Giá gốc (
                {formatCurrency(originalPriceNum)}). Cần yêu cầu đối tác chỉnh sửa lại.
              </p>
            </div>
          )}

          {(isInvalidSaleDates || isInvalidUseDates) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Icon name="warning" className="text-lg" />
                Cảnh báo Thời gian áp dụng
              </div>
              <p className="text-xs">
                Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.
              </p>
            </div>
          )}

          {/* Nhóm Thông tin Chương trình */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              THÔNG TIN CHƯƠNG TRÌNH VOUCHER
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Mã chương trình</span>
                <span className="font-bold text-slate-900 font-mono text-xs">
                  VCH-{voucher.program_id}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Danh mục</span>
                <span className="font-bold text-blue-600 text-xs">
                  {voucher.category_name || "Chưa phân loại"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Tên chương trình</span>
                <span className="font-bold text-slate-900 text-base leading-snug">
                  {voucher.program_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Thời gian gửi duyệt</span>
                <span className="font-semibold text-slate-700 text-xs">
                  {formatDateTimeString(voucher.submitted_at)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Trạng thái duyệt</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {voucher.approval_status === "PENDING" ? "Chờ duyệt" : voucher.approval_status}
                </span>
              </div>
            </div>
          </div>

          {/* Nhóm Thông tin Đối tác & Chi nhánh */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              THÔNG TIN ĐỐI TÁC & CHI NHÁNH ÁP DỤNG
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Doanh nghiệp đối tác</span>
                <span className="font-bold text-slate-800">{voucher.partner_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Mã số thuế</span>
                <span className="font-bold text-slate-800 font-mono">{voucher.tax_code}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Người đại diện</span>
                <span className="font-semibold text-slate-800">{voucher.partner_representative}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Liên hệ</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {voucher.partner_email} {voucher.partner_phone ? `• ${voucher.partner_phone}` : ""}
                </span>
              </div>
            </div>

            {/* Danh sách chi nhánh áp dụng */}
            {voucher.branches && voucher.branches.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-xs text-slate-500 block mb-2 font-medium">
                  Chi nhánh áp dụng ({voucher.branches.length} điểm):
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {voucher.branches.map((b) => (
                    <div
                      key={b.branch_id}
                      className="p-2 bg-white rounded-lg border border-slate-200/80 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{b.branch_name}</span>
                        <span className="text-slate-500 block text-[11px]">{b.address}</span>
                      </div>
                      {b.region && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold shrink-0 ml-2">
                          {b.region}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nhóm Giá & Số lượng */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-xs text-slate-500 block">Giá gốc</span>
              <span className="font-bold text-slate-700 text-base">
                {formatCurrency(originalPriceNum)}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 block">Giá bán ({discountRate > 0 ? `Giảm ${discountRate}%` : "Giá bán"})</span>
              <span className="font-bold text-emerald-700 text-base">
                {formatCurrency(salePriceNum)}
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-xs text-slate-500 block">Số lượng phát hành</span>
              <span className="font-bold text-amber-800 text-base">
                {voucher.issue_quantity.toLocaleString("vi-VN")} lượt
              </span>
            </div>
          </div>

          {/* Nhóm Thời gian Bán & Sử dụng */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              THỜI GIAN ÁP DỤNG
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Thời gian phát hành/bán:</span>
                <span className="font-bold text-slate-800">
                  {formatDateString(voucher.sale_start_at)} đến {formatDateString(voucher.sale_end_at)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Thời gian sử dụng:</span>
                <span className="font-bold text-slate-800">
                  {formatDateString(voucher.use_start_at)} đến {formatDateString(voucher.use_end_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Phản hồi cũ nếu có */}
          {voucher.admin_feedback && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-xs font-bold text-rose-800 block mb-1">
                Phản hồi từ Admin trước đó:
              </span>
              <p className="text-xs text-rose-900 font-medium">{voucher.admin_feedback}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Đóng
          </Button>
          {voucher.approval_status === "PENDING" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenReject(voucher)}
                disabled={isSubmitting}
                className="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
              >
                Từ chối duyệt
              </Button>
              <Button
                onClick={() => onApprove(voucher)}
                disabled={hasViolation || isSubmitting}
                className={`transition font-semibold ${
                  hasViolation
                    ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed hover:bg-slate-200 opacity-60"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                title={
                  hasViolation
                    ? "Voucher vi phạm quy tắc nghiệp vụ, không thể phê duyệt. Vui lòng từ chối để đối tác chỉnh sửa."
                    : "Phê duyệt và mở bán voucher trên sàn"
                }
              >
                {isSubmitting ? "Đang xử lý..." : "Phê duyệt công bố bán"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
