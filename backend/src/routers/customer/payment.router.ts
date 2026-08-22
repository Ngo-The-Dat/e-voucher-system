/**
 * =========================================================================================
 * FILE: payment.router.ts
 * VỊ TRÍ: backend/src/routers/customer/
 * VAI TRÒ:
 *   - Router tổng quản lý toàn bộ các cổng thanh toán phía khách hàng (/api/customer/payments).
 *   - Cung cấp API danh sách phương thức thanh toán chung (/methods).
 *   - Định tuyến từng cổng thanh toán theo Namespace chuẩn (PayPal, Stripe, VNPay, MoMo).
 * =========================================================================================
 */

import { Router } from 'express';
import { getPaymentMethods } from '../../controllers/customer/payment.controller.js';
import paypalRouter from './paypal-payment.router.js';
import stripeRouter from './stripe-payment.router.js';
import zalopayRouter from './zalopay-payment.router.js';
import vnpayRouter from './vnpay-payment.router.js';

const router = Router();

// 1. Endpoint chung: Lấy danh sách các phương thức thanh toán khả dụng
router.get('/methods', getPaymentMethods);

// 2. Namespace cổng thanh toán PayPal (/api/customer/payments/paypal/...)
router.use('/paypal', paypalRouter);

// 3. Namespace cổng thanh toán Stripe (/api/customer/payments/stripe/...)
router.use('/stripe', stripeRouter);

// 4. Namespace cổng thanh toán ZaloPay (/api/customer/payments/zalopay/...)
router.use('/zalopay', zalopayRouter);

// 5. Cổng thanh toán VNPay (/api/customer/payments/vnpay/...)
router.use('/vnpay', vnpayRouter);

export default router;
