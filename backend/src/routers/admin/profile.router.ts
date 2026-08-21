/**
 * @file profile.router.ts
 * @description Router định nghĩa các endpoint quản lý hồ sơ và đổi mật khẩu dành cho Quản trị viên (Admin).
 */

import { Router } from 'express';
import * as profileController from '../../controllers/admin/profile.controller.js';

const router = Router();

// GET /api/admin/profile - Lấy thông tin cá nhân của Quản trị viên
router.get('/', profileController.getProfile);

// PUT /api/admin/profile - Cập nhật thông tin cá nhân của Quản trị viên
router.put('/', profileController.updateProfile);

// PUT /api/admin/profile/change-password - Đổi mật khẩu tài khoản Quản trị viên
router.put('/change-password', profileController.changePassword);

export default router;
