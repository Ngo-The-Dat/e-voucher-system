import { Router } from 'express';
import * as dashboardController from '../../controllers/partner/dashboard.controller.js';

const router = Router();

// GET /api/partner/dashboard/overview
router.get('/overview', dashboardController.getOverview);

// GET /api/partner/dashboard/vouchers?program_id=
router.get('/vouchers', dashboardController.getVoucherStats);

export default router;
