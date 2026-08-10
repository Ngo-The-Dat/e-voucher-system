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
    setIsLoading(true);
    try { setProfile(await partnerApi.getProfile()); }
    catch (error) { console.error("Failed to load partner profile", error); setProfile(null); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback((updated: PartnerProfile) => {
    setProfile(updated);
    void partnerApi.updateProfile(updated).catch((error) => console.error("Failed to save partner profile", error));
  }, []);

  return { profile, isLoading, setProfile, reload, save };
}
