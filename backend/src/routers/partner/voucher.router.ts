import { Router } from 'express';
import * as voucherController from '../../controllers/partner/voucher.controller.js';

const router = Router();

// POST   /api/partner/vouchers
router.post('/', voucherController.createVoucherProgram);

// GET    /api/partner/vouchers?status=&search=&page=&limit=
router.get('/', voucherController.getVoucherPrograms);

router.get('/categories', voucherController.getCategories);

// GET    /api/partner/vouchers/:id
router.get('/:id', voucherController.getVoucherProgramById);

// PUT    /api/partner/vouchers/:id   (chỉ khi DRAFT)
router.put('/:id', voucherController.updateVoucherProgram);

// POST   /api/partner/vouchers/:id/submit
router.post('/:id/submit', voucherController.submitForApproval);

// GET    /api/partner/vouchers/:id/approval
router.get('/:id/approval', voucherController.getApprovalStatus);

// PATCH  /api/partner/vouchers/:id/visibility
router.patch('/:id/visibility', voucherController.updateVisibility);

export default router;
