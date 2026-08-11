"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Quản lý người dùng", href: "/admin/users", icon: "group" },
  { label: "Đối tác", href: "/admin/partners/pending", icon: "store", badge: 4 },
  { label: "Voucher", href: "/admin/vouchers/pending", icon: "confirmation_number", badge: 12 },
  { label: "Đơn hàng", href: "/admin/orders", icon: "shopping_cart" },
  { label: "Quản lý nội dung", href: "/admin/content", icon: "article" },
  { label: "Nhật ký hệ thống", href: "/admin/logs", icon: "history" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/partners/pending") return pathname.startsWith("/admin/partners/");
    if (href === "/admin/vouchers/pending") return pathname.startsWith("/admin/vouchers/");
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 bg-white border-r border-border shadow-sm flex flex-col justify-between p-4 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between mb-8 px-2">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                L
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg leading-tight">
                  Lumina Admin
                </h1>
                <p className="text-text-muted text-xs">Hệ thống quản trị Sàn</p>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <Icon name="close" className="text-lg" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary-container text-white shadow-sm font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      name={item.icon}
                      className={`text-[20px] ${
                        active ? "text-white" : "text-slate-400 group-hover:text-primary"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
                // Keep the existing full-page logout navigation behavior.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/";
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/70 transition-all duration-150 shadow-2xs group"
          >
            <Icon name="logout" className="text-lg transition-transform group-hover:-translate-x-0.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
