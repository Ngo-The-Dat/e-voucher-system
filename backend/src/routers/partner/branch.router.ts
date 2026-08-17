/**
 * @file branch.router.ts
 * @description Router định nghĩa các endpoint CRUD quản lý chi nhánh của Đối tác (Branches).
 * Tất cả các route đều yêu cầu xác thực người dùng và có role PARTNER.
 */

import { Router } from 'express';
import * as branchController from '../../controllers/partner/branch.controller.js';

const router = Router();

// POST /api/partner/branches - Tạo chi nhánh mới
router.post('/', branchController.createBranch);

// GET /api/partner/branches - Lấy danh sách toàn bộ chi nhánh của đối tác
router.get('/', branchController.getBranches);

// GET /api/partner/branches/:id - Xem thông tin chi tiết một chi nhánh
router.get('/:id', branchController.getBranchById);

// PUT /api/partner/branches/:id - Cập nhật thông tin chi nhánh
router.put('/:id', branchController.updateBranch);

// DELETE /api/partner/branches/:id - Vô hiệu hóa (xóa mềm) chi nhánh
router.delete('/:id', branchController.deleteBranch);

export default router;
