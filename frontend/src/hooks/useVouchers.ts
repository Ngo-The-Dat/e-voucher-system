"use client";

import { useState, useEffect, useCallback } from "react";
import { VoucherItem } from "@/lib/types/voucher";
import { partnerApi } from "@/lib/partner-api";

/**
 * Hook lấy toàn bộ danh sách voucher.
 *
 * Khi chuyển sang API thật, chỉ cần thay phần bên trong useEffect:
 *   const data = await api.getVouchers();
 */
export function useVouchers() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try { setVouchers(await partnerApi.getVouchers()); }
    catch (error) { console.error("Failed to load partner vouchers", error); setVouchers([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateVoucher = useCallback((updated: VoucherItem) => {
    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === updated.id ? updated : v));
      return next;
    });
  }, []);

  return { vouchers, isLoading, setVouchers, reload, updateVoucher };
}

/**
 * Hook lấy chi tiết một voucher theo ID.
 */
export function useVoucherDetail(id: string) {
  const [voucher, setVoucher] = useState<VoucherItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    partnerApi.getVoucher(id).then(setVoucher)
      .catch((error) => { console.error("Failed to load voucher", error); setVoucher(null); })
      .finally(() => setIsLoading(false));
  }, [id]);

  return { voucher, isLoading, setVoucher };
}
