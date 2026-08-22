/**
 * =========================================================================================
 * FILE: stripe-payment.router.ts
 * VỊ TRÍ: backend/src/routers/customer/
 * VAI TRÒ:
 *   - Router chuyên biệt cho cổng thanh toán Stripe.
 *   - Toàn bộ route yêu cầu xác thực role CUSTOMER.
 * =========================================================================================
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as stripeController from '../../controllers/customer/stripe-payment.controller.js';

const router = Router();

// Middleware bảo vệ: Chỉ cho phép tài khoản CUSTOMER đã đăng nhập
router.use(authenticate, requireRole('CUSTOMER'));

// Các endpoint Stripe Checkout
router.post('/create-checkout-session', stripeController.createCheckoutSession);
router.post('/capture-order', stripeController.captureOrder);
router.get('/order/:orderId/status', stripeController.getStatus);

export default router;
