/**
 * =========================================================================================
 * FILE: SubNavbar.tsx (Admin Content Component)
 * VỊ TRÍ: frontend/src/app/admin/content/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Thanh điều hướng danh mục phụ (Sub-Navbar) cho toàn bộ phân hệ Quản lý Nội dung (CMS - UC-ADM-05).
 *   - Cung cấp liên kết chuyển tab mượt mà giữa 4 phân hệ con:
 *       1. Danh mục ngành hàng (`/admin/content/categories`).
 *       2. Banner quảng cáo (`/admin/content/banners`).
 *       3. Popup truyền thông (`/admin/content/popups`).
 *       4. Bài viết & Chính sách (`/admin/content/articles`).
 *   - Nhận diện tab đang active dựa trên `usePathname()`.
 * =========================================================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";

export default function ContentSubNavbar() {
  const pathname = usePathname();

  // Cấu hình 4 phân hệ quản lý nội dung
  const navItems = [
    {
      name: "Danh mục",
      href: "/admin/content/categories",
      icon: "category",
    },
    {
      name: "Banner quảng cáo",
      href: "/admin/content/banners",
      icon: "view_carousel",
    },
    {
      name: "Popup truyền thông",
      href: "/admin/content/popups",
      icon: "featured_seasonal",
    },
    {
      name: "Bài viết & Chính sách",
      href: "/admin/content/articles",
      icon: "article",
    },
  ];


  return (
    <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 pt-4 mb-6 sticky top-0 z-10">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          // Tab is active if pathname matches exact href or starts with it
          const isActive = pathname === item.href || (pathname === "/admin/content" && item.href === "/admin/content/categories");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center transition whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
              }`}
            >
              <Icon name={item.icon} className="mr-2 text-base" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
