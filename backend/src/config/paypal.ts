/**
 * =========================================================================================
 * FILE: paypal.ts
 * VỊ TRÍ: backend/src/config/
 * VAI TRÒ:
 *   - Quản lý cấu hình kết nối PayPal (Client ID, Secret, API Base URL, Mode).
 *   - Cung cấp Client giao tiếp với PayPal REST API v2 (OAuth2 Token, Create Order, Capture Order).
 *   - Hỗ trợ linh hoạt cả 2 chế độ:
 *       1. 'sandbox': Giao tiếp trực tiếp với máy chủ PayPal Sandbox (https://api-m.sandbox.paypal.com).
 *       2. 'mock': Tự động mô phỏng nội bộ khi chưa cấu hình Client ID hoặc khi chạy môi trường dev/test offline.
 * =========================================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

export interface PayPalConfig {
  mode: 'sandbox' | 'live' | 'mock';
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export function getPayPalConfig(): PayPalConfig {
  const mode = (process.env.PAYPAL_MODE || 'mock').toLowerCase() as 'sandbox' | 'live' | 'mock';
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl =
    process.env.PAYPAL_API_BASE_URL ||
    (mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

  const returnUrl = process.env.PAYPAL_RETURN_URL;
  const cancelUrl = process.env.PAYPAL_CANCEL_URL;

  if (!clientId) throw new Error('[PayPal] PAYPAL_CLIENT_ID chưa được cấu hình trong .env');
  if (!clientSecret) throw new Error('[PayPal] PAYPAL_CLIENT_SECRET chưa được cấu hình trong .env');
  if (!returnUrl) throw new Error('[PayPal] PAYPAL_RETURN_URL chưa được cấu hình trong .env');
  if (!cancelUrl) throw new Error('[PayPal] PAYPAL_CANCEL_URL chưa được cấu hình trong .env');

  return {
    mode,
    clientId,
    clientSecret,
    baseUrl,
    returnUrl,
    cancelUrl,
  };
}

/**
 * Lấy Access Token từ PayPal qua giao thức OAuth2 Client Credentials
 */
export async function getPayPalAccessToken(): Promise<string | null> {
  const config = getPayPalConfig();

  // Nếu là chế độ mock hoặc chưa cấu hình credentials -> trả về null để service dùng mô phỏng
  if (config.mode === 'mock' || !config.clientId || !config.clientSecret) {
    return null;
  }

  // Kiểm tra cache token
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  try {
    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[PayPal Config] Không thể lấy OAuth2 Token từ PayPal: ${response.status} - ${errorText}`);
      return null;
    }

    const data: any = await response.json();
    cachedAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;

    return cachedAccessToken;
  } catch (error) {
    console.warn(`[PayPal Config] Lỗi kết nối PayPal OAuth2 (${(error as Error).message}). Tự động dùng Mock.`);
    return null;
  }
}

/**
 * Gọi PayPal REST API v2 để tạo đơn hàng thật trên Sandbox
 */
export async function createPayPalRestOrder(
  orderId: number,
  amountUsd: number,
  customDescription = 'E-Voucher Purchase'
): Promise<{ paypalOrderId: string; approveUrl: string } | null> {
  const token = await getPayPalAccessToken();
  if (!token) return null;

  const config = getPayPalConfig();

  try {
    const response = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `ORD-${orderId}`,
            description: customDescription,
            amount: {
              currency_code: 'USD',
              value: amountUsd.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: `${config.returnUrl}?order_id=${orderId}&paypal_success=true`,
          cancel_url: `${config.cancelUrl}?order_id=${orderId}&paypal_cancelled=true`,
          landing_page: 'LOGIN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'CONTINUE',
          brand_name: 'Vouchify E-Voucher',
        },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`[PayPal API] Create Order error: ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    const approveLink = data?.links?.find((l: any) => l.rel === 'approve')?.href;

    if (data?.id && approveLink) {
      return {
        paypalOrderId: data.id,
        approveUrl: approveLink,
      };
    }
    return null;
  } catch (error) {
    console.warn(`[PayPal API] Create Order failed: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Gọi PayPal REST API v2 để Capture giao dịch
 */
export async function capturePayPalRestOrder(paypalOrderId: string): Promise<any | null> {
  const token = await getPayPalAccessToken();
  if (!token) return null;

  const config = getPayPalConfig();

  try {
    const response = await fetch(`${config.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[PayPal API] Capture Order failed: ${(error as Error).message}`);
    return null;
  }
}
