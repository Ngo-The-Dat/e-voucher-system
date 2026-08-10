"use client";

import SideNavBar from "@/components/partner/layout/SideNavBar";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStore, partnerApi } from "@/lib/partner-api";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authStore.getToken()) { router.replace("/partner/login"); return; }
    partnerApi.getProfile().then(() => setIsAuthorized(true)).catch(() => {
      authStore.clear(); router.replace("/partner/login");
    });
  }, [router]);

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center text-primary font-semibold">Đang xác thực...</div>;

  return (
    <div className="antialiased min-h-screen bg-background text-on-background flex w-full">
      <SideNavBar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
