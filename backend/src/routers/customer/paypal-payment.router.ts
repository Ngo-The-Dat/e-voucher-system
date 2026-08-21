/**
 * =========================================================================================
 * FILE: paypal-payment.router.ts
 * VỊ TRÍ: backend/src/routers/customer/
 * VAI TRÒ:
 *   - Router chuyên biệt cho cổng thanh toán PayPal.
 *   - Toàn bộ route yêu cầu xác thực role CUSTOMER.
 * =========================================================================================
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as paypalController from '../../controllers/customer/paypal-payment.controller.js';

const router = Router();

// Middleware bảo vệ: Chỉ cho phép tài khoản CUSTOMER đã đăng nhập
router.use(authenticate, requireRole('CUSTOMER'));

// Các endpoint chuẩn RESTful của PayPal
router.post('/create-order', paypalController.createOrder);
router.post('/capture-order', paypalController.captureOrder);
router.post('/simulate', paypalController.simulate);
router.get('/order/:orderId/status', paypalController.getStatus);

export default router;
