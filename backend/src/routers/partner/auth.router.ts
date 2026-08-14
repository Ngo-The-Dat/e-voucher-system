import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as authController from '../../controllers/partner/auth.controller.js';

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

router.post('/registration/check', authController.checkRegistration);
router.post('/registration/otp/send', otpSendRateLimit, authController.sendRegistrationOtp);
router.post('/registration/otp/verify', authController.verifyRegistrationOtp);

// POST /api/partner/auth/register
router.post('/register', authController.register);

// POST /api/partner/auth/login
router.post('/login', authController.login);

export default router;
