import { Router } from 'express';
import * as profileController from '../../controllers/partner/profile.controller.js';
import { voucherImageUpload } from '../../middlewares/voucher-image-upload.middleware.js';

const router = Router();

// GET  /api/partner/profile
router.get('/', profileController.getProfile);

// PUT  /api/partner/profile
router.put('/', profileController.updateProfile);

// POST /api/partner/profile/logo
router.post('/logo', voucherImageUpload.single('logo'), profileController.uploadLogo);

// PUT  /api/partner/profile/change-password
router.put('/change-password', profileController.changePassword);

export default router;
