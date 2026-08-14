import { Router } from 'express';
import * as voucherController from '../../controllers/partner/voucher.controller.js';
import * as voucherImageController from '../../controllers/partner/voucher-image.controller.js';
import { voucherImageUpload } from '../../middlewares/voucher-image-upload.middleware.js';

const router = Router();

// POST   /api/partner/vouchers
router.post('/', voucherController.createVoucherProgram);

// GET    /api/partner/vouchers?status=&search=&page=&limit=
router.get('/', voucherController.getVoucherPrograms);

router.get('/categories', voucherController.getCategories);

router.post('/:id/images', voucherImageUpload.single('image'), voucherImageController.uploadImage);
router.put('/:id/images/order', voucherImageController.reorder);
router.patch('/:id/images/:imageId/primary', voucherImageController.setPrimary);
router.delete('/:id/images/:imageId', voucherImageController.remove);

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
