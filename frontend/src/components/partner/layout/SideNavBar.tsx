"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";

const navItems = [
  { href: "/partner", label: "Tổng quan", icon: "dashboard" },
  { href: "/partner/vouchers", label: "Quản lý Voucher", icon: "confirmation_number" },
  { href: "/partner/vouchers/check", label: "Kiểm tra Voucher", icon: "qr_code_scanner" },
  { href: "/partner/employees", label: "Quản lý Nhân viên", icon: "badge" },
  { href: "/partner/reports", label: "Thống kê hiệu quả", icon: "analytics" },
];

interface SideNavBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function SideNavBar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: SideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={`w-64 ${isCollapsed ? "md:w-20" : "md:w-64"} ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 bg-surface-bright border-r border-outline-variant/40 flex flex-col h-screen fixed inset-y-0 left-0 md:sticky md:top-0 shrink-0 transition-all duration-300 z-50 md:z-30 shadow-sm`}
    >
      {/* Header / Brand & Collapse Toggle Button */}
      <div className={`p-4 flex items-center ${isCollapsed ? "justify-center relative" : "justify-between"} border-b border-outline-variant/30 h-16`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-2xl shadow-md shrink-0">
            L
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-200 min-w-0">
              <h1 className="font-bold text-on-surface text-lg leading-tight truncate">Lumina</h1>
              <p className="text-xs text-on-surface-variant font-medium truncate">Partner Portal</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng menu" : "Thu hẹp menu"}
          className={`hidden md:flex ${
            isCollapsed
              ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-surface-bright border border-outline-variant shadow-md w-7 h-7 rounded-full"
              : "w-8 h-8 rounded-lg hover:bg-surface-container-high"
          } flex items-center justify-center text-on-surface-variant transition-colors z-40`}
        >
          <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isExactActive = pathname === item.href;
          const isSubActive =
            item.href !== "/partner" &&
            pathname.startsWith(item.href) &&
            !pathname.startsWith("/partner/vouchers/check");
          const isActive = isExactActive || isSubActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3.5 ${
                isCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
              } rounded-xl text-base font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <Icon
                name={item.icon}
                className={`text-[22px] ${
                  isActive ? "text-on-primary-container" : "text-outline"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout Button */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low/40">
        <button
          onClick={() => {
            if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
              localStorage.removeItem("partner_access_token");
              router.push("/login");
            }
          }}
          title={isCollapsed ? "Đăng xuất" : undefined}
          className={`w-full flex items-center gap-3.5 ${
            isCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
          } rounded-xl text-base font-bold text-error hover:bg-error-container/30 transition-colors group`}
        >
          <Icon name="logout" className="text-[22px] text-error group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
