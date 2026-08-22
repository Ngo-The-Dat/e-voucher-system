import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { createVNPayPayment, vnpayIpn, vnpayReturn } from '../../controllers/customer/vnpay-payment.controller.js';

const router = Router();

// Khởi tạo phiên thanh toán VNPay
router.post('/create', authenticate, requireRole('CUSTOMER'), createVNPayPayment);

// Nhận IPN (Webhook) từ VNPay
router.get('/ipn', vnpayIpn);

// Xác thực giao dịch khi Redirect từ VNPay
router.get('/verify', vnpayReturn);

export default router;
