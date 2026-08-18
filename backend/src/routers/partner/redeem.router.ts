/**
 * @file redeem.router.ts
 * @description Router định nghĩa các endpoint tra cứu và đổi (Redeem) voucher tại quầy chi nhánh.
 * Cho phép cả 2 vai trò `PARTNER` và `PARTNER_EMPLOYEE` truy cập.
 */

import { Router } from 'express';
import * as redeemController from '../../controllers/partner/redeem.controller.js';

const router = Router();

// GET /api/partner/redeem/lookup?code=<voucherCode> - Tra cứu voucher theo mã code
router.get('/lookup', redeemController.lookupVoucher);

// POST /api/partner/redeem/lookup-qr - Tra cứu voucher theo payload mã QR
router.post('/lookup-qr', redeemController.lookupVoucherByQr);

// POST /api/partner/redeem - Xác nhận đổi voucher tại chi nhánh
router.post('/', redeemController.redeemVoucher);

export default router;
