/**
 * =========================================================================================
 * FILE: page.tsx (Admin Content Root)
 * VỊ TRÍ: frontend/src/app/admin/content/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Trang Cửa ngõ (Redirect Gateway) của phân hệ Quản lý Nội dung (UC-ADM-05).
 *   - Tự động chuyển hướng (router.replace) người dùng vào phân hệ con mặc định: Danh mục ngành hàng (`/admin/content/categories`).
 * =========================================================================================
 */

"use client";

import Icon from "@/components/shared/ui/Icon";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContentPage() {
  const router = useRouter();

  // Tự động chuyển hướng ngay khi component mount
  useEffect(() => {
    router.replace("/admin/content/categories");
  }, [router]);


  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <Icon name="progress_activity" className="text-4xl text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Đang chuyển hướng đến trang Quản lý Nội dung...</p>
      </div>
    </div>
  );
}
