import { Router } from 'express';
import * as catalogController from '../../controllers/customer/catalog.controller.js';

const router = Router();

// Public routes (Không yêu cầu đăng nhập)
router.get('/', catalogController.getVouchers);
router.get('/:id', catalogController.getVoucherById);

export default router;
