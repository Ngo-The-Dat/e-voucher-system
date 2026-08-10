"use client";

import { useCallback, useEffect, useState } from "react";
import { partnerApi } from "@/lib/partner-api";
import type { VoucherItem } from "@/lib/types/voucher";

export function useVouchers() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setVouchers(await partnerApi.getVouchers()); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể tải voucher."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { vouchers, isLoading, error, setVouchers, reload };
}

export function useVoucherDetail(id: string) {
  const [voucher, setVoucher] = useState<VoucherItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!id) return;
    setIsLoading(true); setError(null);
    try { setVoucher(await partnerApi.getVoucher(id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể tải voucher."); }
    finally { setIsLoading(false); }
  }, [id]);
  useEffect(() => { void reload(); }, [reload]);
  return { voucher, isLoading, error, setVoucher, reload };
}
