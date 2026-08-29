/**
 * =========================================================================================
 * FILE: VoucherRejectModal.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Modal Hộp thoại "Từ chối duyệt Voucher" của Quản trị viên (UC-ADM-03).
 *   - Các đặc điểm nghiệp vụ quan trọng:
 *       1. Bắt buộc nhập lý do từ chối: Nút xác nhận bị vô hiệu hóa (`disabled={!reason.trim()}`) nếu lý do trống.
 *       2. Phản hồi này được ghi vào trường `rejection_reason` của yêu cầu duyệt và chuyển voucher về trạng thái DRAFT.
 *       3. Ghi vết kiểm toán vào `system_logs` (Audit Log).
 * =========================================================================================
 */

"use client";

import { Button } from "@/components/shared/ui/Button";
import FormField from "@/components/shared/ui/FormField";
import { AdminPendingVoucherItem } from "@/lib/admin-api";

interface VoucherRejectModalProps {
  isOpen: boolean;                               // Trạng thái hiển thị modal
  voucher: AdminPendingVoucherItem | null;       // Đối tượng voucher đang được thao tác từ chối
  reason: string;                                // Giá trị chuỗi lý do từ chối
  onReasonChange: (val: string) => void;         // Callback khi gõ nội dung lý do
  onClose: () => void;                           // Callback đóng modal
  onConfirm: () => void;                         // Callback gọi API từ chối voucher
  isSubmitting?: boolean;                        // Cờ hiệu đang gọi API để vô hiệu hóa nút bấm tránh double-click
}

export default function VoucherRejectModal({
  isOpen,
  voucher,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isSubmitting = false,
}: VoucherRejectModalProps) {

  if (!isOpen || !voucher) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h4 className="font-bold text-slate-900 text-base">Từ chối duyệt Voucher</h4>
        <p className="text-xs text-slate-500">
          Vui lòng nhập phản hồi / lý do từ chối để hệ thống thông báo cho đối tác{" "}
          <span className="font-bold text-slate-800">{voucher.partner_name}</span> về chương trình{" "}
          <span className="font-bold text-slate-800">[{voucher.program_name}]</span>.
        </p>

        <div>
          <FormField label="Lý do từ chối (Lưu vào Nhật ký & gửi đối tác)">
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ví dụ: Giá bán lớn hơn hoặc bằng giá gốc, thông tin thời gian sử dụng không chính xác, chi nhánh chưa hợp lệ..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || !reason.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600 transition-all"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </div>
      </div>
    </div>
  );
}
