"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PartnerEmployeeProvider, usePartnerEmployee } from "@/context/PartnerEmployeeContext";
import EmployeeTopAppBar from "@/components/partner/employee/EmployeeTopAppBar";
import EmployeeSideNavBar from "@/components/partner/employee/EmployeeSideNavBar";
import Icon from "@/components/shared/ui/Icon";
import AccountRestrictedNotice from "@/components/shared/ui/AccountRestrictedNotice";

function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, error, reloadProfile } = usePartnerEmployee();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Nếu có lỗi xác thực / phê duyệt / khóa tài khoản, hiển thị màn hình thông báo và chặn hiển thị giao diện làm việc
  if (error || !profile) {
    return (
      <AccountRestrictedNotice
        type={error?.type ?? "forbidden"}
        title={error?.type === "pending" ? "Tài khoản nhân viên đang chờ duyệt" : undefined}
        message={error?.message}
        feedback={error?.feedback}
        roleName="nhân viên đối tác"
        onRetry={reloadProfile}
      />
    );
  }

  return (
    <div
      className="antialiased min-h-screen bg-background text-on-background flex w-full"
      style={{ "--employee-sidebar-width": isCollapsed ? "5rem" : "16rem" } as React.CSSProperties}
    >
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileNavOpen(true)}
        aria-label="Mở menu điều hướng nhân viên"
        className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-surface-bright border border-outline-variant shadow-md flex items-center justify-center text-on-surface"
      >
        <Icon name="menu" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Đóng menu điều hướng nhân viên"
          onClick={() => setIsMobileNavOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      {/* Side Navigation Bar with single action & bottom-left logout */}
      <EmployeeSideNavBar
        profile={profile}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area with TopAppBar */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        <EmployeeTopAppBar profile={profile} />
        <div className="flex-1 flex flex-col min-w-0 w-full">{children}</div>
      </div>
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("partner_access_token");
    const isJwt = token !== null && token.split('.').length === 3;
    if (!isJwt) {
      localStorage.removeItem("partner_access_token");
      router.replace("/login");
      return;
    }
    setIsAuthed(true);
  }, [router]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-on-surface-variant font-medium text-base">
          <Icon name="progress_activity" className="animate-spin text-primary text-xl" />
          <span>Đang xác thực quyền truy cập...</span>
        </div>
      </div>
    );
  }

  return (
    <PartnerEmployeeProvider>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </PartnerEmployeeProvider>
  );
}
