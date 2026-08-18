/**
 * =========================================================================================
 * FILE: user.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận và xử lý các yêu cầu Quản trị Người dùng (UC-ADM-01).
 *   - Các Endpoint chính:
 *       1. GET /api/admin/users: Lấy danh sách người dùng toàn hệ thống có phân trang và bộ lọc.
 *       2. GET /api/admin/users/:id: Lấy chi tiết hồ sơ 1 người dùng.
 *       3. POST /api/admin/users/:id/lock: Khóa tài khoản người dùng kèm lý do.
 *       4. POST /api/admin/users/:id/unlock: Mở khóa tài khoản người dùng.
 *       5. PATCH /api/admin/users/:id/role: Phân quyền / Thay đổi vai trò người dùng.
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as userService from '../../services/admin/user.service.js';

/**
 * GET /api/admin/users
 * Lấy danh sách người dùng (hỗ trợ tìm kiếm theo tên/email/phone, lọc theo role, status và phân trang)
 */
export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, role, status, page, limit } = req.query;
    const result = await userService.getUsers({
      search: search as string,
      role: role as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users/:id
 * Lấy chi tiết hồ sơ 1 người dùng theo ID
 */
export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
      return;
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/:id/lock
 * Khóa tài khoản người dùng kèm lý do
 */
export async function lockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do khóa tài khoản' });
      return;
    }

    const result = await userService.lockUser(userId, reason.trim(), adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/users/:id/unlock
 * Mở khóa tài khoản người dùng
 */
export async function unlockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
      return;
    }

    const result = await userService.unlockUser(userId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Thay đổi vai trò người dùng (CUSTOMER / PARTNER / ADMIN / PARTNER_EMPLOYEE)
 */
export async function changeUserRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
      return;
    }

    if (!role || !role.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp vai trò mới' });
      return;
    }

    const result = await userService.changeUserRole(userId, role.trim().toUpperCase(), adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Vai trò không hợp lệ') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}
