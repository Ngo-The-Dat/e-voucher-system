"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { EmployeeProfile } from "@/lib/types/employee";

interface EmployeeSideNavBarProps {
  profile: EmployeeProfile | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function EmployeeSideNavBar({
  profile,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}: EmployeeSideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const partnerName = profile?.partner?.business_name ?? "Đối tác";
  const branchName = profile?.branch?.name ?? "Chi nhánh phân công";
  const brandLogo = profile?.partner?.brand_logo;

  const isCheckVoucherActive = pathname === "/partner/employee";

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("partner_access_token");
      localStorage.removeItem("partner_user");
      router.push("/login");
    }
  };

  return (
    <aside
      className={`w-64 ${isCollapsed ? "md:w-20" : "md:w-64"} ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 bg-surface-bright border-r border-outline-variant/40 flex flex-col h-screen fixed inset-y-0 left-0 md:sticky md:top-0 shrink-0 transition-all duration-300 z-50 md:z-30 shadow-sm`}
    >
      {/* Brand & Partner Info */}
      <div
        className={`p-4 flex items-center ${
          isCollapsed ? "justify-center relative" : "justify-between"
        } border-b border-outline-variant/30 h-16`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl shadow-md overflow-hidden relative shrink-0">
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
          {!isCollapsed && (
            <div className="transition-opacity duration-200 min-w-0">
              <h1 className="font-bold text-on-surface text-base leading-tight truncate">
                {partnerName}
              </h1>
              <p className="text-xs text-on-surface-variant font-medium truncate">Cổng Nhân viên</p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button on Desktop */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng menu" : "Thu hẹp menu"}
          className={`hidden md:flex ${
            isCollapsed
              ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-surface-bright border border-outline-variant shadow-md w-7 h-7 rounded-full"
              : "w-8 h-8 rounded-lg hover:bg-surface-container-high"
          } flex items-center justify-center text-on-surface-variant transition-colors z-40`}
        >
          <Icon
            name={isCollapsed ? "chevron_right" : "chevron_left"}
            className="w-5 h-5 fill-current"
          />
        </button>
      </div>

      {/* Branch assigned indicator */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mt-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center gap-2">
          <Icon name="store" className="text-primary text-base shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant font-medium">Chi nhánh làm việc</p>
            <p className="text-xs font-bold text-on-surface truncate">{branchName}</p>
          </div>
        </div>
      )}

      {/* Navigation (Single primary action: Kiểm tra Voucher) */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <Link
          href="/partner/employee"
          onClick={onMobileClose}
          title={isCollapsed ? "Kiểm tra Voucher" : undefined}
          className={`flex items-center gap-3.5 ${
            isCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
          } rounded-xl text-base font-semibold transition-all duration-200 ${
            isCheckVoucherActive
              ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <Icon
            name="qr_code_scanner"
            className={`text-[22px] ${
              isCheckVoucherActive ? "text-on-primary-container" : "text-outline"
            }`}
          />
          {!isCollapsed && <span className="truncate">Kiểm tra Voucher</span>}
        </Link>
      </nav>

      {/* Footer: Logout Button (Same position and styling as Partner) */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low/40">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Đăng xuất" : undefined}
          className={`w-full flex items-center gap-3.5 ${
            isCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
          } rounded-xl text-base font-bold text-error hover:bg-error-container/30 transition-colors group cursor-pointer`}
        >
          <Icon
            name="logout"
            className="text-[22px] text-error group-hover:scale-110 transition-transform"
          />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
