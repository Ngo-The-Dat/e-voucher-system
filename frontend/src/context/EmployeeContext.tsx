"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EmployeeProfile } from "@/lib/types/employee";
import { partnerApi } from "@/lib/partner-api";
import Icon from "@/components/shared/ui/Icon";

interface EmployeeContextValue {
  profile: EmployeeProfile | null;
  isLoading: boolean;
  reloadProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<EmployeeProfile | null>>;
}

const EmployeeContext = createContext<EmployeeContextValue>({
  profile: null,
  isLoading: true,
  reloadProfile: async () => {},
  setProfile: () => {},
});

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadProfile = async () => {
    try {
      const data = await partnerApi.getEmployeeProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load employee profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background min-h-screen">
        <div className="flex items-center gap-3 text-on-surface-variant font-medium text-lg">
          <Icon name="progress_activity" className="animate-spin text-primary" />
          <span>Đang tải cổng nhân viên...</span>
        </div>
      </div>
    );
  }

  return (
    <EmployeeContext.Provider value={{ profile, isLoading, reloadProfile, setProfile }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export const useEmployee = () => useContext(EmployeeContext);
