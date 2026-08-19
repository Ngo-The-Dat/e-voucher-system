/**
 * @file auth.router.ts
 * @description Router định nghĩa các endpoint công khai (Public Routes) phục vụ quá trình
 * kiểm tra thông tin, gửi & xác thực OTP email, đăng ký tài khoản Đối tác và đăng nhập vào hệ thống.
 */

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as authController from '../../controllers/partner/auth.controller.js';

const router = Router();

/**
 * Middleware giới hạn tần suất gửi OTP:
 * Tối đa 5 lần gửi trong khung thời gian 15 phút (windowMs = 15 phút).
 * Ngăn ngừa hành vi Spam SMS/Email hoặc tấn công từ chối dịch vụ.
 */
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

// ─── Luồng Xác thực Đăng ký Đối tác (Registration Workflow) ────────────────────

// POST /api/partner/auth/registration/check - Kiểm tra email, CCCD/CMND, mã số thuế có bị trùng không
router.post('/registration/check', authController.checkRegistration);

// POST /api/partner/auth/registration/otp/send - Gửi mã OTP 6 số qua email (có áp dụng Rate Limit)
router.post('/registration/otp/send', otpSendRateLimit, authController.sendRegistrationOtp);

// POST /api/partner/auth/registration/otp/verify - Xác thực mã OTP người dùng nhập
router.post('/registration/otp/verify', authController.verifyRegistrationOtp);

// ─── Đăng ký & Đăng nhập ──────────────────────────────────────────────────────

// POST /api/partner/auth/register - Đăng ký tài khoản Đối tác (chờ Admin phê duyệt)
router.post('/register', authController.register);

// POST /api/partner/auth/login - Đăng nhập dành cho Đối tác (PARTNER) và Nhân viên (PARTNER_EMPLOYEE)
router.post('/login', authController.login);

export default router;
