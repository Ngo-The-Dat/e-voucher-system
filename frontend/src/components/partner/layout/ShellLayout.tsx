"use client";

import SideNavBar from "@/components/partner/layout/SideNavBar";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { PartnerProvider } from "@/context/PartnerContext";
import Icon from "@/components/shared/ui/Icon";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <PartnerProvider value={profile}>
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
