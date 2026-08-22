/**
 * =========================================================================================
 * FILE: zalopay-payment.router.ts
 * VỊ TRÍ: backend/src/routers/customer/
 * VAI TRÒ:
 *   - Định tuyến các API cho cổng thanh toán ZaloPay Sandbox v2.
 * =========================================================================================
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as zaloPayController from '../../controllers/customer/zalopay-payment.controller.js';

const router = Router();

// 1. Khởi tạo phiên thanh toán ZaloPay
router.post('/create', authenticate, zaloPayController.createPayment);

// 2. Xác thực và Capture đơn hàng khi người dùng quay lại từ ZaloPay
router.post('/capture-order', authenticate, zaloPayController.captureOrder);

// 3. Webhook Callback Server-to-Server từ ZaloPay (Không cần Customer JWT)
router.post('/callback', zaloPayController.handleCallback);

// 4. Tra cứu trạng thái thanh toán ZaloPay của đơn hàng
router.get('/order/:orderId/status', authenticate, zaloPayController.getStatus);

export default router;
