/**
 * =========================================================================================
 * FILE: VoucherStatusModal.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Modal Thay đổi Trạng thái Hiển thị / Hoạt động của Voucher trong kho toàn sàn (UC-ADM-03).
 *   - Các trạng thái được xử lý (Lifecycle States):
 *       1. `HIDDEN` (Tạm ngưng): Ẩn voucher khỏi trang tìm kiếm/mua sắm của khách hàng, có thể mở lại.
 *       2. `PUBLISHED` (Đang bán): Mở bán công khai trở lại cho khách hàng.
 *       3. `ENDED` (Ngừng bán vĩnh viễn): Kết thúc đợt phát hành, không thể mua thêm nhưng voucher đã mua vẫn dùng được.
 *   - Sử dụng bảng cấu hình `config` để tự động render icon, tiêu đề, màu sắc, cảnh báo và nút bấm tương ứng.
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { Button } from "@/components/shared/ui/Button";
import { AdminManagedVoucherItem } from "@/lib/admin-api";

interface VoucherStatusModalProps {
  isOpen: boolean;                                               // Trạng thái mở modal
  voucher: AdminManagedVoucherItem | null;                       // Đối tượng voucher được chọn
  targetStatus: "PUBLISHED" | "HIDDEN" | "ENDED" | null;        // Trạng thái đích muốn cập nhật
  onClose: () => void;                                           // Callback đóng modal
  onConfirm: () => void;                                         // Callback gọi API cập nhật trạng thái
  isSubmitting?: boolean;                                        // Cờ hiệu đang xử lý API
  errorMessage?: string | null;                                  // Thông báo lỗi trả về từ Backend (nếu có)
}

export default function VoucherStatusModal({
  isOpen,
  voucher,
  targetStatus,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
}: VoucherStatusModalProps) {

  if (!isOpen || !voucher || !targetStatus) return null;

  const config = {
    HIDDEN: {
      title: "Tạm ngưng hiển thị voucher",
      icon: "pause_circle",
      iconColor: "text-amber-600 bg-amber-100",
      description:
        "Chương trình voucher này sẽ tạm thời bị ẩn khỏi danh sách tìm kiếm và mua hàng của khách hàng trên sàn. Bạn có thể khôi phục lại bất kỳ lúc nào.",
      confirmButtonText: "Tạm ngưng voucher",
      confirmButtonClass: "bg-amber-600 hover:bg-amber-700 text-white",
      badgeText: "Tạm ngưng",
    },
    PUBLISHED: {
      title: "Khôi phục trạng thái đang bán",
      icon: "play_circle",
      iconColor: "text-emerald-600 bg-emerald-100",
      description:
        "Chương trình voucher sẽ được hiển thị công khai trên sàn và khách hàng có thể tiếp tục mua sắm.",
      confirmButtonText: "Khôi phục mở bán",
      confirmButtonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      badgeText: "Đang bán",
    },
    ENDED: {
      title: "Ngừng bán chương trình voucher",
      icon: "cancel",
      iconColor: "text-rose-600 bg-rose-100",
      description:
        "Chương trình voucher sẽ kết thúc đợt phát hành và ngừng bán hoàn toàn trên sàn. Các voucher khách hàng đã mua vẫn có thể sử dụng bình thường.",
      confirmButtonText: "Ngừng bán vĩnh viễn",
      confirmButtonClass: "bg-rose-600 hover:bg-rose-700 text-white",
      badgeText: "Ngừng bán",
    },
  }[targetStatus];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${config.iconColor}`}>
            <Icon name={config.icon} className="text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{config.title}</h3>
            <p className="text-xs text-slate-500 mt-1">Mã chương trình: VCH-{voucher.program_id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-2 space-y-3 text-sm">
          {/* Box tóm tắt thông tin Voucher */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="font-bold text-slate-900 line-clamp-2 text-xs sm:text-sm">
              {voucher.program_name}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Đối tác: <strong className="text-slate-700">{voucher.partner_name}</strong></span>
              <span>Tồn kho: <strong className="text-slate-700">{voucher.stock.toLocaleString("vi-VN")}</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{config.description}</p>

          {/* Hiển thị lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <Icon name="error" className="text-rose-600 text-base shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-4 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs py-2 px-4"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`text-xs py-2 px-4 font-semibold ${config.confirmButtonClass}`}
          >
            {isSubmitting ? "Đang xử lý..." : config.confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
