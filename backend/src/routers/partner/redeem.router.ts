import { Router } from 'express';
import * as redeemController from '../../controllers/partner/redeem.controller.js';

const router = Router();

// GET  /api/partner/redeem/lookup?code=<voucherCode>
router.get('/lookup', redeemController.lookupVoucher);

// POST /api/partner/redeem/lookup-qr
router.post('/lookup-qr', redeemController.lookupVoucherByQr);

// POST /api/partner/redeem
router.post('/', redeemController.redeemVoucher);

export default router;
