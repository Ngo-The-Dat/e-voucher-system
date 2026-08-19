/**
 * @file employee.router.ts
 * @description Router định nghĩa các endpoint tự phục vụ dành riêng cho Nhân viên đối tác (Partner Employee).
 * Yêu cầu xác thực người dùng và có vai trò `PARTNER_EMPLOYEE`.
 */

import { Router } from 'express';
import * as employeeController from '../../controllers/partner/partner-employee-profile.controller.js';

const router = Router();

// GET /api/partner/employee/profile - Lấy thông tin cá nhân và chi nhánh của nhân viên
router.get('/profile', employeeController.getProfile);

// PUT /api/partner/employee/profile - Cập nhật thông tin cá nhân của nhân viên
router.put('/profile', employeeController.updateProfile);

// PUT /api/partner/employee/change-password - Đổi mật khẩu tài khoản nhân viên
router.put('/change-password', employeeController.changePassword);

export default router;
