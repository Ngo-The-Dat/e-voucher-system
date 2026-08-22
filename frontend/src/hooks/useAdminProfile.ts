/**
 * =========================================================================================
 * FILE: useAdminProfile.ts
 * VỊ TRÍ: frontend/src/hooks/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Custom Hook quản lý trạng thái hồ sơ cá nhân của Quản trị viên (Admin Profile).
 *   - Chịu trách nhiệm:
 *       1. Tự động gọi API `adminApi.getProfile()` để lấy dữ liệu thực từ Backend PostgreSQL.
 *       2. Cung cấp hàm `updateProfile` gọi API `adminApi.updateProfile()` và đồng bộ toàn cục qua event `admin-user-updated`.
 *       3. Cung cấp hàm `changePassword` gọi API `adminApi.changePassword()` để đổi mật khẩu an toàn với bcrypt.
 * =========================================================================================
 */

import { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  AdminProfile,
  UpdateAdminProfilePayload,
} from "@/lib/admin-api";

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tải dữ liệu hồ sơ Quản trị viên từ Backend API.
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Gọi API Backend
      const apiUser = await adminApi.getProfile();
      if (apiUser) {
        setProfile(apiUser);
        localStorage.setItem("admin_user", JSON.stringify(apiUser));
      }
    } catch (err: any) {
      // Fallback sang localStorage nếu đang offline hoặc gặp lỗi
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
      setError(err?.message || "Không thể tải thông tin hồ sơ Quản trị viên.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cập nhật thông tin cá nhân của Quản trị viên vào Backend PostgreSQL.
   */
  const updateProfile = async (data: UpdateAdminProfilePayload) => {
    const updated = await adminApi.updateProfile(data);
    setProfile(updated);
    localStorage.setItem("admin_user", JSON.stringify(updated));

    // Phát sự kiện toàn cục để Header cập nhật tên ngay lập tức
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-user-updated"));
    }
    return updated;
  };

  /**
   * Đổi mật khẩu tài khoản Quản trị viên tại Backend.
   */
  const changePassword = async (old_password: string, new_password: string) => {
    if (!old_password || !new_password) {
      throw new Error("Vui lòng điền đầy đủ các trường mật khẩu.");
    }
    if (new_password.length < 8) {
      throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự.");
    }

    const res = await adminApi.changePassword({
      old_password,
      new_password,
    });
    return res;
  };

  useEffect(() => {
    loadProfile();

    // Lắng nghe sự kiện đồng bộ từ các component khác
    const handleSync = () => {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener("admin-user-updated", handleSync);
    return () => window.removeEventListener("admin-user-updated", handleSync);
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    changePassword,
    reload: loadProfile,
  };
}
