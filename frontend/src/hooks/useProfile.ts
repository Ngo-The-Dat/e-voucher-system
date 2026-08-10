"use client";

import { useCallback, useEffect, useState } from "react";
import { partnerApi } from "@/lib/partner-api";
import type { PartnerProfile } from "@/lib/types/profile";

export function useProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setProfile(await partnerApi.getProfile()); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể tải hồ sơ."); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const save = useCallback(async (updated: PartnerProfile) => {
    setIsSaving(true); setError(null);
    try { await partnerApi.updateProfile(updated); await reload(); }
    catch (err) { const message = err instanceof Error ? err.message : "Không thể lưu hồ sơ."; setError(message); throw err; }
    finally { setIsSaving(false); }
  }, [reload]);

  return { profile, isLoading, isSaving, error, setProfile, reload, save };
}
