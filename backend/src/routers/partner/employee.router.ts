import { Router } from 'express';
import * as employeeController from '../../controllers/partner/employee.controller.js';

const router = Router();

// GET  /api/partner/employee/profile
router.get('/profile', employeeController.getProfile);

// PUT  /api/partner/employee/profile
router.put('/profile', employeeController.updateProfile);

// PUT  /api/partner/employee/change-password
router.put('/change-password', employeeController.changePassword);

export default router;
