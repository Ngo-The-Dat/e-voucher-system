"use client";

import { useState, useEffect, useCallback } from "react";
import { VoucherItem } from "@/lib/types/partner-voucher";
import { partnerApi } from "@/lib/partner-api";

const VOUCHER_SYNC_INTERVAL_MS = 5_000;

/**
 * Hook lấy toàn bộ danh sách voucher.
 */
export function usePartnerVouchers() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVouchers = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await partnerApi.getVouchers();
      setVouchers(data);
    } catch (error) {
      console.error("Failed to load partner vouchers", error);
      if (showLoading) setVouchers([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const reload = useCallback(() => fetchVouchers(true), [fetchVouchers]);
  const sync = useCallback(() => fetchVouchers(false), [fetchVouchers]);

  useEffect(() => {
    void reload();

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const intervalId = window.setInterval(syncWhenVisible, VOUCHER_SYNC_INTERVAL_MS);

    window.addEventListener("focus", syncWhenVisible);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncWhenVisible);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [reload, sync]);

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
export function usePartnerVoucherDetail(id: string) {
  const [voucher, setVoucher] = useState<VoucherItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async (showLoading: boolean = false) => {
    if (!id) return;
    if (showLoading) setIsLoading(true);
    try {
      const data = await partnerApi.getVoucher(id);
      setVoucher(data);
    } catch (error) {
      console.error("Failed to load voucher", error);
      if (showLoading) setVoucher(null);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [id]);

  const reload = useCallback(() => fetchDetail(true), [fetchDetail]);
  const sync = useCallback(() => fetchDetail(false), [fetchDetail]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { voucher, isLoading, setVoucher, reload, sync };
}

export const useVouchers = usePartnerVouchers;
export const useVoucherDetail = usePartnerVoucherDetail;
