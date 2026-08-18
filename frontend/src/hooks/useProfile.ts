"use client";

import { useState, useEffect, useCallback } from "react";
import { PartnerProfile } from "@/lib/types/profile";
import { partnerApi } from "@/lib/partner-api";

/**
 * Hook lấy thông tin hồ sơ đối tác.
 *
 * Khi chuyển sang API thật, chỉ cần thay phần bên trong useEffect:
 *   const data = await api.getProfile();
 */
export function useProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("partner_access_token");
      if (!token) {
        setIsLoading(false);
        setProfile(null);
        return;
      }
    }
    setIsLoading(true);
    try { setProfile(await partnerApi.getProfile()); }
    catch (error) { console.error("Failed to load partner profile", error); setProfile(null); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (updated: PartnerProfile) => {
    await partnerApi.updateProfile(updated);
    setProfile(updated);
  }, []);

  return { profile, isLoading, setProfile, reload, save };
}
