"use client";

import { useState, useEffect, useCallback } from "react";
import { PartnerEmployeeItem } from "@/lib/types/partner-employee";
import { partnerApi } from "@/lib/partner-api";

const EMPLOYEE_SYNC_INTERVAL_MS = 10_000;

/**
 * Hook lấy toàn bộ danh sách nhân viên đối tác với cơ chế tự động đồng bộ chạy ngầm (polling + focus + visibilitychange).
 */
export function usePartnerEmployees() {
  const [employees, setEmployees] = useState<PartnerEmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await partnerApi.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to load partner employees", error);
      if (showLoading) setEmployees([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const reload = useCallback(() => fetchEmployees(true), [fetchEmployees]);
  const sync = useCallback(() => fetchEmployees(false), [fetchEmployees]);

  useEffect(() => {
    void reload();

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const intervalId = window.setInterval(syncWhenVisible, EMPLOYEE_SYNC_INTERVAL_MS);

    window.addEventListener("focus", syncWhenVisible);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncWhenVisible);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [reload, sync]);

  return { employees, isLoading, setEmployees, reload, sync };
}

export const useEmployees = usePartnerEmployees;
