"use client";

import { useState, useEffect, useCallback } from "react";
import { VoucherItem } from "@/lib/types/voucher";
import {
  getStoredVouchers,
  saveVouchers,
  getVoucherById as _getVoucherById,
} from "@/lib/mock-vouchers";

/**
 * Hook lấy toàn bộ danh sách voucher.
 *
 * Khi chuyển sang API thật, chỉ cần thay phần bên trong useEffect:
 *   const data = await api.getVouchers();
 */
export function useVouchers() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setIsLoading(true);
    // TODO: thay bằng fetch API khi có backend
    const data = getStoredVouchers();
    setVouchers(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateVoucher = useCallback((updated: VoucherItem) => {
    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === updated.id ? updated : v));
      saveVouchers(next);
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
    // TODO: thay bằng fetch API khi có backend
    const data = _getVoucherById(id);
    setVoucher(data);
    setIsLoading(false);
  }, [id]);

  return { voucher, isLoading, setVoucher };
}
