"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ContentSubNavbar() {
  const pathname = usePathname();

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
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
