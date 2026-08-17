"use client";

import React, { useState } from "react";
import { EmployeeProvider, useEmployee } from "@/context/EmployeeContext";
import EmployeeTopAppBar from "@/components/partner/employee/EmployeeTopAppBar";
import EmployeeSideNavBar from "@/components/partner/employee/EmployeeSideNavBar";
import Icon from "@/components/shared/ui/Icon";

function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile } = useEmployee();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
  return (
    <EmployeeProvider>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </EmployeeProvider>
  );
}
