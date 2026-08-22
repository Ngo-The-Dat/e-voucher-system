/**
 * =========================================================================================
 * FILE: momo.ts
 * VỊ TRÍ: backend/src/config/
 * VAI TRÒ:
 *   - Quản lý thông tin cấu hình kết nối Cổng thanh toán MoMo Developer (Sandbox).
 *   - Cung cấp tiện ích tạo và xác thực chữ ký số HMAC-SHA256 theo chuẩn MoMo API v2.
 *   - Định nghĩa các endpoint giao tiếp với MoMo Gateway (Create Payment, Query Status).
 * =========================================================================================
 */

import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  apiEndpoint: string;
  queryEndpoint: string;
  redirectUrl: string;
  ipnUrl: string;
}

/**
 * Lấy cấu hình MoMo từ biến môi trường (Mặc định sử dụng thông tin Sandbox chính thức của MoMo)
 */
export function getMoMoConfig(): MoMoConfig {
  let ipnUrl = process.env.MOMO_IPN_URL || 'https://test-payment.momo.vn/v2/gateway/api/notify';
  
  // Nếu cấu hình IPN là localhost/127.0.0.1, máy chủ MoMo trên Cloud sẽ không kết nối được
  // và bị treo (TCP timeout 15-30s) ở trang "Đang hoàn tất giao dịch...".
  // Tự động dùng endpoint notify của MoMo Sandbox để MoMo phản hồi ngay trong 0.05 giây!
  if (ipnUrl.includes('localhost') || ipnUrl.includes('127.0.0.1')) {
    ipnUrl = 'https://test-payment.momo.vn/v2/gateway/api/notify';
  }

  return {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529',
    accessKey: process.env.MOMO_ACCESS_KEY || 'klm05TvNBzhg7h7j',
    secretKey: process.env.MOMO_SECRET_KEY || 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa',
    apiEndpoint: process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    queryEndpoint: process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/orders',
    ipnUrl,
  };
}

/**
 * Tạo chữ ký HMAC-SHA256 cho yêu cầu tạo giao dịch MoMo (All-in-One Collection Link)
 * 
 * Thứ tự tham số theo quy chuẩn MoMo:
 * accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
 */
export function createMoMoCreatePaymentSignature(params: {
  accessKey: string;
  amount: number | string;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
  secretKey: string;
}): string {
  const rawSignature =
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&ipnUrl=${params.ipnUrl}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&partnerCode=${params.partnerCode}` +
    `&redirectUrl=${params.redirectUrl}` +
    `&requestId=${params.requestId}` +
    `&requestType=${params.requestType}`;

  return crypto
    .createHmac('sha256', params.secretKey)
    .update(rawSignature)
    .digest('hex');
}

/**
 * Xác thực chữ ký HMAC-SHA256 nhận được từ Webhook IPN hoặc Redirect URL của MoMo
 * 
 * Thứ tự tham số IPN / Redirect:
 * accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
 */
export function verifyMoMoCallbackSignature(params: {
  accessKey: string;
  amount: number | string;
  extraData: string;
  message: string;
  orderId: string;
  orderInfo: string;
  orderType: string;
  partnerCode: string;
  payType: string;
  requestId: string;
  responseTime: number | string;
  resultCode: number | string;
  transId: number | string;
  signature: string;
  secretKey: string;
}): boolean {
  const rawSignature =
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&message=${params.message}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&orderType=${params.orderType}` +
    `&partnerCode=${params.partnerCode}` +
    `&payType=${params.payType}` +
    `&requestId=${params.requestId}` +
    `&responseTime=${params.responseTime}` +
    `&resultCode=${params.resultCode}` +
    `&transId=${params.transId}`;

  const generatedSignature = crypto
    .createHmac('sha256', params.secretKey)
    .update(rawSignature)
    .digest('hex');

  return generatedSignature === params.signature;
}

/**
 * Tạo chữ ký HMAC-SHA256 cho yêu cầu tra cứu trạng thái giao dịch (Query Status)
 * 
 * Thứ tự tham số:
 * accessKey=$accessKey&orderId=$orderId&partnerCode=$partnerCode&requestId=$requestId
 */
export function createMoMoQuerySignature(params: {
  accessKey: string;
  orderId: string;
  partnerCode: string;
  requestId: string;
  secretKey: string;
}): string {
  const rawSignature =
    `accessKey=${params.accessKey}` +
    `&orderId=${params.orderId}` +
    `&partnerCode=${params.partnerCode}` +
    `&requestId=${params.requestId}`;

  return crypto
    .createHmac('sha256', params.secretKey)
    .update(rawSignature)
    .digest('hex');
}
