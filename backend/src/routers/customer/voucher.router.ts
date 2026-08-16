import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as voucherController from '../../controllers/customer/voucher.controller.js';

const router = Router();

// Tất cả các route kho voucher cá nhân của khách hàng yêu cầu xác thực role CUSTOMER
router.use(authenticate, requireRole('CUSTOMER'));

router.get('/', voucherController.getMyVouchers);
router.get('/:id', voucherController.getMyVoucherById);

export default router;
