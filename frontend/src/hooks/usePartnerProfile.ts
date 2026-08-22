"use client";

import { useState, useEffect, useCallback } from "react";
import { PartnerProfile } from "@/lib/types/partner-profile";
import { partnerApi } from "@/lib/partner-api";

export interface PartnerAccountError {
  status?: number;
  type: "pending" | "rejected" | "locked" | "forbidden" | "error";
  message: string;
  feedback?: string | null;
}

/**
 * Hook lấy thông tin hồ sơ đối tác và kiểm tra trạng thái phê duyệt.
 */
export function usePartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<PartnerAccountError | null>(null);

  const fetchProfile = useCallback(async (showLoading: boolean = false) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("partner_access_token");
      if (!token) {
        if (showLoading) setIsLoading(false);
        setProfile(null);
        setError(null);
        return;
      }
    }
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsSyncing(true);
    }

    try {
      const data = await partnerApi.getProfile();
      if (data.activityStatus === "LOCKED") {
        setError({
          status: 403,
          type: "locked",
          message: "Tài khoản đối tác của bạn hiện đang bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.",
        });
        setProfile(null);
        return;
      }
      if (data.approvalStatus === "PENDING") {
        setError({
          status: 403,
          type: "pending",
          message: "Hồ sơ đối tác doanh nghiệp đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng quay lại sau.",
        });
        setProfile(null);
        return;
      }
      if (data.approvalStatus === "REJECTED") {
        setError({
          status: 403,
          type: "rejected",
          message: "Hồ sơ đối tác doanh nghiệp đã bị từ chối phê duyệt.",
          feedback: data.adminFeedback,
        });
        setProfile(null);
        return;
      }
      setError(null);
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load partner profile", err);
      if (err?.status === 403) {
        const msg: string = err.message || "";
        if (msg.includes("chờ") || msg.includes("PENDING")) {
          setError({
            status: 403,
            type: "pending",
            message: "Hồ sơ đối tác doanh nghiệp đang chờ Quản trị viên (Admin) phê duyệt.",
          });
        } else if (msg.includes("từ chối") || msg.includes("REJECTED")) {
          setError({
            status: 403,
            type: "rejected",
            message: "Hồ sơ đối tác doanh nghiệp đã bị từ chối phê duyệt.",
          });
        } else if (msg.includes("khóa") || msg.includes("vô hiệu hóa")) {
          setError({
            status: 403,
            type: "locked",
            message: msg || "Tài khoản đối tác đã bị khóa hoặc tạm ngưng hoạt động.",
          });
        } else {
          setError({
            status: 403,
            type: "forbidden",
            message: msg || "Tài khoản đối tác chưa được cấp quyền truy cập.",
          });
        }
        setProfile(null);
      } else if (err?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("partner_access_token");
          window.location.replace("/login");
        }
        setProfile(null);
      } else {
        if (showLoading) {
          setError({
            status: err?.status,
            type: "error",
            message: err?.message || "Không thể kết nối đến máy chủ.",
          });
          setProfile(null);
        }
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setIsSyncing(false);
    }
  }, []);

  const reload = useCallback(() => fetchProfile(true), [fetchProfile]);
  const sync = useCallback(() => fetchProfile(false), [fetchProfile]);

  useEffect(() => {
    void reload();

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void sync();
      }
    };

    window.addEventListener("focus", syncWhenVisible);
    window.addEventListener("storage", syncWhenVisible);
    document.addEventListener("visibilitychange", syncWhenVisible);

    // Heartbeat check every 10s to sync auth in real-time silently
    const interval = setInterval(() => {
      void sync();
    }, 10000);

    return () => {
      window.removeEventListener("focus", syncWhenVisible);
      window.removeEventListener("storage", syncWhenVisible);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      clearInterval(interval);
    };
  }, [reload, sync]);

  const save = useCallback(async (updated: PartnerProfile) => {
    await partnerApi.updateProfile(updated);
    setProfile(updated);
  }, []);

  return { profile, isLoading, isSyncing, error, setProfile, reload, sync, save };
}

export const useProfile = usePartnerProfile;
