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

export interface EmployeeAccountError {
  status?: number;
  type: "pending" | "rejected" | "locked" | "forbidden" | "error";
  message: string;
  feedback?: string | null;
}

/** Cấu trúc dữ liệu và các phương thức được cung cấp qua EmployeeContext */
interface EmployeeContextValue {
  profile: EmployeeProfile | null;                                          // Thông tin hồ sơ nhân viên hiện tại
  isLoading: boolean;                                                       // Trạng thái đang tải dữ liệu ban đầu
  error: EmployeeAccountError | null;                                       // Lỗi phân quyền hoặc trạng thái phê duyệt
  reloadProfile: () => Promise<void>;                                       // Hàm tải lại thông tin hồ sơ từ server
  setProfile: React.Dispatch<React.SetStateAction<EmployeeProfile | null>>; // Cập nhật thủ công hồ sơ
}

const EmployeeContext = createContext<EmployeeContextValue>({
  profile: null,
  isLoading: true,
  error: null,
  reloadProfile: async () => {},
  setProfile: () => {},
});

/**
 * Provider bao bọc layout của phân hệ Nhân viên đối tác (/partner/employee).
 */
export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<EmployeeAccountError | null>(null);

  /** Tải thông tin hồ sơ nhân viên từ endpoint `/partner/employee/profile` */
  const reloadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerApi.getEmployeeProfile();
      if (data.status === "LOCKED") {
        setError({
          status: 403,
          type: "locked",
          message: "Tài khoản nhân viên của bạn hiện đã bị khóa. Vui lòng liên hệ quản trị viên doanh nghiệp.",
        });
        setProfile(null);
        return;
      }
      if (data.approval_status === "PENDING") {
        setError({
          status: 403,
          type: "pending",
          message: "Tài khoản nhân viên đang chờ Quản trị viên xét duyệt. Bạn sẽ có thể truy cập hệ thống ngay sau khi hồ sơ được phê duyệt.",
        });
        setProfile(null);
        return;
      }
      if (data.approval_status === "REJECTED") {
        setError({
          status: 403,
          type: "rejected",
          message: "Tài khoản nhân viên đã bị từ chối phê duyệt.",
          feedback: data.admin_feedback,
        });
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load employee profile", err);
      if (err?.status === 403) {
        const msg: string = err.message || "";
        if (msg.includes("chờ") || msg.includes("PENDING")) {
          setError({
            status: 403,
            type: "pending",
            message: "Tài khoản nhân viên đang chờ Quản trị viên xét duyệt. Vui lòng quay lại sau.",
          });
        } else if (msg.includes("từ chối") || msg.includes("REJECTED")) {
          setError({
            status: 403,
            type: "rejected",
            message: "Tài khoản nhân viên đã bị từ chối phê duyệt.",
          });
        } else if (msg.includes("khóa") || msg.includes("vô hiệu hóa") || msg.includes("chi nhánh")) {
          setError({
            status: 403,
            type: "locked",
            message: msg || "Tài khoản hoặc chi nhánh phân công đã bị vô hiệu hóa.",
          });
        } else {
          setError({
            status: 403,
            type: "forbidden",
            message: msg || "Tài khoản nhân viên chưa được cấp quyền truy cập.",
          });
        }
      } else if (err?.status === 401) {
        // Will be redirected to login automatically
      } else {
        setError({
          status: err?.status,
          type: "error",
          message: err?.message || "Không thể kết nối đến máy chủ.",
        });
      }
      setProfile(null);
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
    <EmployeeContext.Provider value={{ profile, isLoading, error, reloadProfile, setProfile }}>
      {children}
    </EmployeeContext.Provider>
  );
}

/** Hook tiện ích để lấy dữ liệu context của nhân viên tại bất kỳ component con nào */
export const useEmployee = () => useContext(EmployeeContext);
