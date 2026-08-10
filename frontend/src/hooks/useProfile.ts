"use client";

import { useState, useEffect, useCallback } from "react";
import { PartnerProfile } from "@/lib/types/profile";
import {
  getStoredPartnerProfile,
  savePartnerProfile,
} from "@/lib/mock-profile";

/**
 * Hook lấy thông tin hồ sơ đối tác.
 *
 * Khi chuyển sang API thật, chỉ cần thay phần bên trong useEffect:
 *   const data = await api.getProfile();
 */
export function useProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setIsLoading(true);
    // TODO: thay bằng fetch API khi có backend
    const data = getStoredPartnerProfile();
    setProfile(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback((updated: PartnerProfile) => {
    // TODO: thay bằng API call khi có backend
    savePartnerProfile(updated);
    setProfile(updated);
  }, []);

  return { profile, isLoading, setProfile, reload, save };
}
