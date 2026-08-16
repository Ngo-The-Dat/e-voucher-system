import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as authController from '../../controllers/customer/auth.controller.js';

const router = Router();

// Public auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected auth routes
router.get('/me', authenticate, requireRole('CUSTOMER'), authController.getMe);

export default router;
