import { Router } from 'express';
import * as authController from '../../controllers/partner/auth.controller.js';

const router = Router();

// POST /api/partner/auth/register
router.post('/register', authController.register);

// POST /api/partner/auth/login
router.post('/login', authController.login);

export default router;
