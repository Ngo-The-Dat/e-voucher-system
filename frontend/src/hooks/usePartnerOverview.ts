"use client";

import { useEffect, useState } from "react";
import { partnerApi } from "@/lib/partner-api";

export function usePartnerOverview() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    partnerApi.getOverview().then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Không thể tải dashboard."))
      .finally(() => setIsLoading(false));
  }, []);
  return { data, isLoading, error };
}
