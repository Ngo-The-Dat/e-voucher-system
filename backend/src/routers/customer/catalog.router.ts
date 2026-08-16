import { Router } from 'express';
import * as catalogController from '../../controllers/customer/catalog.controller.js';

const router = Router();

// Public routes cho phép mọi người dùng (kể cả chưa đăng nhập) khám phá voucher và danh mục
router.get('/vouchers', catalogController.getVouchers);
router.get('/vouchers/categories', catalogController.getCategories);
router.get('/vouchers/:id', catalogController.getVoucherById);

export default router;
