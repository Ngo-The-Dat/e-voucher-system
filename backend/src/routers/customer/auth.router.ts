import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as authController from '../../controllers/customer/auth.controller.js';

const router = Router();

const otpSendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    const rateLimitInfo = (req as typeof req & { rateLimit?: { resetTime?: Date } }).rateLimit;
    const resetTime = rateLimitInfo?.resetTime?.getTime();
    const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000)) : 900;
    res.status(429).json({
      message: 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau.',
      retry_after: retryAfter,
    });
  },
});

// Public auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Forgot password routes
router.post('/forgot-password', otpSendRateLimit, authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected auth routes
router.get('/me', authenticate, requireRole('CUSTOMER'), authController.getMe);

export default router;
