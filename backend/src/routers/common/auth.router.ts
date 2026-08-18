import { Router } from 'express';
import * as authController from '../../controllers/common/auth.controller.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authController.login);

export default router;
