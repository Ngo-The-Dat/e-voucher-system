/**
 * =========================================================================================
 * FILE: Sidebar.tsx (Admin Component)
 * VỊ TRÍ: frontend/src/components/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Thanh Điều hướng Bên trái (Navigation Sidebar) dành riêng cho Quản trị viên (Admin).
 *   - Các tính năng kỹ thuật nổi bật:
 *       1. Tự động tính toán & hiển thị Badge Số lượng hồ sơ chờ xử lý (Pending Count):
 *          - Gọi đồng thời 3 API (`Promise.allSettled`): Đối tác chờ duyệt, Nhân viên chờ duyệt, Voucher chờ duyệt.
 *          - Tự động re-fetch khi người dùng chuyển trang (`pathname` thay đổi).
 *       2. Tính năng Thu gọn / Mở rộng (Collapse Mode):
 *          - Hỗ trợ thu hẹp thành 80px (icon-only với tooltip) giúp mở rộng không gian làm việc trên máy tính.
 *       3. Trạng thái Active Route thông minh:
 *          - Highlight chính xác các menu cha/con (ví dụ `/admin/partners/pending` hoặc `/admin/partners/manage` đều sáng mục Đối tác).
 *       4. Đăng xuất an toàn: Xóa token JWT khỏi LocalStorage và điều hướng về trang Login.
 * =========================================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/shared/ui/Icon";
import { adminApi } from "@/lib/admin-api";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badgeKey?: "partners" | "vouchers";
}

// Danh sách các mục điều hướng chính của hệ thống Quản trị
const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Quản lý người dùng", href: "/admin/users", icon: "group" },
  { label: "Đối tác", href: "/admin/partners/pending", icon: "store", badgeKey: "partners" },
  { label: "Voucher", href: "/admin/vouchers/pending", icon: "confirmation_number", badgeKey: "vouchers" },
  { label: "Đơn hàng", href: "/admin/orders", icon: "shopping_cart" },
  { label: "Quản lý nội dung", href: "/admin/content", icon: "article" },
  { label: "Nhật ký hệ thống", href: "/admin/logs", icon: "history" },
];

interface SidebarProps {
  isOpen?: boolean;             // Trạng thái mở menu trên mobile
  onClose?: () => void;         // Đóng menu mobile khi click backdrop hoặc link
  isCollapsed?: boolean;        // Chế độ thu hẹp menu trên desktop
  onToggleCollapse?: () => void;// Nút gập/mở rộng menu desktop
}

export default function Sidebar({
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  // State lưu trữ số lượng hồ sơ đang chờ duyệt
  const [pendingCounts, setPendingCounts] = useState<{
    partners: number;
    vouchers: number;
  }>({ partners: 0, vouchers: 0 });

  /**
   * Tải số lượng hồ sơ cần duyệt thực tế từ Backend Database.
   * Sử dụng Promise.allSettled để tránh trường hợp 1 API lỗi làm chết toàn bộ sidebar.
   */
  const loadPendingCounts = useCallback(async () => {

    try {
      const [partnerRes, empRes, voucherRes] = await Promise.allSettled([
        adminApi.getPendingPartners({ limit: 1 }),
        adminApi.getPendingEmployees({ limit: 1 }),
        adminApi.getPendingVouchers({ limit: 1 }),
      ]);

      const partnersCount =
        (partnerRes.status === "fulfilled" ? partnerRes.value.pagination.total : 0) +
        (empRes.status === "fulfilled" ? empRes.value.pagination.total : 0);
      const vouchersCount =
        voucherRes.status === "fulfilled" ? voucherRes.value.pagination.total : 0;

      setPendingCounts({
        partners: partnersCount,
        vouchers: vouchersCount,
      });
    } catch {
      // Fallback giữ nguyên
    }
  }, []);

  useEffect(() => {
    loadPendingCounts();
  }, [pathname, loadPendingCounts]);

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
        className={`fixed left-0 top-0 h-full ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64 z-50 bg-white border-r border-border shadow-sm flex flex-col justify-between p-3 lg:p-4 transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo & Brand & Toggle Collapse Button */}
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center relative" : "justify-between"
            } mb-6 px-1 h-12 shrink-0`}
          >
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                V
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <h1 className="font-bold text-slate-900 text-lg leading-tight truncate">
                    Vouchify Admin
                  </h1>
                  <p className="text-text-muted text-xs truncate">Hệ thống quản trị Sàn</p>
                </div>
              )}
            </Link>

            {/* Desktop Toggle Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? "Mở rộng menu" : "Thu hẹp menu"}
                className={`hidden lg:flex ${
                  isCollapsed
                    ? "absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white border border-border shadow-md w-7 h-7 rounded-full"
                    : "w-8 h-8 rounded-lg hover:bg-slate-100"
                } items-center justify-center text-slate-500 hover:text-slate-800 transition-colors z-40`}
              >
                <Icon
                  name={isCollapsed ? "chevron_right" : "chevron_left"}
                  className="text-base"
                />
              </button>
            )}

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <Icon name="close" className="text-lg" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const badgeValue = item.badgeKey ? pendingCounts[item.badgeKey] : undefined;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                  } rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                    active
                      ? "bg-primary-container text-white shadow-sm font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 min-w-0"}`}>
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Icon
                        name={item.icon}
                        className={`text-[20px] ${
                          active ? "text-white" : "text-slate-400 group-hover:text-primary"
                        }`}
                      />
                      {/* Compact badge when collapsed */}
                      {isCollapsed && Boolean(badgeValue && badgeValue > 0) && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-amber-500 text-white shadow-xs">
                          {badgeValue}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && Boolean(badgeValue && badgeValue > 0) && (
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {badgeValue}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="pt-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
                localStorage.removeItem("admin_access_token");
                localStorage.removeItem("admin_user");
                window.location.href = "/login";
              }
            }}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={`w-full flex items-center justify-center gap-2.5 ${
              isCollapsed ? "px-0 py-3" : "px-4 py-2.5"
            } rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/70 transition-all duration-150 shadow-2xs group`}
          >
            <Icon
              name="logout"
              className="text-lg transition-transform group-hover:-translate-x-0.5 shrink-0"
            />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
