"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { EmployeeProfile } from "@/lib/types/employee";

interface EmployeeTopAppBarProps {
  profile: EmployeeProfile | null;
}

export default function EmployeeTopAppBar({ profile }: EmployeeTopAppBarProps) {
  const pathname = usePathname();

  const isProfilePage = pathname === "/partner/employee/profile";
  const employeeName = profile?.full_name ?? "Nhân viên";

  const initials = employeeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <header className="h-16 border-b border-outline-variant/30 bg-surface-bright/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-on-surface">
          {isProfilePage ? "Hồ sơ tài khoản nhân viên" : "Kiểm tra & Đổi Voucher"}
        </h2>
      </div>

      {/* Right: Quick Action & Profile Avatar with Employee Name */}
      <div className="flex items-center gap-3 md:gap-4">
        {isProfilePage && (
          <Link
            href="/partner/employee"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Icon name="qr_code_scanner" className="text-base sm:text-lg" />
            <span>Kiểm tra Voucher</span>
          </Link>
        )}

        {/* Profile Avatar & Link to /partner/employee/profile */}
        <Link
          href="/partner/employee/profile"
          title="Xem thông tin tài khoản nhân viên"
          className="flex items-center gap-3 pl-3 border-l border-outline-variant/40 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden relative shrink-0 border border-outline-variant/30">
            <span>{initials}</span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-base font-bold text-on-surface leading-tight truncate max-w-[180px]">
              {employeeName}
            </span>
            <span className="text-xs text-on-surface-variant">Hồ sơ cá nhân</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
