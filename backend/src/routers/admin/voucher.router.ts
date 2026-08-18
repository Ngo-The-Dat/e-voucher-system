import { Router } from 'express';
import * as voucherController from '../../controllers/admin/voucher.controller.js';

const router = Router();

// Danh sách & chi tiết voucher chờ duyệt
router.get('/pending', voucherController.getPendingVouchers);
router.get('/pending/:id', voucherController.getPendingVoucherById);

// Hành động duyệt / từ chối
router.post('/pending/:id/approve', voucherController.approveVoucher);
router.post('/pending/:id/reject', voucherController.rejectVoucher);

// Quản lý voucher đã qua xử lý
router.get('/manage', voucherController.getManagedVouchers);
router.get('/manage/:id', voucherController.getManagedVoucherById);
router.put('/:id/status', voucherController.updateVoucherStatus);

export default router;
