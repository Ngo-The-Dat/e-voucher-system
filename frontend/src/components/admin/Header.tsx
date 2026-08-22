"use client";

import Link from "next/link";
import Icon from "@/components/shared/ui/Icon";
import { useAdminProfile } from "@/hooks/useAdminProfile";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { profile } = useAdminProfile();

  const adminName = profile?.full_name || "Admin";
  const parts = adminName.trim().split(" ");
  const initial = parts.length > 0 ? parts[parts.length - 1][0].toUpperCase() : "A";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Open Navigation Menu"
        >
          <Icon name="menu" className="text-xl" />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Nút Hồ sơ cá nhân của Admin - Đồng bộ tự động qua useAdminProfile */}
        <Link
          href="/admin/profile"
          title="Xem thông tin tài khoản"
          className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
            {initial}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
              {adminName}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              Hồ sơ cá nhân
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
