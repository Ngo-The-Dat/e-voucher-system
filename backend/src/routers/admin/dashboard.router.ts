import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboard.controller.js';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/stats', dashboardController.getOverview);

export default router;
