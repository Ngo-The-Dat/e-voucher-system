/**
 * =========================================================================================
 * FILE: momo-payment.router.ts
 * VỊ TRÍ: backend/src/routers/customer/
 * VAI TRÒ:
 *   - Router chuyên biệt cho cổng thanh toán MoMo Sandbox (/api/customer/payments/momo).
 *   - Tuyến đường Webhook IPN (/ipn) mở công khai cho máy chủ MoMo.
 *   - Các tuyến đường tương tác với đơn hàng yêu cầu xác thực role CUSTOMER.
 * =========================================================================================
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as momoController from '../../controllers/customer/momo-payment.controller.js';

const router = Router();

// 1. Webhook IPN từ MoMo (Server-to-Server) - Không yêu cầu JWT của khách
router.post('/ipn', momoController.handleIpn);

// 2. Các Endpoint yêu cầu xác thực khách hàng CUSTOMER
const customerAuth = [authenticate, requireRole('CUSTOMER')];

// Khởi tạo phiên thanh toán MoMo
router.post('/create-payment', ...customerAuth, momoController.createPaymentSession);
router.post('/create', ...customerAuth, momoController.createPaymentSession);

// Capture / Xác thực đơn hàng khi quay về từ MoMo redirect
router.post('/capture-order', ...customerAuth, momoController.captureOrder);

// Tra cứu trạng thái đơn hàng MoMo
router.get('/order/:orderId/status', ...customerAuth, momoController.getStatus);

export default router;
