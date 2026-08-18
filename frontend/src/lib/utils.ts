
import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{
        text: [
          "title-md",
          "headline-xl-mobile",
          "body-lg",
          "label-lg",
          "label-md",
          "label-sm",
          "headline-xl",
          "headline-lg",
          "body-md",
        ],
      }],
    },
  },
});

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format số tiền theo định dạng Việt Nam (VD: 123.000 ₫)
 */
export function formatCurrency(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

/**
 * Format ngày tháng từ chuỗi ISO hoặc YYYY-MM-DD (VD: 01/10/2026)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  // Xử lý cả định dạng "YYYY-MM-DD" và ISO
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("vi-VN");
}

/**
 * Format tỷ lệ phần trăm (VD: 84.2%)
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Tính tỷ lệ phần trăm an toàn (tránh chia cho 0)
 */
export function calcRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Rút gọn chuỗi nếu quá dài
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

/**
 * Chuẩn hóa link điều hướng cho Banner & Promo Popup
 * Ưu tiên:
 * 1. program_id -> /vouchers/:id
 * 2. target_url -> nếu chứa /programs/:id hoặc /vouchers/:id -> /vouchers/:id
 * 3. target_url bắt đầu bằng "/" -> giữ nguyên
 * 4. Fallback -> /vouchers
 */
export function resolveTargetLink(item?: { program_id?: number | null; target_url?: string | null } | null): string {
  if (!item) return "/vouchers";
  if (item.program_id) {
    return `/vouchers/${item.program_id}`;
  }
  if (item.target_url) {
    const trimmed = item.target_url.trim();
    const match = trimmed.match(/\/(?:programs|vouchers)\/(\d+)/i);
    if (match && match[1]) {
      return `/vouchers/${match[1]}`;
    }
    if (trimmed.startsWith("/")) {
      return trimmed;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `/${trimmed}`;
  }
  return "/vouchers";
}

