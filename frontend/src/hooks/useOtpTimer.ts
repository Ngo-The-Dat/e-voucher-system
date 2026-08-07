"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook đếm ngược thời gian resend OTP.
 * @param initialSeconds - thời gian ban đầu (mặc định 60s)
 */
export function useOtpTimer(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    if (seconds <= 0) {
      setIsRunning(false);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, isRunning]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  return { seconds, isRunning, isExpired: seconds <= 0, start, reset };
}
