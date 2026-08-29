/**
 * =========================================================================================
 * FILE: VoucherNavTabs.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Thanh Tab chuyển đổi giữa 2 phân hệ Voucher chính của Quản trị viên (UC-ADM-03):
 *       1. Tab "Duyệt voucher": Danh sách voucher đối tác nộp chờ Admin phê duyệt kèm badge số lượng chờ duyệt.
 *       2. Tab "Quản lý voucher": Kho voucher toàn hệ thống (bật/tắt hiển thị, kết thúc voucher).
 *   - Nhận diện tab hiện tại bằng hook `usePathname()` của Next.js.
 * =========================================================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface VoucherNavTabsProps {
  pendingCount?: number; // Số lượng voucher đang chờ duyệt (hiển thị badge)
}

export default function VoucherNavTabs({ pendingCount = 0 }: VoucherNavTabsProps) {
  const pathname = usePathname();

  // Kiểm tra route hiện tại để kích hoạt tab tương ứng
  const isPending = pathname === "/admin/vouchers/pending";
  const isManage = pathname === "/admin/vouchers/manage";


  return (
    <div className="border-b border-slate-200 pb-1">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span>VOUCHER</span>
        <span>&rsaquo;</span>
        <span className="text-slate-600">
          {isPending ? "Duyệt voucher" : isManage ? "Quản lý voucher" : "Voucher"}
        </span>
      </div>
      <div className="flex items-center gap-8">
        <Link
          href="/admin/vouchers/pending"
          className={`pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 ${
            isPending
              ? "text-slate-900 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <span>Duyệt voucher</span>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full animate-pulse">
              {pendingCount} chờ duyệt
            </span>
          )}
        </Link>
        <Link
          href="/admin/vouchers/manage"
          className={`pb-3 text-lg font-bold transition-all relative flex items-center gap-2.5 ${
            isManage
              ? "text-slate-900 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <span>Quản lý voucher</span>
        </Link>
      </div>
    </div>
  );
}
