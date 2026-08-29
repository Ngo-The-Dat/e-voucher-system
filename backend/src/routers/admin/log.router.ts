/**
 * =========================================================================================
 * FILE: log.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho phân hệ Truy vết & Kiểm toán Nhật ký Hệ thống (Audit Trail / System Logs).
 *   - Nghiệp vụ liên quan: UC-ADM-08 (Nhật ký hệ thống).
 *   - Giúp Quản trị viên theo dõi toàn bộ hành động can thiệp (Ai làm, Lúc nào, Đối tượng nào, Trước và Sau thay đổi).
 * =========================================================================================
 */

import { Router } from 'express';
import * as logController from '../../controllers/admin/log.controller.js';

const router = Router();

// ─── 1. Tra cứu Nhật ký Kiểm toán Hệ thống ─────────────────────────────────────────
// GET /api/admin/logs: Lấy danh sách nhật ký (hỗ trợ lọc từ khóa, loại đối tượng, kết quả SUCCESS/FAILED, khoảng ngày)
router.get('/', logController.getLogs);

// GET /api/admin/logs/:id: Xem chi tiết bản ghi nhật ký (kèm dữ liệu old_values và new_values dạng JSON)
router.get('/:id', logController.getLogById);

export default router;

