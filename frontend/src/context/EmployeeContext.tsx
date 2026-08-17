/**
 * @file EmployeeContext.tsx
 * @description React Context cung cấp và quản lý trạng thái phiên làm việc của Nhân viên chi nhánh đối tác (Partner Employee):
 * lưu trữ thông tin hồ sơ nhân viên (`EmployeeProfile`), chi nhánh làm việc trực thuộc, thương hiệu chủ quản,
 * trạng thái đang tải dữ liệu và hàm tải lại dữ liệu (`reloadProfile`).
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EmployeeProfile } from "@/lib/types/employee";
import { partnerApi } from "@/lib/partner-api";
import Icon from "@/components/shared/ui/Icon";

/** Cấu trúc dữ liệu và các phương thức được cung cấp qua EmployeeContext */
interface EmployeeContextValue {
  profile: EmployeeProfile | null;                                          // Thông tin hồ sơ nhân viên hiện tại
  isLoading: boolean;                                                       // Trạng thái đang tải dữ liệu ban đầu
  reloadProfile: () => Promise<void>;                                       // Hàm tải lại thông tin hồ sơ từ server
  setProfile: React.Dispatch<React.SetStateAction<EmployeeProfile | null>>; // Cập nhật thủ công hồ sơ
}

const EmployeeContext = createContext<EmployeeContextValue>({
  profile: null,
  isLoading: true,
  reloadProfile: async () => {},
  setProfile: () => {},
});

/**
 * Provider bao bọc layout của phân hệ Nhân viên đối tác (/partner/employee).
 */
export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Tải thông tin hồ sơ nhân viên từ endpoint `/partner/employee/profile` */
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

  // Hiển thị màn hình chờ trong lúc tải thông tin tài khoản nhân viên
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

/** Hook tiện ích để lấy dữ liệu context của nhân viên tại bất kỳ component con nào */
export const useEmployee = () => useContext(EmployeeContext);
