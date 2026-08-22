/**
 * =========================================================================================
 * FILE: stripe.ts
 * VỊ TRÍ: backend/src/config/
 * VAI TRÒ:
 *   - Quản lý cấu hình kết nối cổng thanh toán Stripe (Secret Key, Publishable Key, Return URL, Cancel URL).
 *   - Khởi tạo Stripe SDK Client theo mô hình Singleton để tái sử dụng xuyên suốt ứng dụng.
 * =========================================================================================
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

// Lấy Secret Key từ file .env (ở chế độ test sẽ có tiền tố sk_test_...)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.warn('[Stripe Config] Cảnh báo: STRIPE_SECRET_KEY chưa được cấu hình trong .env');
}

/**
 * Singleton client của Stripe SDK
 * Dùng để tương tác trực tiếp với máy chủ Stripe API (tạo checkout session, tra cứu trạng thái, hoàn tiền,...)
 */
export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});

/**
 * Lấy các thông số cấu hình URL điều hướng sau thanh toán
 * @returns {Object} Bao gồm secretKey, publishableKey, returnUrl và cancelUrl
 */
export function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  // URL điều hướng về trang Lịch sử đơn hàng sau khi thanh toán thành công hoặc hủy
  const returnUrl = process.env.STRIPE_RETURN_URL || 'http://localhost:3000/orders';
  const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/orders';

  return {
    secretKey,
    publishableKey,
    returnUrl,
    cancelUrl,
  };
}

export default stripe;
