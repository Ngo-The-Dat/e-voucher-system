"use client";

import SideNavBar from "@/components/partner/layout/SideNavBar";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { PartnerProvider } from "@/context/PartnerContext";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useProfile();

  return (
    <PartnerProvider value={profile}>
      <div className="antialiased min-h-screen bg-background text-on-background flex w-full">
        <SideNavBar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
          {children}
        </div>
      </div>
    </PartnerProvider>
  );
}
