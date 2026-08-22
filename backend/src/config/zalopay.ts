/**
 * =========================================================================================
 * FILE: zalopay.ts
 * VỊ TRÍ: backend/src/config/
 * VAI TRÒ:
 *   - Quản lý thông tin cấu hình cho Cổng thanh toán ZaloPay Sandbox v2.
 *   - Cung cấp các hàm tạo chữ ký MAC (HMAC-SHA256) cho yêu cầu tạo đơn hàng và tra cứu giao dịch.
 *   - Cung cấp hàm xác thực chữ ký MAC cho Webhook Callback Server-to-Server từ ZaloPay.
 * =========================================================================================
 */

import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

export interface ZaloPayConfig {
  appId: number;
  key1: string;
  key2: string;
  endpoint: string;
  queryEndpoint: string;
  redirectUrl: string;
  callbackUrl: string;
}

/**
 * Lấy cấu hình ZaloPay từ biến môi trường (Mặc định sử dụng thông tin Sandbox chính thức của ZaloPay)
 */
export function getZaloPayConfig(): ZaloPayConfig {
  return {
    appId: Number(process.env.ZALOPAY_APP_ID || 2554),
    key1: process.env.ZALOPAY_KEY1 || 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
    key2: process.env.ZALOPAY_KEY2 || 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
    endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
    queryEndpoint: process.env.ZALOPAY_QUERY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/query',
    redirectUrl: process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:3000/orders',
    callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'https://vouchify.duckdns.org/api/customer/payments/zalopay/callback',
  };
}

/**
 * Định dạng ngày theo định dạng yyMMdd cho app_trans_id
 */
export function formatDateYYMMDD(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${MM}${dd}`;
}

/**
 * Tạo chữ ký MAC HMAC-SHA256 khi gửi request tạo đơn hàng lên ZaloPay:
 * Chuỗi định dạng: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
 */
export function createZaloPayOrderMac(params: {
  appId: number;
  appTransId: string;
  appUser: string;
  amount: number;
  appTime: number;
  embedData: string;
  item: string;
  key1: string;
}): string {
  const rawData = `${params.appId}|${params.appTransId}|${params.appUser}|${params.amount}|${params.appTime}|${params.embedData}|${params.item}`;
  return crypto.createHmac('sha256', params.key1).update(rawData).digest('hex');
}

/**
 * Tạo chữ ký MAC HMAC-SHA256 khi tra cứu trạng thái đơn hàng (Query Status):
 * Chuỗi định dạng: app_id|app_trans_id|key1
 */
export function createZaloPayQueryMac(params: {
  appId: number;
  appTransId: string;
  key1: string;
}): string {
  const rawData = `${params.appId}|${params.appTransId}|${params.key1}`;
  return crypto.createHmac('sha256', params.key1).update(rawData).digest('hex');
}

/**
 * Xác thực chữ ký MAC nhận từ Webhook Callback của ZaloPay:
 * Dữ liệu payload: `data` là chuỗi JSON do ZaloPay gửi, mã hóa HMAC-SHA256 với `key2`
 */
export function verifyZaloPayCallbackMac(data: string, mac: string, key2: string): boolean {
  try {
    const expectedMac = crypto.createHmac('sha256', key2).update(data).digest('hex');
    return expectedMac === mac;
  } catch {
    return false;
  }
}
