"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { EmployeeProfile } from "@/lib/types/employee";

interface EmployeeTopAppBarProps {
  profile: EmployeeProfile | null;
}

export default function EmployeeTopAppBar({ profile }: EmployeeTopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isProfilePage = pathname === "/partner/employee/profile";
  const employeeName = profile?.full_name ?? "Nhân viên";
  const partnerName = profile?.partner?.business_name ?? "Đối tác";
  const branchName = profile?.branch?.name ?? "Chi nhánh";
  const brandLogo = profile?.partner?.brand_logo;

  const initials = employeeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("partner_access_token");
      localStorage.removeItem("partner_user");
      router.push("/partner/login");
    }
  };

  return (
    <header className="h-16 border-b border-outline-variant/40 bg-surface-bright/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Brand & Branch Info */}
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        <Link
          href="/partner/employee"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl shadow-md overflow-hidden relative">
            {brandLogo ? (
              <Image
                src={brandLogo}
                alt={partnerName}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>L</span>
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <h1 className="font-bold text-on-surface text-base leading-tight truncate max-w-[200px] md:max-w-[280px]">
              {partnerName}
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">Cổng Nhân viên</p>
          </div>
        </Link>

        {/* Branch Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/60 text-xs font-semibold text-on-surface truncate max-w-[220px] md:max-w-none">
          <Icon name="store" className="text-primary text-base shrink-0" />
          <span className="truncate">{branchName}</span>
        </div>
      </div>

      {/* Right: Quick Action, Avatar Profile Link & Logout */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {isProfilePage ? (
          <Link
            href="/partner/employee"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors"
          >
            <Icon name="qr_code_scanner" className="text-lg" />
            <span className="hidden sm:inline">Kiểm tra Voucher</span>
          </Link>
        ) : (
          <span className="hidden md:inline-block text-xs text-on-surface-variant italic">
            Nhấn vào Avatar để xem tài khoản
          </span>
        )}

        {/* Profile Avatar & Link to /partner/employee/profile */}
        <Link
          href="/partner/employee/profile"
          title="Xem thông tin tài khoản nhân viên"
          className={`flex items-center gap-2.5 pl-3 border-l border-outline-variant/50 transition-all rounded-xl p-1 ${
            isProfilePage
              ? "bg-primary-container/60 text-on-primary-container font-bold"
              : "hover:bg-surface-container-high text-on-surface"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ring-2 ring-primary/20">
            <span>{initials}</span>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-sm font-bold leading-tight truncate max-w-[150px]">
              {employeeName}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Hồ sơ cá nhân</span>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-error hover:bg-error-container/40 transition-colors"
        >
          <Icon name="logout" className="text-xl" />
        </button>
      </div>
    </header>
  );
}
