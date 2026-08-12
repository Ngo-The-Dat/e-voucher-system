"use client";

import { toast as sonnerToast } from "sonner";

/**
 * Helper gọi toast notification với sonner
 */
export const toast = sonnerToast;

export const showToast = (message: string, type: "success" | "error" = "success") => {
  if (type === "error") {
    sonnerToast.error(message);
  } else {
    sonnerToast.success(message);
  }
};

interface ToastProps {
  message?: string | null;
  type?: "success" | "error";
}

/**
 * Toast component tương thích ngược
 */
export default function Toast({ message, type = "success" }: ToastProps) {
  if (!message) return null;

  if (type === "error") {
    sonnerToast.error(message);
  } else {
    sonnerToast.success(message);
  }

  return null;
}
