/**
 * @file profile.router.ts
 * @description Router định nghĩa các endpoint quản lý hồ sơ đối tác (Partner Profile).
 * Tất cả các route này đều yêu cầu xác thực người dùng và có role PARTNER.
 */

import { Router } from 'express';
import * as profileController from '../../controllers/partner/profile.controller.js';
import { voucherImageUpload } from '../../middlewares/voucher-image-upload.middleware.js';

const router = Router();

// GET /api/partner/profile - Lấy thông tin hồ sơ doanh nghiệp của đối tác đang đăng nhập
router.get('/', profileController.getProfile);

// PUT /api/partner/profile - Cập nhật thông tin đại diện & pháp lý doanh nghiệp
router.put('/', profileController.updateProfile);

// POST /api/partner/profile/logo - Tải lên và lưu trữ logo thương hiệu
router.post('/logo', voucherImageUpload.single('logo'), profileController.uploadLogo);

// PUT /api/partner/profile/change-password - Đổi mật khẩu đăng nhập
router.put('/change-password', profileController.changePassword);

export default router;
