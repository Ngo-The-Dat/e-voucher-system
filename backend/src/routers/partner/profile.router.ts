import { Router } from 'express';
import * as profileController from '../../controllers/partner/profile.controller.js';

const router = Router();

// GET  /api/partner/profile
router.get('/', profileController.getProfile);

// PUT  /api/partner/profile
router.put('/', profileController.updateProfile);

// PUT  /api/partner/profile/change-password
router.put('/change-password', profileController.changePassword);

export default router;
