/**
 * =========================================================================================
 * FILE: user.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho phân hệ Quản lý & Phân quyền Người dùng (User Management).
 *   - Nghiệp vụ liên quan: UC-ADM-01 (Quản lý người dùng), bao gồm:
 *       1. Danh sách người dùng có tìm kiếm, lọc vai trò/trạng thái và phân trang.
 *       2. Xem chi tiết hồ sơ tài khoản người dùng.
 *       3. Khóa tài khoản (bắt buộc kèm lý do) và Mở khóa tài khoản.
 *       4. Thay đổi vai trò (Role-Based Access Control - RBAC) và gán chi nhánh trực thuộc.
 * =========================================================================================
 */

import { Router } from 'express';
import * as userController from '../../controllers/admin/user.controller.js';

const router = Router();

// ─── 1. Truy vấn Danh sách & Chi tiết Người dùng ───────────────────────────────────
// GET /api/admin/users: Lấy danh sách toàn bộ người dùng (hỗ trợ search, filter role, status, paging)
router.get('/', userController.getUsers);

// GET /api/admin/users/branches: Lấy danh sách chi nhánh phục vụ việc gán chi nhánh khi đổi vai trò sang PARTNER_EMPLOYEE
router.get('/branches', userController.getBranchesForAssignment);

// GET /api/admin/users/:id: Lấy chi tiết thông tin hồ sơ 1 người dùng theo ID
router.get('/:id', userController.getUserById);

// ─── 2. Quản trị Trạng thái & Phân quyền Tài khoản ──────────────────────────────────
// POST /api/admin/users/:id/lock: Khóa tài khoản người dùng kèm lý do (Lưu vào bảng user_locks)
router.post('/:id/lock', userController.lockUser);

// POST /api/admin/users/:id/unlock: Mở khóa khôi phục tài khoản về trạng thái ACTIVE
router.post('/:id/unlock', userController.unlockUser);

// PUT /api/admin/users/:id/role: Phân quyền vai trò người dùng (CUSTOMER, PARTNER, PARTNER_EMPLOYEE)
router.put('/:id/role', userController.changeUserRole);

export default router;

