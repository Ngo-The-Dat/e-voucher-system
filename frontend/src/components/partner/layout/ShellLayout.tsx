"use client";

import SideNavBar from "@/components/partner/layout/SideNavBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { PartnerProvider } from "@/context/PartnerContext";
import Icon from "@/components/shared/ui/Icon";
import AccountRestrictedNotice from "@/components/shared/ui/AccountRestrictedNotice";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { profile, isLoading, error, reload } = useProfile();

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

  if (!isAuthed || isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-on-surface-variant font-medium text-base">
          <Icon name="progress_activity" className="animate-spin text-primary text-xl" />
          <span>Đang xác thực quyền truy cập đối tác...</span>
        </div>
      </div>
    );
  }

  // Nếu tài khoản đối tác đang chờ duyệt, bị từ chối hoặc bị khóa -> Hiển thị màn hình thông báo trạng thái
  if (error || !profile) {
    return (
      <AccountRestrictedNotice
        type={error?.type ?? "forbidden"}
        title={error?.type === "pending" ? "Hồ sơ đối tác đang chờ xét duyệt" : undefined}
        message={error?.message}
        feedback={error?.feedback}
        roleName="đối tác doanh nghiệp"
        onRetry={reload}
      />
    );
  }

  return (
    <PartnerProvider value={{ partner: profile, refreshPartner: reload }}>
      <div
        className="antialiased min-h-screen bg-background text-on-background flex w-full"
        style={{ "--partner-sidebar-width": isCollapsed ? "5rem" : "16rem" } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Mở menu điều hướng đối tác"
          className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-surface-bright border border-outline-variant shadow-md flex items-center justify-center text-on-surface"
        >
          <Icon name="menu" />
        </button>
        {isMobileNavOpen && (
          <button
            type="button"
            aria-label="Đóng menu điều hướng đối tác"
            onClick={() => setIsMobileNavOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/40"
          />
        )}
        <SideNavBar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={() => setIsMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
          {children}
        </div>
      </div>
    </PartnerProvider>
  );
}
