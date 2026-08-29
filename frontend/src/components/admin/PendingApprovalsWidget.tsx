/**
 * =========================================================================================
 * FILE: PendingApprovalsWidget.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Widget "Cần xử lý ngay" đặt trên Dashboard Quản trị viên (UC-ADM-06, UC-ADM-07).
 *   - Hiển thị danh sách tóm tắt các yêu cầu phê duyệt mới nhất (Đối tác, Voucher) đang xếp hàng chờ duyệt.
 *   - Cung cấp nút liên kết trực tiếp (Deep-link) chuyển nhanh đến màn hình chi tiết để duyệt/từ chối.
 * =========================================================================================
 */

import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";

// Interface định nghĩa cấu trúc 1 công việc duyệt trong widget
interface PendingApproval {
  id: string;      // Mã định danh (Ví dụ: PARTNER-12, VOUCHER-45)
  name: string;    // Tên đối tác hoặc Tên chương trình voucher
  type: string;    // Loại yêu cầu (Đăng ký đối tác / Phát hành voucher)
  date: string;    // Ngày gửi yêu cầu
  status: string;  // Trạng thái hiện tại
  link: string;    // Đường dẫn chuyển đến trang chi tiết
}

interface PendingApprovalsWidgetProps {
  pendingApprovals: PendingApproval[]; // Danh sách hồ sơ cần duyệt truyền từ Dashboard cha
}

export default function PendingApprovalsWidget({ pendingApprovals }: PendingApprovalsWidgetProps) {

  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cần xử lý ngay
            </h2>
            <p className="text-xs text-slate-400">Hàng chờ duyệt theo ERD</p>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
            {pendingApprovals.length} công việc
          </span>
        </div>
        <div className="space-y-3">
          {pendingApprovals.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary transition"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-primary px-2 py-0.5 bg-blue-100 rounded-md">
                  {item.id}
                </span>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-2">
                {item.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.status}</p>
              <div className="mt-3 text-right">
                <Link
                  href={item.link}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem chi tiết hồ sơ</span>
                  <Icon name="arrow_forward" className="text-sm fill-current" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/admin/partners/pending"
        className="w-full mt-4 py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1"
      >
        <span>Xem tất cả yêu cầu duyệt</span>
        <Icon name="chevron_right" className="text-sm fill-current" />
      </Link>
    </div>
  );
}
