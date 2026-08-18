import { Router } from 'express';
import * as catalogController from '../../controllers/customer/catalog.controller.js';

const router = Router();

// Public routes cho phép mọi người dùng (kể cả chưa đăng nhập) khám phá voucher và danh mục
router.get('/vouchers', catalogController.getVouchers);
router.get('/vouchers/categories', catalogController.getCategories);
router.get('/vouchers/:id', catalogController.getVoucherById);

// Public banners, popups, contents
router.get('/banners', catalogController.getBanners);
router.get('/popups/active', catalogController.getActivePopups);
router.get('/contents', catalogController.getContents);
router.get('/contents/:id', catalogController.getContentById);

export default router;
