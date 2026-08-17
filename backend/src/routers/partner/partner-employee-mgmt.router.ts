/**
 * @file partner-employee-mgmt.router.ts
 * @description Router định nghĩa các endpoint quản lý nhân viên chi nhánh dành cho Đối tác (Partner).
 * Tất cả các route đều yêu cầu xác thực người dùng và có role PARTNER.
 */

import { Router } from 'express';
import * as partnerEmployeeMgmtController from '../../controllers/partner/partner-employee-mgmt.controller.js';

const router = Router();

// GET /api/partner/employees - Lấy danh sách nhân viên thuộc tất cả chi nhánh của đối tác
router.get('/', partnerEmployeeMgmtController.getEmployees);

// POST /api/partner/employees - Tạo tài khoản nhân viên mới và gán vào chi nhánh
router.post('/', partnerEmployeeMgmtController.createEmployee);

// PUT /api/partner/employees/:id - Cập nhật thông tin nhân viên hoặc chuyển chi nhánh
router.put('/:id', partnerEmployeeMgmtController.updateEmployee);

export default router;
